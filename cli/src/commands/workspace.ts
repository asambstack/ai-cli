import { readdir, mkdir, writeFile, readFile, symlink, lstat, readlink, unlink } from "node:fs/promises";
import { join, relative, basename } from "node:path";
import { accessSync } from "node:fs";
import chalk from "chalk";
import { scanRepo } from "../scanner.js";
import type { RepoScan } from "../types.js";

function isGitRepo(dir: string): boolean {
  try {
    accessSync(join(dir, ".git"));
    return true;
  } catch {
    return false;
  }
}

async function discoverRepos(root: string): Promise<string[]> {
  const repos: string[] = [];
  let entries: string[];

  try {
    entries = await readdir(root);
  } catch {
    return repos;
  }

  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const fullPath = join(root, entry);

    try {
      const s = await lstat(fullPath);
      if (!s.isDirectory()) continue;
    } catch {
      continue;
    }

    if (isGitRepo(fullPath)) {
      repos.push(fullPath);
    }
  }

  return repos.sort();
}

function formatRepoSummary(scan: RepoScan): string {
  const lines: string[] = [];

  lines.push(`### ${scan.name}`);

  const meta: string[] = [];
  if (scan.languages.length > 0) meta.push(`Language: ${scan.languages.join(", ")}`);
  if (scan.frameworks.length > 0) meta.push(`Framework: ${scan.frameworks.join(", ")}`);
  if (scan.testRunners.length > 0) meta.push(`Testing: ${scan.testRunners.join(", ")}`);
  if (scan.entryPoints.length > 0) meta.push(`Entry: ${scan.entryPoints.join(", ")}`);

  for (const item of meta) {
    lines.push(`- ${item}`);
  }

  if (scan.keyDependencies.length > 0) {
    lines.push(`- Key deps: ${scan.keyDependencies.slice(0, 10).join(", ")}`);
  }

  return lines.join("\n");
}

async function loadLearnings(root: string): Promise<string> {
  try {
    const content = await readFile(join(root, ".ai", "learnings.md"), "utf-8");
    return content.trim();
  } catch {
    return "";
  }
}

function generateWorkspaceContext(
  workspaceName: string,
  scans: readonly RepoScan[],
  learnings: string
): string {
  const sections: string[] = [];

  sections.push(`# ${workspaceName}\n`);

  if (scans.length > 0) {
    const repoSummaries = scans.map(formatRepoSummary).join("\n\n");
    sections.push(`## Repositories\n\n${repoSummaries}`);
  }

  if (learnings) {
    sections.push(`## Workspace Knowledge\n\n${learnings}`);
  }

  return sections.join("\n\n") + "\n";
}

async function ensureSymlink(source: string, target: string): Promise<void> {
  try {
    const s = await lstat(target);
    if (s.isSymbolicLink()) {
      const current = await readlink(target);
      if (current === source) return;
      await unlink(target);
    }
  } catch {
    // Target doesn't exist, that's fine
  }

  await symlink(source, target);
}

export async function initWorkspace(root: string): Promise<void> {
  const workspaceName = basename(root);

  console.log("");
  console.log(chalk.blue("  Scanning workspace..."));

  const repoPaths = await discoverRepos(root);

  if (repoPaths.length === 0) {
    console.log(chalk.yellow("  No git repositories found in this directory."));
    console.log(chalk.dim("  Run this from a directory containing your repos."));
    console.log("");
    return;
  }

  console.log(`  Found ${chalk.white(String(repoPaths.length))} repositories:\n`);

  // Scan each repo in parallel
  const scans = await Promise.all(
    repoPaths.map(async (repoPath) => {
      const scan = await scanRepo(repoPath);
      const lang = scan.languages.length > 0 ? chalk.dim(` (${scan.languages.join(", ")})`) : "";
      console.log(`    ${chalk.green("✓")} ${scan.name}${lang}`);
      return scan;
    })
  );

  // Create .ai/ directory
  const aiDir = join(root, ".ai");
  await mkdir(aiDir, { recursive: true });

  // Load existing learnings
  const learnings = await loadLearnings(root);

  // Generate workspace context
  const context = generateWorkspaceContext(workspaceName, scans, learnings);
  const contextPath = join(aiDir, "workspace.md");
  await writeFile(contextPath, context, "utf-8");

  console.log("");
  console.log(chalk.green("  Generated:"));
  console.log(`    .ai/workspace.md ${chalk.dim("— workspace context (all repos)")}`);

  // Create learnings.md if it doesn't exist
  const learningsPath = join(aiDir, "learnings.md");
  try {
    await readFile(learningsPath, "utf-8");
  } catch {
    const template = [
      "## Architecture\n",
      "## Conventions\n",
      "## Gotchas\n",
      "## Integrations\n",
      "## Domain\n",
    ].join("\n");
    await writeFile(learningsPath, template, "utf-8");
    console.log(`    .ai/learnings.md ${chalk.dim("— cross-repo knowledge")}`);
  }

  // Create CLAUDE.md symlink at workspace root (Claude walks up directories)
  const claudeMdPath = join(root, "CLAUDE.md");
  const relativeWorkspace = relative(root, contextPath);
  await ensureSymlink(relativeWorkspace, claudeMdPath);
  console.log(`    CLAUDE.md ${chalk.dim("→ .ai/workspace.md")}`);

  // Symlink workspace.md into each sub-repo's .ai/
  console.log("");
  console.log(chalk.blue("  Linking workspace into repos:"));

  for (const repoPath of repoPaths) {
    const repoAiDir = join(repoPath, ".ai");
    await mkdir(repoAiDir, { recursive: true });

    const targetPath = join(repoAiDir, "workspace.md");
    const relPath = relative(repoAiDir, contextPath);
    await ensureSymlink(relPath, targetPath);

    console.log(`    ${chalk.green("✓")} ${basename(repoPath)}/.ai/workspace.md → workspace`);
  }

  // Save config
  const config = {
    type: "workspace",
    repos: repoPaths.map((p) => basename(p)),
    lastScan: new Date().toISOString(),
  };
  await writeFile(
    join(aiDir, "config.json"),
    JSON.stringify(config, null, 2) + "\n",
    "utf-8"
  );

  console.log("");
  console.log(chalk.green("  Done."));
  console.log("");
  console.log("  Next steps:");
  console.log(chalk.dim("    ai learn --workspace -c integrations \"repo-a calls repo-b via /api/payments\""));
  console.log(chalk.dim("    cd repo-a && ai init     # set up repo-specific context"));
  console.log("");
  console.log("  Claude Code auto-reads the parent CLAUDE.md, so every repo gets");
  console.log("  workspace context automatically when you run claude inside a sub-repo.");
  console.log("");
}
