import { Link, usePage } from "@inertiajs/react";
import type { PropsWithChildren } from "react";
import type { PageProps } from "@/types";

function NavLink({
    href,
    children,
    active,
}: PropsWithChildren<{ href: string; active?: boolean }>) {
    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-md text-sm border
        ${active ? "bg-black text-white border-black" : "hover:bg-gray-50"}`}
        >
            {children}
        </Link>
    );
}

export default function AppLayout({ children }: PropsWithChildren) {
    const page = usePage<PageProps>();
    const path = page.url; // 現在のパス

    return (
        <div className="min-h-screen flex flex-col">
            {/* --- ナビバー --- */}
            <header className="border-b bg-white">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="font-bold">
                            Stress-First
                        </Link>
                        <nav className="ml-4 flex items-center gap-2">
                            <NavLink
                                href={route("dashboard")}
                                active={path.startsWith("/dashboard")}
                            >
                                ダッシュボード
                            </NavLink>
                            <NavLink
                                href={route("tasks.index")}
                                active={path.startsWith("/tasks")}
                            >
                                タスク
                            </NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                            {page.props.auth?.user?.name ?? ""}
                        </span>
                        {/* ログアウト（POST/DELETEに合わせてform化） */}
                        <form method="post" action={route("logout")}>
                            {/* LaravelのCSRFトークン（Breeze/Jetstreamならメタタグから自動） */}
                            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                                ログアウト
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* --- ページ本体 --- */}
            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
            </main>
        </div>
    );
}
