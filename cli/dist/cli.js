#!/usr/bin/env node
import { resolve } from "node:path";
import chalk from "chalk";
import { init } from "./commands/init.js";
import { learn } from "./commands/learn.js";
import { refresh } from "./commands/refresh.js";
import { status } from "./commands/status.js";
function findRepoRoot(dir) {
    let current = resolve(dir);
    while (true) {
        try {
            require("node:fs").accessSync(resolve(current, ".git"));
            return current;
        }
        catch {
            const parent = resolve(current, "..");
            if (parent === current)
                return null;
            current = parent;
        }
    }
}
function printHelp() {
    console.log("");
    console.log("  ai — repo context manager for AI code editors");
    console.log("");
    console.log("  Usage:");
    console.log("    ai init                       Scan repo, pick editors, generate context");
    console.log("    ai init --all                 Configure all editors (non-interactive)");
    console.log("    ai init --editors claude,cursor  Configure specific editors");
    console.log("    ai learn \"<text>\"              Add knowledge (interactive category)");
    console.log("    ai learn -c architecture \"<text>\"  Add knowledge to specific category");
    console.log("    ai refresh                    Re-scan and regenerate context");
    console.log("    ai status                     Show current setup and staleness");
    console.log("    ai help                       Show this help");
    console.log("");
    console.log("  Categories for learn:");
    console.log("    architecture    system design, patterns, data flow");
    console.log("    conventions     naming, style, file organization");
    console.log("    gotchas         known issues, quirks, workarounds");
    console.log("    integrations    external services, APIs");
    console.log("    domain          business logic, key concepts");
    console.log("");
}
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
        printHelp();
        return;
    }
    const command = args[0];
    // Find repo root (except for help)
    const root = findRepoRoot(process.cwd());
    if (!root) {
        console.log(chalk.red("  Not inside a git repository."));
        process.exit(1);
    }
    switch (command) {
        case "init": {
            const allFlag = args.includes("--all");
            const editorsIndex = args.indexOf("--editors");
            const editors = editorsIndex !== -1 && args[editorsIndex + 1]
                ? args[editorsIndex + 1].split(",")
                : undefined;
            await init(root, { all: allFlag, editors });
            break;
        }
        case "learn": {
            // Parse: ai learn -c <category> "<text>"
            // Or:    ai learn "<text>"
            const categoryIndex = args.indexOf("-c");
            let category;
            let textParts;
            if (categoryIndex !== -1) {
                category = args[categoryIndex + 1];
                textParts = args.filter((_, i) => i !== 0 && i !== categoryIndex && i !== categoryIndex + 1);
            }
            else {
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
//# sourceMappingURL=cli.js.map