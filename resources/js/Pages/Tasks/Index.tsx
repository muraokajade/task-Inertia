import { Head, router, useForm, Link, usePage } from "@inertiajs/react";
import type { PageProps as InertiaPageProps } from "@/types";
import Toast from "@/Components/Toast";
import { useEffect, useRef, useState } from "react";

import FilterBar from "@/features/tasks/ui/FilterBar";
import TaskRow from "@/features/tasks/ui/TaskRow";
import Pager from "@/features/tasks/ui/Pager";
import EmptyState from "@/features/tasks/ui/EmptyState";
import { Filters, Task, Paginator } from "@/features/tasks/types";
// 追加: dnd-kit
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PageProps = InertiaPageProps<{
    auth: { user: { id: number; name: string; email: string } | null };
    flash?: string;
    error?: string;
    filters: Filters;
}>;

type Props = { tasks: Paginator<Task> };

export default function Index({ tasks }: Props) {
    const page = usePage<PageProps>();
    const { flash, error, filters } = page.props;

    // ローカル状態（初期値＝filters）
    const [q, setQ] = useState<string>(filters.q ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [priority, setPriority] = useState(filters.priority ?? "");
    const [sort, setSort] = useState<Filters["sort"]>(filters.sort);
    const [dir, setDir] = useState<Filters["dir"]>(filters.dir);
    const [per, setPer] = useState<number>(filters.per_page);
    const [dueFrom, setDueFrom] = useState(filters.due_from ?? "");
    const [dueTo, setDueTo] = useState(filters.due_to ?? "");
    const [overdue, setOverdue] = useState<boolean>(filters.overdue ?? false);

    const [selected, setSelected] = useState<number[]>([]);
    const allIds = tasks.data.map((t) => t.id);

    const isAllSelected =
        selected.length > 0 && selected.length === allIds.length;

    const toggle = (id: number) =>
        setSelected((s) =>
            s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
        );
    const toggleAllOnPage = () =>
        setSelected((s) => (s.length === allIds.length ? [] : allIds));

    const bulk = (action: "complete" | "delete") => {
        if (
            action === "delete" &&
            !confirm("選択したタスクを削除します。よろしいですか？")
        )
            return;
        router.post(
            route("tasks.bulk"),
            { ids: selected, action },
            { preserveState: true, onSuccess: () => setSelected([]) }
        );
    };

    const { data, setData, processing, post, reset, errors } = useForm({
        title: "",
        description: "",
        status: "todo",
        priority: "normal",
        due_date: "",
    });

    const createTask = (e: React.FormEvent) => {
        e.preventDefault();
        post("/tasks", { onSuccess: () => reset("title", "due_date") });
    };
    const deleteTask = (id: number) =>
        router.delete(`/tasks/${id}`, { preserveScroll: true });
    const completeTask = (t: Task) => {
        router.put(
            `/tasks/${t.id}`,
            {
                title: t.title,
                description: "",
                status: "done",
                priority: t.priority,
                due_date: t.due_date ?? "",
            },
            { preserveScroll: true }
        );
    };

    const applyListControls = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route("tasks.index"),
            {
                q: q || undefined,
                status: status || undefined,
                priority: priority || undefined,
                due_from: dueFrom || undefined,
                due_to: dueTo || undefined,
                overdue: overdue || undefined,
                sort,
                dir,
                per_page: per,
            },
            { preserveState: true, replace: true }
        );
    };

    const titleRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (errors.title) titleRef.current?.focus();
    }, [errors]);

    //------ドラッグドロップ------
    const [order, setOrder] = useState<number[]>(() =>
        tasks.data.map((t) => t.id)
    );

    //どんな入力でドラッグ開始するかの定義（例: 4px動いたら開始など誤操作防止）。
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
    );
    function SortableRow({
        id,
        children,
    }: {
        id: number;
        children: React.ReactNode;
    }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id });
        const style: React.CSSProperties = {
            // dnd-kit が返す行列を CSS 文字列に
            transform: CSS.Transform.toString(transform),
            transition,
            // ドラッグ中の見た目（好みで）
            opacity: isDragging ? 0.9 : 1,
            boxShadow: isDragging ? "0 6px 18px rgba(0,0,0,0.12)" : undefined,
            cursor: "grab",
            background: isDragging ? "var(--color-bg, #fff)" : undefined,
        };
        return (
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                {children}
            </div>
        );
    }
    const onDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;

        const oldIndex = order.indexOf(active.id as number);
        const newIndex = order.indexOf(over.id as number);
        if (oldIndex === -1 || newIndex === -1) return;

        const next = arrayMove(order, oldIndex, newIndex);
        setOrder(next);

        router.patch(
            route("tasks.reorder"),
            { ids: next },
            { preserveScroll: true }
        );
    };

    return (
        <div className="p-6 space-y-8">
            <Toast message={flash} kind="success" trigger={page.url} />
            <Toast message={error} kind="error" trigger={page.url} />
            <Head title="タスク" />

            {/* ヘッダー */}
            <header className="flex items-center justify-between">
                <div className="shrink-0">
                    <h1 className="text-2xl font-bold">タスク</h1>
                    <p className="text-sm text-gray-500">
                        合計 <b>{tasks.data.length}</b> 件（このページ）
                    </p>
                </div>

                <FilterBar
                    q={q}
                    setQ={setQ}
                    status={status}
                    setStatus={setStatus}
                    priority={priority}
                    setPriority={setPriority}
                    sort={sort}
                    setSort={setSort}
                    dir={dir}
                    setDir={setDir}
                    per={per}
                    setPer={setPer}
                    dueFrom={dueFrom}
                    setDueFrom={setDueFrom}
                    dueTo={dueTo}
                    setDueTo={setDueTo}
                    overdue={overdue}
                    setOverdue={setOverdue}
                    onSubmit={applyListControls}
                    onReset={() =>
                        router.get(
                            route("tasks.index"),
                            {},
                            { preserveState: true, replace: true }
                        )
                    }
                    showReset={
                        !!(
                            q ||
                            filters.status ||
                            filters.priority ||
                            filters.due_from ||
                            filters.due_to ||
                            filters.overdue
                        )
                    }
                />
            </header>
            {/* 追加: 一括操作ツールバー */}
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={toggleAllOnPage}
                    className="h-9 text-sm px-3 border rounded"
                >
                    {isAllSelected ? "全解除" : "このページを全選択"}
                </button>
                <button
                    disabled={selected.length === 0}
                    onClick={() => bulk("complete")}
                    className="h-9 text-sm px-3 border rounded disabled:opacity-50"
                    title="選択したタスクを完了にする"
                >
                    選択を完了（{selected.length}）
                </button>
                <button
                    disabled={selected.length === 0}
                    onClick={() => bulk("delete")}
                    className="h-9 text-sm px-3 border rounded disabled:opacity-50"
                    title="選択したタスクを削除する"
                >
                    選択を削除（{selected.length}）
                </button>
            </div>

            {/* 作成フォーム */}
            <section className="border rounded-xl p-4">
                <form
                    onSubmit={createTask}
                    className="grid grid-cols-1 lg:grid-cols-6 gap-3"
                >
                    <div className="lg:col-span-3">
                        <label className="block text-sm text-gray-600 mb-1">
                            タイトル
                        </label>
                        <input
                            className={`border ${
                                errors.title ? "border-red-500" : ""
                            } rounded w-full p-2`}
                            placeholder="例）APIのエラーハンドリング改善"
                            value={data.title}
                            ref={titleRef}
                            onChange={(e) => setData("title", e.target.value)}
                            aria-invalid={!!errors.title}
                        />
                        {errors.title && (
                            <p
                                className="mt-1 text-xs text-red-600"
                                role="alert"
                            >
                                {errors.title}
                            </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                            160文字まで
                        </p>
                    </div>

                    <div className="lg:col-span-1">
                        <label className="block text-sm text-gray-600 mb-1">
                            期限
                        </label>
                        {/* 期限 */}
                        <input
                            type="date"
                            className={`border rounded w-full p-2 ${
                                errors.due_date ? "border-red-500" : ""
                            }`}
                            value={data.due_date}
                            onChange={(e) =>
                                setData("due_date", e.target.value)
                            }
                            aria-invalid={!!errors.due_date}
                        />
                        {errors.due_date && (
                            <p
                                className="text-xs text-red-600 mt-1"
                                role="alert"
                            >
                                {errors.due_date}
                            </p>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <label className="block text-sm text-gray-600 mb-1">
                            ステータス
                        </label>
                        <select
                            className="border rounded w-full p-2"
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                        >
                            <option value="todo">未着手</option>
                            <option value="doing">進行中</option>
                            <option value="done">完了</option>
                            <option value="archived">保留</option>
                        </select>
                    </div>

                    <div className="lg:col-span-1">
                        <label className="block text-sm text-gray-600 mb-1">
                            優先度
                        </label>
                        <select
                            className="border rounded w-full p-2"
                            value={data.priority}
                            onChange={(e) =>
                                setData("priority", e.target.value)
                            }
                        >
                            <option value="low">低</option>
                            <option value="normal">中</option>
                            <option value="high">高</option>
                            <option value="urgent">至急</option>
                        </select>
                    </div>

                    <div className="lg:col-span-5">
                        <label className="block text-sm text-gray-600 mb-1">
                            説明
                        </label>
                        <textarea
                            className="border rounded w-full p-2 h-24"
                            placeholder="具体的な受け入れ条件、背景、メモなど"
                            value={(data as any).description ?? ""}
                            onChange={(e) =>
                                setData("description" as any, e.target.value)
                            }
                        />
                    </div>

                    <div className="lg:col-span-1 flex items-end">
                        <button
                            disabled={processing}
                            className="w-full px-3 py-2 bg-black text-white rounded"
                        >
                            追加
                        </button>
                    </div>
                </form>
            </section>

            {/* 一覧 */}
            {tasks.data.length === 0 ? (
                <EmptyState />
            ) : (
                <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                    {/* items に id 配列を渡す。strategy は縦リスト用 */}
                    <SortableContext
                        items={order}
                        strategy={verticalListSortingStrategy}
                    >
                        <section className="space-y-2">
                            {order.map((id) => {
                                // id から Task を逆引き（ページング中はこのページにある分だけ）
                                const t = tasks.data.find((x) => x.id === id);
                                if (!t) return null; // 念のため（他ページのIDが紛れた場合など）

                                return (
                                    <SortableRow key={t.id} id={t.id}>
                                        {/* 既存の TaskRow はそのまま。チェックや完了ボタンもそのまま */}
                                        <TaskRow
                                            t={t}
                                            selected={selected.includes(t.id)}
                                            onToggle={() => toggle(t.id)}
                                            onComplete={completeTask}
                                            onDelete={deleteTask}
                                        />
                                    </SortableRow>
                                );
                            })}
                        </section>
                    </SortableContext>
                </DndContext>
            )}

            {/* ページング */}
            {tasks.data.length > 0 && <Pager links={tasks.links} />}
        </div>
    );
}
