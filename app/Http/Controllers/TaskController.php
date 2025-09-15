<?php

namespace App\Http\Controllers;

use App\Models\Task;                       // Eloquentモデル
use Illuminate\Http\Request;               // HTTPリクエスト
use Illuminate\Validation\Rule;            // バリデーション用ルール
use Inertia\Inertia;                       // Inertiaレスポンス
use Illuminate\Support\Facades\DB;
class TaskController extends Controller
{
    public function index(Request $request)
    {
        // 1) クエリパラメータを一括バリデーションして取得
        //    - nullable: 省略可能
        //    - Rule::in: 指定候補のみ許可（安全）
        $validated = $request->validate([
            'q'           => ['nullable','string','max:160'],                      // キーワード
            'status'      => ['nullable', Rule::in(['todo','doing','done','archived'])],
            'priority'    => ['nullable', Rule::in(['low','normal','high','urgent'])],
            'project_id'  => ['nullable','integer'],
            'assignee_id' => ['nullable','integer'],
            'overdue'     => ['nullable','boolean'],                               // 期限切れフラグ
            'due_from'    => ['nullable','date'],                                  // 期限(下限)
            'due_to'      => ['nullable','date'],                                  // 期限(上限)
            'sort'        => ['nullable', Rule::in(['position','due_date','created_at','priority','status'])],
            'dir'         => ['nullable', Rule::in(['asc','desc'])],               // 並び方向
            'per_page'    => ['nullable','integer','min:5','max:100'],             // 1ページ件数
        ]);

        // 2) ベースクエリ作成（必要な列だけselectで性能UP）
        $query = Task::query()
            ->select(['id','title','status','priority','due_date','position','created_at']);

        // 3) キーワード検索（title OR description）
        if (!empty($validated['q'])) {
            $keyword = $validated['q'];

            // かっこ()で括ったサブ条件を作るためのクロージャ
            // $subQuery の名前は任意（$qq でも $x でも可）
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery
                    ->where('title', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%");
            });
        }

        // 4) 単純フィルタ（存在する時だけ = で絞る）
        if (!empty($validated['status']))      { $query->where('status',      $validated['status']); }
        if (!empty($validated['priority']))    { $query->where('priority',    $validated['priority']); }
        if (!empty($validated['project_id']))  { $query->where('project_id',  $validated['project_id']); }
        if (!empty($validated['assignee_id'])) { $query->where('assignee_id', $validated['assignee_id']); }

        // 5) 期限フィルタ
        if (!empty($validated['due_from'])) {
            $query->whereDate('due_date', '>=', $validated['due_from']);
        }
        if (!empty($validated['due_to'])) {
            $query->whereDate('due_date', '<=', $validated['due_to']);
        }
        if (!empty($validated['overdue'])) {
            // 期限切れ = 未完了 & due_dateが今日より前
            $query->whereNull('completed_at')
                  ->whereNotNull('due_date')
                  ->whereDate('due_date', '<', now()->toDateString());
        }

        // 6) 並び順
        // position: “手動並び替え用”の整数カラム（小さいほど上に出したい）
        $sortColumn    = $validated['sort'] ?? 'position';
        $sortDirection = $validated['dir']  ?? 'asc';

        if ($sortColumn === 'position') {
            // 手動順を最優先。同順位は新しいIDを先に
            $query->orderBy('position', 'asc')
                  ->orderByDesc('id');
        } else {
            // 指定列で並べ、同値は新しいIDを先に
            $query->orderBy($sortColumn, $sortDirection)
                  ->orderByDesc('id');
        }

        // 7) ページネーション（withQueryStringで検索条件を次ページにも引き継ぐ）
        $perPage = (int)($validated['per_page'] ?? 10);

        $paginator = $query
            ->paginate($perPage) 
            ->withQueryString();

        // 8) through: 取得後に“各行の形”を整える（SQLは増えない）
        $tasks = $paginator->through(function (Task $task): array {
            return [
                'id'       => $task->id,
                'title'    => $task->title,
                'status'   => $task->status,
                'priority' => $task->priority,
                // ?-> はヌル安全演算子。nullならメソッドを呼ばず null のまま返る
                'due_date' => $task->due_date?->toDateString(),  // "YYYY-MM-DD"
            ];
        });

