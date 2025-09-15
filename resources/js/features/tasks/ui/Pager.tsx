import { router } from "@inertiajs/react";
import { Paginator } from "@/features/tasks/types";

type Props = { links: Paginator<any>["links"] };

export default function Pager({ links }: Props) {
    if (!links?.length) return null;
    return (
        <nav className="flex gap-2 justify-center">
            {links.map((l, i) => (
                <button
                    key={i}
                    disabled={!l.url}
                    onClick={() =>
                        l.url && router.get(l.url, {}, { preserveState: true })
                    }
                    className={`px-3 py-1.5 border rounded ${
                        l.active ? "bg-black text-white" : ""
                    } disabled:opacity-50`}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </nav>
    );
}
