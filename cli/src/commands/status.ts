import { readFile, access, lstat, readlink } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { getCommitsSince } from "../scanner.js";
import { EDITORS, type AIConfig } from "../types.js";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function isValidSymlink(path: string): Promise<boolean> {
  try {
    const s = await lstat(path);
    if (!s.isSymbolicLink()) return false;
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function status(root: string): Promise<void> {
  const configPath = join(root, ".ai", "config.json");

  if (!(await fileExists(configPath))) {
    console.log("");
    console.log(
      chalk.yellow("  Not initialized. Run `ai init` to set up this repo.")
    );
    console.log("");
    return;
  }

  let config: AIConfig;
  try {
    const raw = await readFile(configPath, "utf-8");
    config = JSON.parse(raw) as AIConfig;
  } catch {
    console.log(chalk.red("  Failed to read .ai/config.json"));
    return;
  }

  console.log("");
  console.log(`  ${chalk.white(config.repoRoot)}`);
  console.log("");

  // Context file
  const contextExists = await fileExists(join(root, ".ai", "context.md"));
  console.log(
    `  Context:    ${contextExists ? chalk.green("✓ .ai/context.md") : chalk.red("✗ missing")}`
  );

  // Learnings
  const learningsPath = join(root, ".ai", "learnings.md");
  if (await fileExists(learningsPath)) {
    const content = await readFile(learningsPath, "utf-8");
    const entryCount = (content.match(/^- /gm) || []).length;
    console.log(
      `  Learnings:  ${chalk.green(`✓ ${entryCount} entries`)}`
    );
  } else {
    console.log(`  Learnings:  ${chalk.dim("none")}`);
  }

  // Last scan
  const scanDate = config.lastScan.split("T")[0];
  let stalenessNote = "";
  if (config.lastCommit) {
    const commits = getCommitsSince(root, config.lastCommit);
    if (commits > 20) {
      stalenessNote = chalk.red(` (${commits} commits behind — run ai refresh)`);
    } else if (commits > 0) {
      stalenessNote = chalk.yellow(` (${commits} commits behind)`);
    } else if (commits === 0) {
      stalenessNote = chalk.green(" (up to date)");
    }
  }
  console.log(`  Last scan:  ${scanDate}${stalenessNote}`);

  // Editors
  console.log("");
  console.log("  Editors:");

  for (const editor of EDITORS) {
    const targetPath = join(root, editor.path);
    const isConfigured = config.editors.includes(editor.id);

    if (isConfigured) {
      const valid = await isValidSymlink(targetPath);
      if (valid) {
        console.log(`    ${chalk.green("✓")} ${editor.name} ${chalk.dim(`(${editor.path})`)}`);
      } else {
        console.log(
          `    ${chalk.red("✗")} ${editor.name} ${chalk.dim(`(${editor.path})`)} — ${chalk.red("broken symlink")}`
        );
      }
    } else if (await fileExists(targetPath)) {
      console.log(
        `    ${chalk.dim("○")} ${editor.name} ${chalk.dim(`(${editor.path} exists but not managed)`)}`
      );
    }
  }

  console.log("");
}
