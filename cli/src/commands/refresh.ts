import { readFile, writeFile, readdir, lstat, readlink, unlink, symlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import chalk from "chalk";
import { scanRepo, getHeadCommit, getCommitsSince } from "../scanner.js";
import { generateContext } from "../generator.js";
import { linkEditor } from "../editors.js";
import type { AIConfig } from "../types.js";

const REPO_DIR = resolve(homedir(), ".ai-agents-repo");

interface SyncTarget {
  sourceDir: string;
  targetDir: string;
  pattern: string;
}

async function syncGlobalSymlinks(): Promise<void> {
  const targets: SyncTarget[] = [
    {
      sourceDir: join(REPO_DIR, "claude", "commands"),
      targetDir: join(homedir(), ".claude", "commands"),
      pattern: ".md",
    },
    {
      sourceDir: join(REPO_DIR, "claude", "rules"),
      targetDir: join(homedir(), ".claude", "rules", "common"),
      pattern: ".md",
    },
  ];

  let cleaned = 0;
  let linked = 0;

  for (const target of targets) {
    if (!existsSync(target.targetDir)) continue;

    const entries = await readdir(target.targetDir);

    for (const entry of entries) {
      const fullPath = join(target.targetDir, entry);
      const stat = await lstat(fullPath);

      if (!stat.isSymbolicLink()) continue;

      const dest = await readlink(fullPath);
      if (!dest.startsWith(REPO_DIR)) continue;

      // Symlink points into our repo but target is gone — remove it
      if (!existsSync(fullPath)) {
        await unlink(fullPath);
        console.log(`    ${chalk.yellow("⊘")} Removed broken: ${entry}`);
        cleaned++;
      }
    }

    // Add symlinks for new source files that aren't linked yet
    if (existsSync(target.sourceDir)) {
      const sourceFiles = await readdir(target.sourceDir);
      for (const file of sourceFiles) {
        if (!file.endsWith(target.pattern)) continue;
        const targetPath = join(target.targetDir, file);
        const sourcePath = join(target.sourceDir, file);

        if (!existsSync(targetPath)) {
          await symlink(sourcePath, targetPath);
          console.log(`    ${chalk.green("+")} Linked new: ${file}`);
          linked++;
        }
      }
    }
  }

  if (cleaned === 0 && linked === 0) {
    console.log(chalk.dim("    All global symlinks up to date."));
  }
}

export async function refresh(root: string): Promise<void> {
  const configPath = join(root, ".ai", "config.json");

  let config: AIConfig;
  try {
    const raw = await readFile(configPath, "utf-8");
    config = JSON.parse(raw) as AIConfig;
  } catch {
    console.log(
      chalk.yellow("  No .ai/config.json found. Run `ai init` first.")
    );
    return;
  }

  // Staleness check
  if (config.lastCommit) {
    const commitsSince = getCommitsSince(root, config.lastCommit);
    if (commitsSince > 0) {
      console.log("");
      console.log(
        chalk.yellow(
          `  Warning: ${commitsSince} commit${commitsSince === 1 ? "" : "s"} since last scan (${config.lastScan.split("T")[0]})`
        )
      );
    } else if (commitsSince === 0) {
      console.log("");
      console.log(chalk.dim("  No new commits since last scan."));
    }
  }

  console.log("");
  console.log(chalk.blue("  Scanning repository..."));

  const scan = await scanRepo(root);
  const context = await generateContext(scan);

  const contextPath = join(root, ".ai", "context.md");
  await writeFile(contextPath, context, "utf-8");
  console.log(chalk.green("  Regenerated .ai/context.md"));

  // Update symlinks
  if (config.editors.length > 0) {
    console.log(
      chalk.dim(`  Updating symlinks: ${config.editors.join(", ")}`)
    );
    for (const editorId of config.editors) {
      const result = await linkEditor(root, editorId, contextPath);
      if (result.ok) {
        console.log(`    ${chalk.green("✓")} ${result.message}`);
      } else {
        console.log(`    ${chalk.red("✗")} ${result.message}`);
      }
    }
  }

  // Sync global symlinks (rules, commands)
  console.log("");
  console.log(chalk.blue("  Syncing global symlinks..."));
  await syncGlobalSymlinks();

  // Update config
  const headCommit = getHeadCommit(root);
  const updatedConfig: AIConfig = {
    ...config,
    lastScan: new Date().toISOString(),
    lastCommit: headCommit,
  };
  await writeFile(
    configPath,
    JSON.stringify(updatedConfig, null, 2) + "\n",
    "utf-8"
  );

  console.log("");
  console.log(chalk.green("  Done."));
  console.log("");
}
