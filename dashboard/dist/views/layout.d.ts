import type { Child } from "hono/jsx";
interface LayoutProps {
    readonly title: string;
    readonly activePage: string;
    readonly children: Child;
}
export declare function Layout({ title, activePage, children }: LayoutProps): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export {};
