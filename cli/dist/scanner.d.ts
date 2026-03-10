import type { RepoScan } from "./types.js";
declare function getHeadCommit(root: string): string;
export declare function getCommitsSince(root: string, sinceCommit: string): number;
export declare function findRepoRoot(dir: string): string | null;
export { getHeadCommit };
export declare function scanRepo(root: string): Promise<RepoScan>;
