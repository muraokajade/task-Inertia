import { Filters } from "@/features/tasks/types";

type Props = {
    q: string;
    setQ: (v: string) => void;
    status: string;
    setStatus: (v: string) => void;
    priority: string;
    setPriority: (v: string) => void;
    sort: Filters["sort"];
    setSort: (v: Filters["sort"]) => void;
    dir: Filters["dir"];
    setDir: (v: Filters["dir"]) => void;
    per: number;
    setPer: (v: number) => void;
    dueFrom: string;
    setDueFrom: (v: string) => void;
    dueTo: string;
    setDueTo: (v: string) => void;
    overdue: boolean;
    setOverdue: (v: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
    showReset: boolean;
};

export default function FilterBar({
    q,
    setQ,
    status,
    setStatus,
    priority,
    setPriority,
    sort,
    setSort,
    dir,
    setDir,
    per,
    setPer,
    dueFrom,
    setDueFrom,
    dueTo,
    setDueTo,
    overdue,
    setOverdue,
    onSubmit,
    onReset,
    showReset,
}: Props) {
    return (
        <form
            onSubmit={onSubmit}
            className="hidden md:flex flex-wrap justify-end gap-2 max-w-[880px] w-full ml-6"
        >
            <input
                className="h-9 text-sm px-3 border rounded min-w-[220px] w-[260px]"
                placeholder="タイトル/説明で検索"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setQ("");
                }}
                maxLength={160}
            />

            <select
                className="h-9 text-sm px-3 border rounded whitespace-nowrap"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
            >
                <option value="">全ステータス</option>
                <option value="todo">未着手</option>
                <option value="doing">進行中</option>
                <option value="done">完了</option>
                <option value="archived">保留</option>
            </select>

            <select
                className="h-9 text-sm px-3 border rounded whitespace-nowrap"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
            >
                <option value="">全優先度</option>
                <option value="low">低</option>
                <option value="normal">中</option>
                <option value="high">高</option>
                <option value="urgent">至急</option>
            </select>

            <select
                className="h-9 text-sm px-3 border rounded whitespace-nowrap"
                value={sort}
                onChange={(e) => setSort(e.target.value as Filters["sort"])}
            >
                <option value="position">並び: 手動</option>
                <option value="due_date">並び: 期限</option>
                <option value="created_at">並び: 作成日</option>
                <option value="priority">並び: 優先度</option>
                <option value="status">並び: ステータス</option>
            </select>

            <select
                className="h-9 text-sm px-3 border rounded whitespace-nowrap"
                value={dir}
                onChange={(e) => setDir(e.target.value as Filters["dir"])}
            >
                <option value="asc">昇順</option>
                <option value="desc">降順</option>
            </select>

            <select
                className="h-9 text-sm px-3 border rounded whitespace-nowrap"
                value={per}
                onChange={(e) => setPer(Number(e.target.value))}
            >
                {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                        {n}件/頁
                    </option>
                ))}
            </select>

            <input
                type="date"
                className="h-9 text-sm px-3 border rounded min-w-[150px]"
                value={dueFrom}
                onChange={(e) => setDueFrom(e.target.value)}
            />
            <input
                type="date"
                className="h-9 text-sm px-3 border rounded min-w-[150px]"
                value={dueTo}
                onChange={(e) => setDueTo(e.target.value)}
            />

            <label className="h-9 text-sm px-3 border rounded flex items-center gap-2 whitespace-nowrap cursor-pointer">
                <input
                    type="checkbox"
                    checked={overdue}
                    onChange={(e) => setOverdue(e.target.checked)}
                />
                期限切れのみ
            </label>

            <button className="h-9 text-sm px-3 border rounded whitespace-nowrap">
                適用
            </button>

            {showReset && (
                <button
                    type="button"
                    className="h-9 text-sm px-3 border rounded whitespace-nowrap"
                    onClick={onReset}
                >
                    リセット
                </button>
            )}
        </form>
    );
}
