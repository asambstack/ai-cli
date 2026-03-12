import type { AgentSummary, AgentFile } from "../services/agent-service.js";
interface AgentsPageProps {
    readonly activeTab: "agents" | "skills" | "rules";
    readonly items: readonly AgentSummary[];
    readonly selectedItem: AgentFile | null;
}
export declare function AgentsPage({ activeTab, items, selectedItem }: AgentsPageProps): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function EditorPartial({ item, tab, }: {
    readonly item: AgentFile;
    readonly tab: string;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export {};
