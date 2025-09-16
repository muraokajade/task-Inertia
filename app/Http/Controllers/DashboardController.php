<?php

namespace App\Http\Controllers;

use App\Models\Task;

use function ceil;
use function env;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Auth;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use function max;
use function min;
use function now;
use function round;

/**
 * ダッシュボード画面用コントローラ
 *
 * 目的:
 * - 「いまの状況」を 1 画面で即把握できる 4 指標（今週完了 / 期限超過 / WIP / Stress）を返す
 * - 「今日やるべき順」Triage（上位 10 件）のリストを返す（まずは表示だけ）
 *
 * 返却先:
 * - Inertia ページ `resources/js/Pages/Dashboard.tsx` を想定
 *
 * セキュリティ:
 * - ログイン済みユーザー（auth / verified）前提
 * - データは creator_id = ログインユーザー のみに限定
 */
class DashboardController extends Controller
{
    /**
     * ダッシュボードのデータを集計して Inertia に渡す。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     *
     * props 仕様:
     * - stats: array{
     *     done_this_week:int,     // 今週の完了件数
     *     overdue:int,            // 未完了のうち期限切れ
     *     wip:int,                // 'doing' 件数
     *     urgent_open:int,        // 未完了の 'urgent' 件数
     *     done_today:int,         // 今日完了した件数
     *     stress:int,             // ストレススコア（0..100）
     *     ttg:int                 // Time-to-Green（あと何件完了すれば緑域かの目安）
     *   }
     * - triage: list<array{
     *     id:int, title:string, priority:string, status:string, due_date:?string(YYYY-MM-DD)
     *   }>
     *
     * 集計の考え方（最小・高速）:
     * - 必ず creator_id で絞る（ユーザー毎のダッシュボ）
     * - 期間系（日/週）は DB の関数に依らず PHP 側の now()/startOfWeek()/endOfWeek() を使い、whereBetween / whereDate で抽出
     * - カラム選択は必要最小限（select）で負荷軽減
     */
    public function index(Request $request)
    {
        // 1) 対象ユーザーと日付
        $uid = Auth::id();
        $now = now();
        $ws  = $now->copy()->startOfWeek();
        $we  = $now->copy()->endOfWeek();

        // 2) 基本カウント集計
        //    - それぞれ単一クエリの count() で取得（集計ビューでは十分高速）
        $doneThisWeek = Task::where('creator_id', $uid)
            ->whereBetween('completed_at', [$ws, $we])
            ->count();

        $overdue = Task::where('creator_id', $uid)
            ->whereNull('completed_at')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $now->toDateString())
            ->count();

        //進行中
        $wip = Task::where('creator_id', $uid)
            ->where('status', 'doing')
            ->count();

        //至急なのに終わってない
        $urgentOpen = Task::where('creator_id', $uid)
            ->where('priority', 'urgent')
            ->where('status', '!=', 'done')
            ->count();

        //今日完了したタスク
        $doneToday = Task::where('creator_id', $uid)
            ->whereDate('completed_at', $now->toDateString())
            ->count();

        // 3) ストレススコア算出（暫定式）
        //    - 係数は .env で調整可能にしておくとデモ時に便利
        //      例）STRESS_W_OVERDUE=20, STRESS_W_WIP=10, STRESS_W_URGENT=5, STRESS_W_DONE_TODAY=-5
        $wOverdue   = (int) env('STRESS_W_OVERDUE', 20);
        $wWip       = (int) env('STRESS_W_WIP', 10);
        $wUrgent    = (int) env('STRESS_W_URGENT', 5);
        $wDoneToday = (int) env('STRESS_W_DONE_TODAY', -5);

        //    - スコア計算：線形結合 → 0..100 にクランプ
        $rawStress = $wOverdue * $overdue + $wWip * $wip + $wUrgent * $urgentOpen + $wDoneToday * $doneToday;
        $stress    = (int) round(min(100, max(0, $rawStress)));

        //    - Time-to-Green: 「あと何件完了すれば “緑” に行けそうか」のラフな目安
        //      ここでは単純に stress を 10 で割って切り上げ（係数は後でチューニング可）
        $ttg = max(0, (int) ceil($stress / 10));

        // 4) Triage（今日やる順）上位10件
        //    - 並び順の意図:
        //      1. 優先度（urgent > high > normal > low）
        //      2. 締切日（早い順 / NULL は最後）
        //      3. 作成日（古いものを先に）
        $triage = Task::select(['id','title', 'priority','status','due_date'])
            ->where('creator_id', $uid)
            ->whereIn('status', ['todo', 'doing'])
            ->orderByRaw("CASE priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'normal' THEN 3
                ELSE 4 END")
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC')
            ->orderBy('created_at', 'asc')
            ->limit(10)
            ->get()
            ->map(function (Task $t) : array {
                return [
                    'id'       => $t->id,
                    'title'    => $t->title,
                    'priority' => $t->priority,
                    'status'   => $t->status,
                    'due_date' => $t->due_date?->toDateString(), // Carbon|null → 'YYYY-MM-DD'|null
                ];
            });
        // 5) Inertia でフロントへ返却
        //    - フロント側では、stress の色分け（緑/黄/赤）と「あと N 件でGreen」を表示

        // 4.5) プロジェクト別集計（WIP / Overdue）-----------------------------
        $byProject = DB::table('tasks as t')
            ->leftJoin('projects as p', 'p.id', '=', 't.project_id')
            ->where('creator_id', $uid)
            ->selectRaw("COALESCE(p.name,'未割当') as project")
            ->selectRaw("SUM(CASE WHEN t.status = 'doing' THEN 1 ELSE 0 END) as wip")
            ->selectRaw("
                    SUM(CASE WHEN t.status != 'done'
                            AND t.due_date IS NOT NULL
                            AND t.due_date < ? THEN 1 ELSE 0 END) as overdue", [$now->toDateString()])
            ->groupBy('project')
            ->orderBy('overdue')
            ->orderBy('wip')
            ->limit(8)
            ->get();
        return Inertia::render('Dashboard', [
            'stats' => [
                'done_this_week' => $doneThisWeek,
                'overdue'        => $overdue,
                'wip'            => $wip,
                'urgent_open'    => $urgentOpen,
                'done_today'     => $doneToday,
                'stress'         => $stress,
                'ttg'            => $ttg,
            ],
            'triage'     => $triage,
            'by_project' => $byProject,
        ]);
    }
}
