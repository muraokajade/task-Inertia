export type Task = {
    id: number;
    title: string;
    status: "todo" | "doing" | "done" | "archived" | string;
    priority: "low" | "normal" | "high" | "urgent" | string;
    due_date?: string | null;
};

export type Paginator<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

export type Filters = {
    q?: string | null;
    status?: string | null;
    priority?: string | null;
    project_id?: number | null;
    assignee_id?: number | null;
    overdue: boolean;
    due_from?: string | null;
    due_to?: string | null;
    sort: "position" | "due_date" | "created_at" | "priority" | "status";
    dir: "asc" | "desc";
    per_page: number;
};
