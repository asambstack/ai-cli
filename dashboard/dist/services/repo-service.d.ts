export interface WorkspaceConfig {
    readonly type: string;
    readonly repos: readonly string[];
    readonly lastScan: string;
}
export interface RepoConfig {
    readonly editors: readonly string[];
    readonly lastScan: string;
    readonly lastCommit: string;
    readonly repoRoot: string;
}
export interface RepoSummary {
    readonly name: string;
    readonly languages: readonly string[];
    readonly frameworks: readonly string[];
    readonly lastScan: string | null;
    readonly staleness: number;
    readonly learningCount: number;
    readonly hasConfig: boolean;
}
export interface RepoDetail {
    readonly name: string;
    readonly config: RepoConfig | null;
    readonly contextMd: string | null;
    readonly learningsMd: string | null;
    readonly staleness: number;
    readonly editors: readonly string[];
}
export declare function getWorkspaceConfig(workspaceRoot: string): Promise<WorkspaceConfig | null>;
export declare function listRepos(workspaceRoot: string): Promise<readonly RepoSummary[]>;
export declare function getRepoDetail(workspaceRoot: string, name: string): Promise<RepoDetail>;
