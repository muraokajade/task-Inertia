import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { tPriority, tStatus } from "@/libs/i18n";
type ByProjectRow = { project: string; wip: number; overdue: number };
type Stats = {
    done_this_week: number;
    overdue: number;
    wip: number;
    urgent_open: number;
    done_today: number;
    stress: number;
    ttg: number;
};

type TriageItem = {
    id: number;
    title: string;
    priority: "low" | "normal" | "high" | "urgent";
    status: "todo" | "doing" | "done" | "archived";
    due_date: string | null; // 'YYYY-MM-DD' or null
};
/**
 * Dashboard
 *
 * ポイント：
 * - 楽観的更新（Optimistic UI）を正しく扱うため、props.triage をそのまま操作せず、
 *   いったん useState にコピーして「画面上の一時状態」を管理する。
 * - 「prev = [...items]」は “**現在の配列スナップショット** を保持しておくため”。
 *   後で API 失敗したら、**そのスナップショットに丸ごと戻す**（ロールバック）のに使う。
 */
export default function Dashboard({
    stats,
    triage,
    by_project,
}: {
    stats: Stats;
    triage: TriageItem[];
    by_project: ByProjectRow[];
}) {
    /** ====== UI用のローカル状態 ======
     * props.triage を直接いじると React 的にNG（不変性違反 & 予期せぬ再描画）なので、
     * まずローカル state に写してから操作する。
     */
    const [items, setItems] = useState<TriageItem[]>(triage);
    const [busyId, setBusyId] = useState<number | null>(null);
    // ページ再訪などでサーバpropsが更新されたときに state を同期
    useEffect(() => {
        setItems(triage);
    }, [triage]);

    // Stress色: 0-39=緑 / 40-69=黄 / 70+=赤
    const stressClass =
        stats.stress >= 70
            ? "bg-red-100 text-red-700 border-red-200"
            : stats.stress >= 40
            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
            : "bg-emerald-100 text-emerald-700 border-emerald-200";
    // ---- 楽観的更新の「完了」操作 ----
    const complete = (t: TriageItem) => {
        if (busyId) return;
        const prev = [...items]; //const prev = items; だと同じ参照なので、あとで items をいじると prev も一緒に変わってしまう
        setItems((curr) => curr.filter((x) => x.id !== t.id));

        router.put(
            `/tasks/${t.id}`,
            {
                title: t.title,
                description: "",
                status: "done",
                priority: t.priority,
                due_date: t.due_date ?? "",
            },
            {
                preserveScroll: true,
                onError: () => {
                    setItems(prev);
                },
                onFinish: () => setBusyId(null),
            }
        );
    };
    return (
        <div className="p-6 space-y-8">
            <Head title="ダッシュボード" />
            <h1 className="text-2xl font-bold">ダッシュボード</h1>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card label="今週の完了" value={stats.done_this_week} />
                <Card label="期限超過" value={stats.overdue} />
                <Card label="作業中 (WIP)" value={stats.wip} />
                <div className={`border rounded-xl p-4 ${stressClass}`}>
                    <div className="text-sm opacity-80 flex items-center justify-between">
                        <span>Stress</span>
                        <span className="text-xs opacity-70">
                            0-39緑 / 40-69黄 / 70+赤
                        </span>
                    </div>
                    <div className="text-3xl font-semibold">{stats.stress}</div>
                    <div className="text-xs mt-1">
                        あと <b>{stats.ttg}</b> 件でGreen
                    </div>
                </div>
            </section>

            {/* ==== Triage（今日やる順：上位10件） ==== */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">（上位10件）</h2>
                <div className="space-y-2">
                    {items.length === 0 ? (
                        <div className="text-sm text-gray-500">
                            対象はありません
                        </div>
                    ) : (
                        items.map((t) => (
                            <div
                                key={t.id}
                                className="border rounded-xl p-3 flex items-center justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="font-medium truncate">
                                        やること順位{t.title}
                                    </div>
                                    <div className="text-xs mt-1 flex items-center gap-2">
                                        <span
                                            className={`px-2 py-0.5 rounded-full border ${badgeByPriority(
                                                t.priority
                                            )}`}
                                        >
                                            優先度: {tPriority(t.priority)}
                                        </span>
                                        <span className="mr-2">
                                            ステータス: {tStatus(t.status)}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full border ${badgeByDue(
                                                t.due_date,
                                                t.status
                                            )}`}
                                        >
                                            期限: {t.due_date ?? "—"}
                                        </span>
                                    </div>
                                </div>

                                {/* 完了（楽観的更新） */}
                                <button
                                    onClick={() => complete(t)}
                                    disabled={busyId === t.id}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {busyId === t.id ? "処理中" : "完了"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>
            {/* ==== プロジェクト別（WIP / 期限超過） ==== */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">プロジェクト別</h2>
                {by_project.length === 0 ? (
                    <div className="text-sm text-gray-500">
                        データがありません
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[560px] w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="py-2 pr-4">プロジェクト</th>
                                    <th className="py-2 pr-4">WIP</th>
                                    <th className="py-2">期限超過</th>
                                </tr>
                            </thead>
                            <tbody>
                                {by_project.map((r, i) => (
                                    <tr
                                        key={i}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-2 pr-4">
                                            {r.project}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-full border ${
                                                    r.wip > 0
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                                }`}
                                            >
                                                {r.wip}
                                            </span>
                                        </td>
                                        <td className="py-2">
                                            <span
                                                className={`px-2 py-0.5 rounded-full border ${
                                                    r.overdue > 0
                                                        ? "bg-red-50 text-red-700 border-red-200"
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                }`}
                                            >
                                                {r.overdue}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

/** 汎用カード（数字＋ラベル） */
function Card({ label, value }: { label: string; value: number }) {
    return (
        <div className="border rounded-xl p-4">
            <div className="text-sm text-gray-600">{label}</div>
            <div className="text-3xl font-semibold">{value}</div>
        </div>
    );
}
function badgeByPriority(p: TriageItem["priority"]) {
    return p === "urgent"
        ? "bg-red-50 text-red-700 border-red-200"
        : p === "high"
        ? "bg-orange-50 text-orange-700 border-orange-200"
        : p === "normal"
        ? "bg-gray-50 text-gray-700 border-gray-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
}
function badgeByDue(due: string | null, status: string) {
    if (!due) return "bg-gray-50 text-gray-600 border-gray-200";
    const today = new Date().toISOString().slice(0, 10);
    if (status !== "done" && due < today)
        return "bg-red-50 text-red-700 border-red-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
}
