import { Head, Link, useForm } from "@inertiajs/react";
import { title } from "process";

type Task = {
    id: number;
    title: string;
    description?: string | null;
    status: "todo" | "doing" | "done" | "archived";
    priority: "low" | "normal" | "high" | "urgent";
    due_date: string | null;
};

type TaskForm = {
    title: string;
    description: string; // ← nullを許さない
    status: "todo" | "doing" | "done" | "archived";
    priority: "low" | "normal" | "high" | "urgent";
    due_date: string; // ← '' or 'YYYY-MM-DD'
};

export default function Edit({ task }: { task: Task }) {
    const { data, setData, processing, errors, put } = useForm<TaskForm>({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ?? "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/tasks/${task.id}`);
    };

    return (
        <div className="p-6 space-y-4 max-w-2xl">
            <Head title={`編集: ${task.title}`} />
            <h1 className="text-2xl font-bold">タスク編集</h1>

            <form onSubmit={submit} className="space-y-3">
                {/* タイトル */}
                <div>
                    <label className="block text-sm mb-1">タイトル</label>
                    {/* タイトル */}
                    <input
                        className={`border p-2 w-full ${
                            errors.title ? "border-red-500" : ""
                        }`}
                        placeholder="タスクのタイトル"
                        value={data.title}
                        onChange={(e) => setData("title", e.target.value)}
                        aria-invalid={!!errors.title}
                    />
                    {errors.title && (
                        <p className="text-red-600 text-sm" role="alert">
                            {errors.title}
                        </p>
                    )}
                </div>

                {/* 説明 */}
                <div>
                    <label className="block text-sm mb-1">説明</label>
                    {/* 説明 */}
                    <textarea
                        className={`border p-2 w-full h-32 ${
                            errors.description ? "border-red-500" : ""
                        }`}
                        placeholder="詳細・メモなど"
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        aria-invalid={!!errors.description}
                    />
                    {errors.description && (
                        <p className="text-red-600 text-sm" role="alert">
                            {errors.description}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    {/* ステータス */}
                    <div>
                        <label className="block text-sm mb-1">ステータス</label>
                        <select
                            className="border p-2"
                            value={data.status}
                            onChange={(e) =>
                                setData("status", e.target.value as any)
                            }
                        >
                            <option value="todo">未着手</option>
                            <option value="doing">進行中</option>
                            <option value="done">完了</option>
                            <option value="archived">保留</option>
                        </select>
                    </div>

                    {/* 優先度 */}
                    <div>
                        <label className="block text-sm mb-1">優先度</label>
                        <select
                            className="border p-2"
                            value={data.priority}
                            onChange={(e) =>
                                setData("priority", e.target.value as any)
                            }
                        >
                            <option value="low">低</option>
                            <option value="normal">中</option>
                            <option value="high">高</option>
                            <option value="urgent">至急</option>
                        </select>
                    </div>

                    {/* 期限 */}
                    <div>
                        <label className="block text-sm mb-1">期限</label>
                        {/* 期限 */}
                        <input
                            type="date"
                            className={`border p-2 ${
                                errors.due_date ? "border-red-500" : ""
                            }`}
                            value={data.due_date}
                            onChange={(e) =>
                                setData("due_date", e.target.value)
                            }
                            aria-invalid={!!errors.due_date}
                        />
                        {errors.due_date && (
                            <p className="text-red-600 text-sm" role="alert">
                                {errors.due_date}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        disabled={processing}
                        className="px-3 py-2 bg-black text-white rounded"
                    >
                        保存
                    </button>
                    <Link href={route("tasks.index")} className="underline">
                        戻る
                    </Link>
                </div>
            </form>
        </div>
    );
}
