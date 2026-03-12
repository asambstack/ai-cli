#!/usr/bin/env node

import { resolve } from "node:path";
import { accessSync } from "node:fs";
import chalk from "chalk";
import { init } from "./commands/init.js";
import { initWorkspace } from "./commands/workspace.js";
import { learn } from "./commands/learn.js";
import { refresh } from "./commands/refresh.js";
import { status } from "./commands/status.js";
import { dashboard } from "./commands/dashboard.js";

function findRepoRoot(dir: string): string | null {
  let current = resolve(dir);
  while (true) {
    try {
      accessSync(resolve(current, ".git"));
      return current;
    } catch {
      const parent = resolve(current, "..");
      if (parent === current) return null;
      current = parent;
    }
  }
}

function printHelp(): void {
  console.log("");
  console.log("  ai — repo context manager for AI code editors");
  console.log("");
  console.log("  Repo commands (run inside a git repo):");
  console.log("    ai init                          Scan repo, pick editors, generate context");
  console.log("    ai init --all                    Configure all editors (non-interactive)");
  console.log("    ai init --editors claude,cursor   Configure specific editors");
  console.log("    ai learn \"<text>\"                 Add knowledge (interactive category)");
  console.log("    ai learn -c architecture \"<text>\" Add to specific category");
  console.log("    ai refresh                       Re-scan and regenerate context");
  console.log("    ai status                        Show current setup and staleness");
  console.log("");
  console.log("  Workspace commands (run from parent directory with multiple repos):");
  console.log("    ai init --workspace              Scan all sub-repos, generate workspace context");
  console.log("    ai learn --workspace \"<text>\"     Add cross-repo knowledge");
  console.log("    ai refresh --workspace           Re-scan all sub-repos");
  console.log("    ai status --workspace            Show workspace overview");
  console.log("");
  console.log("  Categories for learn:");
  console.log("    architecture    system design, patterns, data flow");
  console.log("    conventions     naming, style, file organization");
  console.log("    gotchas         known issues, quirks, workarounds");
  console.log("    integrations    external services, APIs");
  console.log("    domain          business logic, key concepts");
  console.log("");
  console.log("  Other commands:");
  console.log("    ai dashboard                     Open visual dashboard in browser");
  console.log("");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
    printHelp();
    return;
  }

  const command = args[0];

  // Global commands (no git/workspace required)
  if (command === "dashboard") {
    await dashboard();
    return;
  }

  const isWorkspace = args.includes("--workspace");

  if (isWorkspace) {
    // Workspace mode — operates on current directory (no git required)
    const root = resolve(process.cwd());

    switch (command) {
      case "init": {
        await initWorkspace(root);
        break;
      }

      case "learn": {
        const categoryIndex = args.indexOf("-c");
        let category: string | undefined;
        let textParts: string[];

        if (categoryIndex !== -1) {
          category = args[categoryIndex + 1];
          textParts = args.filter(
            (_, i) =>
              i !== 0 &&
              i !== categoryIndex &&
              i !== categoryIndex + 1 &&
              args[i] !== "--workspace"
          );
        } else {
          textParts = args.slice(1).filter((a) => a !== "--workspace");
        }

        const text = textParts.join(" ").trim();
        if (!text) {
          console.log(chalk.yellow("  Usage: ai learn --workspace \"your knowledge here\""));
          return;
        }

        await learn(root, text, { category });
        break;
      }

      case "refresh": {
        // Refresh workspace = re-init
        await initWorkspace(root);
        break;
      }

      case "status": {
        await status(root);
        break;
      }

      default: {
        console.log(chalk.red(`  Unknown command: ${command}`));
        printHelp();
        process.exit(1);
      }
    }

    return;
  }

  // Repo mode — requires git
  const root = findRepoRoot(process.cwd());
  if (!root) {
    console.log(chalk.red("  Not inside a git repository."));
    console.log(chalk.dim("  Use --workspace flag for multi-repo directories."));
    process.exit(1);
  }

  switch (command) {
    case "init": {
      const allFlag = args.includes("--all");
      const editorsIndex = args.indexOf("--editors");
      const editors =
        editorsIndex !== -1 && args[editorsIndex + 1]
          ? args[editorsIndex + 1].split(",")
          : undefined;

      await init(root, { all: allFlag, editors });
      break;
    }

    case "learn": {
      const categoryIndex = args.indexOf("-c");
      let category: string | undefined;
      let textParts: string[];

      if (categoryIndex !== -1) {
        category = args[categoryIndex + 1];
        textParts = args.filter(
          (_, i) => i !== 0 && i !== categoryIndex && i !== categoryIndex + 1
        );
      } else {
        textParts = args.slice(1);
      }

      const text = textParts.join(" ").trim();
      if (!text) {
        console.log(chalk.yellow("  Usage: ai learn \"your knowledge here\""));
        return;
      }

      await learn(root, text, { category });
      break;
    }

    case "refresh": {
      await refresh(root);
      break;
    }

    case "status": {
      await status(root);
      break;
    }

    default: {
      console.log(chalk.red(`  Unknown command: ${command}`));
      printHelp();
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(chalk.red(`  Error: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
