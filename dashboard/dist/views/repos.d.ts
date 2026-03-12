import type { RepoSummary, RepoDetail } from "../services/repo-service.js";
import type { LearningEntry } from "../services/learning-service.js";
export declare function ReposPage({ repos, }: {
    readonly repos: readonly RepoSummary[];
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function WorkspacePage({ workspaceLearnings, repoCount, }: {
    readonly workspaceLearnings: readonly LearningEntry[];
    readonly repoCount: number;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function WorkspaceKnowledgeList({ learnings, }: {
    readonly learnings: readonly LearningEntry[];
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function WorkspaceLearningEditForm({ entry, }: {
    readonly entry: LearningEntry;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function RepoDetailPage({ detail, learnings, }: {
    readonly detail: RepoDetail;
    readonly learnings: readonly LearningEntry[];
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function KnowledgeList({ learnings, repoName, }: {
    readonly learnings: readonly LearningEntry[];
    readonly repoName: string;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function SyncResult({ success, message, }: {
    readonly success: boolean;
    readonly message: string;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function LearningEditForm({ entry, repoName, }: {
    readonly entry: LearningEntry;
    readonly repoName: string;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
