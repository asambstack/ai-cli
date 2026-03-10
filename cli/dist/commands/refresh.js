import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { scanRepo, getHeadCommit, getCommitsSince } from "../scanner.js";
import { generateContext } from "../generator.js";
import { linkEditor } from "../editors.js";
export async function refresh(root) {
    const configPath = join(root, ".ai", "config.json");
    let config;
    try {
        const raw = await readFile(configPath, "utf-8");
        config = JSON.parse(raw);
    }
    catch {
        console.log(chalk.yellow("  No .ai/config.json found. Run `ai init` first."));
        return;
    }
    // Staleness check
    if (config.lastCommit) {
        const commitsSince = getCommitsSince(root, config.lastCommit);
        if (commitsSince > 0) {
            console.log("");
            console.log(chalk.yellow(`  Warning: ${commitsSince} commit${commitsSince === 1 ? "" : "s"} since last scan (${config.lastScan.split("T")[0]})`));
        }
        else if (commitsSince === 0) {
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
        console.log(chalk.dim(`  Updating symlinks: ${config.editors.join(", ")}`));
        for (const editorId of config.editors) {
            const result = await linkEditor(root, editorId, contextPath);
            if (result.ok) {
                console.log(`    ${chalk.green("✓")} ${result.message}`);
            }
            else {
                console.log(`    ${chalk.red("✗")} ${result.message}`);
            }
        }
    }
    // Update config
    const headCommit = getHeadCommit(root);
    const updatedConfig = {
        ...config,
        lastScan: new Date().toISOString(),
        lastCommit: headCommit,
    };
    await writeFile(configPath, JSON.stringify(updatedConfig, null, 2) + "\n", "utf-8");
    console.log("");
    console.log(chalk.green("  Done."));
    console.log("");
}
//# sourceMappingURL=refresh.js.map