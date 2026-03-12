import type { LearningEntry } from "../services/learning-service.js";
interface LearningsPageProps {
    readonly repos: readonly string[];
    readonly selectedRepo: string;
    readonly entries: readonly LearningEntry[];
}
declare function LearningEditForm({ entry, repo, }: {
    readonly entry: LearningEntry;
    readonly repo: string;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
declare function LearningsListPartial({ entries, repo, }: {
    readonly entries: readonly LearningEntry[];
    readonly repo: string;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function LearningsPage({ repos, selectedRepo, entries, }: LearningsPageProps): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export { LearningsListPartial, LearningEditForm };
