// 値そのもの（DB/型）は英語のまま。表示だけ日本語へ。
export type Priority = "low" | "normal" | "high" | "urgent";
export type Status = "todo" | "doing" | "done" | "archived";

export const priorityJa: Record<Priority, string> = {
    low: "低",
    normal: "中",
    high: "高",
    urgent: "至急",
} as const;

export const statusJa: Record<Status, string> = {
    todo: "未着手",
    doing: "進行中",
    done: "完了",
    archived: "保留",
} as const;

// ヘルパ（undefined安全にするならこちら）
export const tPriority = (p?: string) =>
    (priorityJa as Record<string, string>)[p ?? ""] ?? p ?? "";

export const tStatus = (s?: string) =>
    (statusJa as Record<string, string>)[s ?? ""] ?? s ?? "";
