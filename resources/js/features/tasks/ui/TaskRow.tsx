import { Link } from "@inertiajs/react";
import { Task } from "@/features/tasks/types";
import { dueClass, fmtLeft } from "@/features/tasks/lib/due";

type Props = {
    t: Task;
    selected: boolean;
    onToggle: () => void;
    onComplete: (t: Task) => void;
    onDelete: (id: number) => void;
};

export default function TaskRow({
    t,
    selected,
    onToggle,
    onComplete,
    onDelete,
}: Props) {
    const statusJa =
        (
            {
                todo: "未着手",
                doing: "進行中",
                done: "完了",
                archived: "保留",
            } as Record<string, string>
        )[t.status] ?? t.status;
    const priorityJa =
        (
            { low: "低", normal: "中", high: "高", urgent: "至急" } as Record<
                string,
                string
            >
        )[t.priority] ?? t.priority;

    return (
        <div className="border rounded-xl p-4 flex items-center justify-between">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected}
                        onChange={onToggle}
                    />
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full border">
                        #{t.id}
                    </span>
                    <h2 className="font-medium truncate">{t.title}</h2>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span
                        className={`px-2 py-0.5 rounded-full border ${
                            t.status === "done"
                                ? "bg-green-50 border-green-200 text-green-700"
                                : t.status === "doing"
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : t.status === "archived"
                                ? "bg-gray-50 border-gray-200 text-gray-600"
                                : "bg-yellow-50 border-yellow-200 text-yellow-700"
                        }`}
                    >
                        {statusJa}
                    </span>

                    <span
                        className={`px-2 py-0.5 rounded-full border ${
                            t.priority === "urgent"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : t.priority === "high"
                                ? "bg-orange-50 border-orange-200 text-orange-700"
                                : t.priority === "normal"
                                ? "bg-gray-50 border-gray-200 text-gray-700"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}
                    >
                        {priorityJa}
                    </span>

                    <span
                        className={`px-2 py-0.5 rounded-full border ${dueClass(
                            t.due_date,
                            t.status
                        )}`}
                        title={t.due_date ? `期限: ${t.due_date}` : "期限なし"}
                    >
                        {t.due_date
                            ? `${t.due_date} · ${fmtLeft(t.due_date)}`
                            : "期限なし"}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {t.status !== "done" && (
                    <button
                        onClick={() => onComplete(t)}
                        className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                        完了
                    </button>
                )}
                <Link
                    href={route("tasks.edit", t.id)}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                >
                    編集
                </Link>
                <button
                    onClick={() => {
                        if (!confirm("削除してもよいですか？")) return;
                        onDelete(t.id);
                    }}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                >
                    削除
                </button>
            </div>
        </div>
    );
}
