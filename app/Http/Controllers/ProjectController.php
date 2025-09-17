<?php

namespace App\Http\Controllers;

use function abort_unless;

use App\Models\ActivityLog;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

use function response;
use function trim;

/**
 * =============================================================================
 * 概要
 * -----------------------------------------------------------------------------
 * Project のCRUDを提供するJSON APIコントローラ。
 * ルーティングは /projects 配下（index/store/update/destroy）。
 *
 * 目的
 * -----------------------------------------------------------------------------
 * - Taskフォームでの「入力＋サジェスト」体験を実現するための堅いバックエンドを用意。
 * - 既存名は選択、未存在名は即時作成、後から改名/削除も可能。
 *
 * ゴール（Insomniaテスト観点）
 * -----------------------------------------------------------------------------
 * 1) GET  /projects           → 自分のプロジェクト一覧がJSONで返る
 * 2) POST /projects           → nameを渡すと新規作成され201で返る
 * 3) PUT  /projects/{id}      → nameやcolorを更新できる
 * 4) DELETE /projects/{id}    → 削除で204（関連Taskは未割当に戻る: FKのnullOnDelete）
 *
 * 簡易テスト例（Insomnia/cURL）
 * -----------------------------------------------------------------------------
 * # 一覧
 * GET /projects
 *
 * # 作成
 * POST /projects
 * { "name": "学習", "color": "#10b981" }
 *
 * # 更新
 * PUT /projects/3
 * { "name": "生活", "color": "#f59e0b" }
 *
 * # 削除
 * DELETE /projects/3
 *
 * セキュリティ/設計メモ
 * -----------------------------------------------------------------------------
 * - owner_id による所有権チェックを各操作で必須化（他人のProjectは触れない）。
 * - name は owner_id 単位でユニーク（Rule::unique + where(owner_id)）。
 * - ActivityLog を各操作で記録（だれが・いつ・何を変更したかの監査に利用）。
 * =============================================================================
 */
class ProjectController extends Controller
{
    /**
     * 自分のProject一覧を返す。
     * クエリ: ?q=… を付けると前方一致/部分一致検索。
     */
    public function index(Request $request) : JsonResponse
    {
        $uid = $request->user()->id;

        $query = Project::query()->where('owner_id', $uid);

        //サジェスト用検索
        if ($kw = trim((string) $request->query('q', ''))) {
            $query->where('name', 'like', "%{$kw}%");
        }

        $rows = $query->orderBy('name')->get(['id','name','color']);

        return response()->json($rows);
    }
    /**
     * 新規作成。name（必須）, color（任意）
     * - 同一所有者内で name ユニーク
     * - 作成後は201 Created と作成行を返す
     */
    public function store(Request $request) : JsonResponse
    {
        $uid = $request->user()->id;

        $data = $request->validate([
            'name' => ['required','string', 'max:120',
                Rule::unique('projects', 'name')->where(fn ($q) => $q->where('owner_id', $uid)),
            ],
            'color' => ['nullable','string','max:16'],
        ]);
        $project = Project::create([
            'owner_id' => $uid,
            'name'     => $data['name'],
            'color'    => $data['color'] ?? null,
        ]);

        ActivityLog::record('project.create', $project, null, $project->only(['name','color']));

        return response()->json($project, '201');
    }
    /**
     * 更新。name/color を上書き。
     * - 所有権チェック
     * - 同一所有者内のユニーク制約を維持したまま更新
     */
    public function update(Request $request, Project $project) : JsonResponse
    {
        // 所有権チェック：Policy未実装でも安全に
        abort_unless($project->owner_id === Auth::id(), 403, 'Forbidden');

        $uid = $request->user()->id;

        //Rule::unique('projects','name') にそのままかけると「自分自身」
        //の名前でも重複判定になるため、このIDのレコードは無視して判定してね
        $data = $request->validate([
            'name' => ['required','string','max:120',
                Rule::unique('projects', 'name')
                ->where(fn ($q) => $q->where('owner_id', $uid))
                ->ignore($project->id),
            ],
            'color' => ['nullable','string', 'max:16'],
        ]);
        $before = $project->only(['name','color']);
        $project->update([
            'name'  => $data['name'],
            'color' => $data['color'] ?? null,
        ]);

        $after = $project->only(['name','color']);
        ActivityLog::record('projects.update', $project, $before, $after);

        return response()->json($project);
    }

    /**
     * 削除。
     * - 所有権チェック
     * - tasks.project_id は migration で nullOnDelete 済み → 未割当に戻る
     * - 204 No Content
     */
    public function destroy(Request $request, Project $project) : JsonResponse
    {
        abort_unless($project->owner_id === Auth::id(), 403, 'Forbidden');

        $before = $project->only(['name', 'color']);
        $project->delete();

        ActivityLog::record('project.delete', $project, $before, null);

        return response()->json(null, 204);
    }
}
