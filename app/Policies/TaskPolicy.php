<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TaskPolicy
{
    /**
     * 一覧取得を許可する（自分の絞り込みはController側のwhereで担保）
     *
     * @param  User  $user  認証ユーザー
     * @return bool         常にtrue
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * タスクの閲覧可否
     *
     * @param  User  $user  認証ユーザー
     * @param  Task  $task  対象タスク
     * @return bool         クリエータ本人のみ許可
     */
    public function view(User $user, Task $task): bool
    {
        return $task->creator_id === $user->id;
    }

    /**
     * タスクの作成可否
     *
     * @param  User  $user  認証ユーザー
     * @return bool         常に許可（レート制限や権限制御は別途）
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * タスクの更新可否
     *
     * @param  User  $user  認証ユーザー
     * @param  Task  $task  対象タスク
     * @return bool         クリエータ本人のみ許可
     */
    public function update(User $user, Task $task): bool
    {
        return $task->creator_id === $user->id;
    }

    /**
     * タスクの削除可否
     *
     * @param  User  $user  認証ユーザー
     * @param  Task  $task  対象タスク
     * @return bool         クリエータ本人のみ許可
     */
    public function delete(User $user, Task $task): bool
    {
        return $task->creator_id === $user->id;
    }

    /**
     * 並び替え（reorder）の可否
     *
     * @param  User  $user  認証ユーザー
     * @param  Task  $task  対象タスク
     * @return bool         クリエータ本人のみ許可
     */
    public function reorder(User $user, Task $task): bool
    {
        return $task->creator_id === $user->id;
    }
}
