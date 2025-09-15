export const fmtLeft = (d?: string | null) => {
    if (!d) return "";
    const today = new Date().toISOString().slice(0, 10);
    const days = Math.ceil((+new Date(d) - +new Date(today)) / 86400000);
    if (days < 0) return `D+${Math.abs(days)}`;
    if (days === 0) return "D-DAY";
    return `D-${days}`;
};

export const dueClass = (d?: string | null, status?: string) => {
    if (!d || status === "done")
        return "bg-white border-gray-200 text-gray-700";
    const today = new Date().toISOString().slice(0, 10);
    const days = Math.ceil((+new Date(d) - +new Date(today)) / 86400000);
    if (days < 0) return "bg-red-50 border-red-200 text-red-700";
    if (days === 0) return "bg-orange-50 border-orange-200 text-orange-700";
    if (days <= 2) return "bg-yellow-50 border-yellow-200 text-yellow-700";
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
};