        // 9) Reactページへ渡す（filtersはフォーム初期値に使う）
        return Inertia::render('Tasks/Index', [
            'tasks'   => $tasks,
            'filters' => [
                'q'           => $validated['q']           ?? null,
                'status'      => $validated['status']      ?? null,
                'priority'    => $validated['priority']    ?? null,
                'project_id'  => $validated['project_id']  ?? null,
                'assignee_id' => $validated['assignee_id'] ?? null,
                'overdue'     => (bool)($validated['overdue'] ?? false),
                'due_from'    => $validated['due_from']    ?? null,
                'due_to'      => $validated['due_to']      ?? null,
                'sort'        => $sortColumn,
                'dir'         => $sortDirection,
                'per_page'    => $perPage,
            ],
        ]);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['todo','doing','done','archived'])],
            'priority' => ['nullable', Rule::in(['low','normal','high','urgent'])],
            'due_date' => ['nullable','date']
        ]);

        $status = $validated['status'] ?? 'todo';
        $priority = $validated['priority'] ?? 'normal';
        $due_date = $validated['due_date'] ?? '';

        $nextPost = (Task::max('position') ?? 0) + 1;

        $completedAt = $status === 'done' ? now() : null;

        Task::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $status,
            'priority' => $priority,
            'due_date' => $due_date,
            'position' => $nextPost,
            'creator_id' => auth()->id(),
            'completed_at' => $completedAt,
        ]);

        return redirect()->route('tasks.index')->with('flash','保存しました');
    }

    public function update(Request $request, Task $task) {
        $data = $request->validate([
            'title'      => ['required','string','max:160'],
            'description'=> ['nullable','string'],
            'status'     => ['required','in:todo,doing,done,archived'],
            'priority'   => ['required','in:low,normal,high,urgent'],
            'due_date'   => ['nullable','date'],
        ]);

        if(($data['due_date']?? null) === '') {
            $data['due_date'] = null;
        }
        $data['completed_at'] = $data['status'] === 'done' ? now() : null;

        $task->update($data);

        return redirect()->route('tasks.index');
        
    }

    public function destroy(Task $task) {
        $task->delete();
        return back();
    }

    public function edit(Task $task) {
        return Inertia::render('Tasks/Edit',[
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'priority' => $task->priority,
                'due_date' => $task->due_date?->toDateString(),
            ],
        ]);
    }
    public function bulk(Request $request) {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids,*' => ['integer', 'exists:tasks,id'],
            'action' => ['required', Rule::in(['complete','delete'])],
        ]);

        if($data['action'] === 'complete') {
            DB::transaction(function() use($data) {
                Task::whereIn('id',$data['ids'])->update([
                    'status' => 'done',
                    'completed_at' => now(),
                ]);
            }); 
            return back()->with('flash','選択したタスクを完了にしました');
        }
        DB::transaction(function() use ($data) {
            Task::whereIn('id', $data['ids'])->delete();
        }); 
        return back()->with('flash', '選択したタスクを削除しました');
    }

    /**
     * DnDの結果として渡された id 配列の順に position を更新する
     *
     * リクエスト例:
     * PATCH /tasks/reorder
     * { "ids": [12, 7, 3, 19, ...] }
     *
     * ポリシー/権限:
     * - ここでは「自分が作成したタスクだけ」を並び替え可能とする例（必要に応じて調整）
     * - SoftDeletes を考慮（deleted_at が null のものだけ）
     */
    public function reorder(Request $request) {
        
        $data = $request->validate([
            'ids' => ['required','array', 'min:1'],
            'ids.*' => [
                'integer',
                'distinct',
                Rule::exists('tasks','id')->whereNotNull('deleted_at'),
            ],
        ]);
        $ids = $data['ids'];

        // 2) 権限チェック（例：自分のタスクのみ並び替え可）
        //    - マルチユーザーやプロジェクト単位の権限がある場合はここを適宜変更
        $ownedIds = Task::query()
            ->whereIn('id', $ids)
            ->where('creator_id', auth()->id())
            ->pluck('id')
            ->all();
        if (count($ownedIds) !== count($ids)) {
            return back()->with('error', '並び替え対象に権限の無いタスクが含まれています。');
        }

        // 3) 位置の再採番（1,2,3,...）— この配列に含まれる行だけ更新
        //    ※ 1件ずつのUPDATEだが、ページ内(最大100件)なら十分速い。安全性重視でトランザクションに包む
        DB::transaction(function () use ($ids) {
            foreach($ids as $index => $id) {
                Task::whereKey($id)->update(['position' => $index + 1]);
            }
        });
        return back()->with('flash','並び順を保存しました。');
    }


}
