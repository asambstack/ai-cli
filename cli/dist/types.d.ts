export interface RepoScan {
    readonly name: string;
    readonly root: string;
    readonly languages: readonly string[];
    readonly frameworks: readonly string[];
    readonly testRunners: readonly string[];
    readonly buildTools: readonly string[];
    readonly entryPoints: readonly string[];
    readonly scripts: Readonly<Record<string, string>>;
    readonly structure: readonly DirEntry[];
    readonly ci: readonly string[];
    readonly config: readonly string[];
    readonly keyDependencies: readonly string[];
    readonly devDependencies: readonly string[];
}
export interface DirEntry {
    readonly path: string;
    readonly description: string;
}
export interface AIConfig {
    readonly editors: readonly string[];
    readonly lastScan: string;
    readonly lastCommit: string;
    readonly repoRoot: string;
}
export interface Learning {
    readonly category: LearningCategory;
    readonly text: string;
    readonly date: string;
}
export type LearningCategory = "architecture" | "conventions" | "gotchas" | "integrations" | "domain";
export declare const LEARNING_CATEGORIES: readonly {
    readonly value: LearningCategory;
    readonly label: string;
    readonly hint: string;
}[];
export interface EditorDef {
    readonly id: string;
    readonly name: string;
    readonly path: string;
    readonly detectPaths: readonly string[];
}
export declare const EDITORS: readonly EditorDef[];
