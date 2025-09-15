// Toast.tsx
import { useEffect, useState } from "react";

type Props = {
    message?: string;
    kind?: "success" | "error";
    duration?: number;
    trigger: string;
};

export default function Toast({
    message,
    kind = "success",
    duration = 3000,
    trigger,
}: Props) {
    const [open, setOpen] = useState(!!message);

    useEffect(() => {
        if (!message) return;
        setOpen(true);
        const timer = setTimeout(() => setOpen(false), duration);
        return () => clearTimeout(timer); // ← クリーンアップは関数で返す
    }, [message, duration, trigger]);

    if (!message || !open) return null;

    const styles = kind === "error" ? "bg-red-600" : "bg-green-600";
    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed top-4 right-4 z-50 text-white ${styles} px-4 py-2 rounded shadow`}
        >
            {message}
        </div>
    );
}
