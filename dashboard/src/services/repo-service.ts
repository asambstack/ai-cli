import { readFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";

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

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function getCommitsSince(root: string, sinceCommit: string): number {
  try {
    const output = execSync(
      `git rev-list --count ${sinceCommit}..HEAD 2>/dev/null`,
      { cwd: root, encoding: "utf-8", timeout: 3000 }
    );
    return parseInt(output.trim(), 10) || 0;
  } catch {
    return -1;
  }
}

function countLearnings(content: string): number {
  const lines = content.split("\n");
  return lines.filter((line) => line.trimStart().startsWith("- ")).length;
}

function parseContextForMeta(
  content: string
): { languages: string[]; frameworks: string[] } {
  const languages: string[] = [];
  const frameworks: string[] = [];

  const langMatch = content.match(/\*\*Language:\*\*\s*(.+)/);
  if (langMatch) {
    languages.push(
      ...langMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    );
  }

  const fwMatch = content.match(/\*\*Framework:\*\*\s*(.+)/);
  if (fwMatch) {
    frameworks.push(
      ...fwMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    );
  }

  return { languages, frameworks };
}

export async function getWorkspaceConfig(
  workspaceRoot: string
): Promise<WorkspaceConfig | null> {
  const configPath = join(workspaceRoot, ".ai", "config.json");
  try {
    const raw = await readFile(configPath, "utf-8");
    return JSON.parse(raw) as WorkspaceConfig;
  } catch {
    return null;
  }
}

export async function listRepos(
  workspaceRoot: string
): Promise<readonly RepoSummary[]> {
  const wsConfig = await getWorkspaceConfig(workspaceRoot);
  if (!wsConfig) return [];

  const results = await Promise.all(
    wsConfig.repos.map(async (name): Promise<RepoSummary> => {
      const repoPath = join(workspaceRoot, name);
      const aiDir = join(repoPath, ".ai");
      const configPath = join(aiDir, "config.json");
      const contextPath = join(aiDir, "context.md");
      const learningsPath = join(aiDir, "learnings.md");

      let config: RepoConfig | null = null;
      let languages: string[] = [];
      let frameworks: string[] = [];
      let staleness = -1;
      let learningCount = 0;
      let hasConfig = false;

      try {
        const raw = await readFile(configPath, "utf-8");
        config = JSON.parse(raw) as RepoConfig;
        hasConfig = true;
      } catch {
        // no config
      }

      if (config?.lastCommit) {
        staleness = getCommitsSince(repoPath, config.lastCommit);
      }

      try {
        const contextContent = await readFile(contextPath, "utf-8");
        const meta = parseContextForMeta(contextContent);
        languages = meta.languages;
        frameworks = meta.frameworks;
      } catch {
        // no context
      }

      try {
        const learningsContent = await readFile(learningsPath, "utf-8");
        learningCount = countLearnings(learningsContent);
      } catch {
        // no learnings
      }

      return {
        name,
        languages,
        frameworks,
        lastScan: config?.lastScan ?? null,
        staleness,
        learningCount,
        hasConfig,
      };
    })
  );

  return results;
}

export async function getRepoDetail(
  workspaceRoot: string,
  name: string
): Promise<RepoDetail> {
  const repoPath = join(workspaceRoot, name);
  const aiDir = join(repoPath, ".ai");

  let config: RepoConfig | null = null;
  let contextMd: string | null = null;
  let learningsMd: string | null = null;
  let staleness = -1;

  try {
    const raw = await readFile(join(aiDir, "config.json"), "utf-8");
    config = JSON.parse(raw) as RepoConfig;
  } catch {
    // no config
  }

  try {
    contextMd = await readFile(join(aiDir, "context.md"), "utf-8");
  } catch {
    // no context
  }

  try {
    learningsMd = await readFile(join(aiDir, "learnings.md"), "utf-8");
  } catch {
    // no learnings
  }

  if (config?.lastCommit) {
    staleness = getCommitsSince(repoPath, config.lastCommit);
  }

  return {
    name,
    config,
    contextMd,
    learningsMd,
    staleness,
    editors: config?.editors ?? [],
  };
}
