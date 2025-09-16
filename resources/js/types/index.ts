// InertiaのPageProps基底型を継ぐ
import type { PageProps as InertiaPageProps } from "@inertiajs/core";

export type User = { id: number; name: string; email: string };

// 追加propsはここに足していけるジェネリック
export type PageProps<T = Record<string, unknown>> = InertiaPageProps & {
    auth: {
        user: User | null; // ← null許容にする
    };
} & T;
