import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import prompts from "prompts";
import { LEARNING_CATEGORIES } from "../types.js";
const SECTION_HEADERS = {
    architecture: "## Architecture",
    conventions: "## Conventions",
    gotchas: "## Gotchas",
    integrations: "## Integrations",
    domain: "## Domain",
};
async function fileExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
export async function learn(root, text, options) {
    const learningsPath = join(root, ".ai", "learnings.md");
    if (!(await fileExists(learningsPath))) {
        console.log(chalk.yellow("  No .ai/learnings.md found. Run `ai init` first."));
        return;
    }
    // Determine category
    let category;
    if (options.category) {
        const valid = LEARNING_CATEGORIES.find((c) => c.value === options.category);
        if (!valid) {
            console.log(chalk.red(`  Unknown category: ${options.category}`));
            console.log(`  Valid categories: ${LEARNING_CATEGORIES.map((c) => c.value).join(", ")}`);
            return;
        }
        category = valid.value;
    }
    else {
        const response = await prompts({
            type: "select",
            name: "category",
            message: "Select category",
            choices: LEARNING_CATEGORIES.map((c) => ({
                title: `${c.label}  ${chalk.dim(`(${c.hint})`)}`,
                value: c.value,
            })),
        });
        if (!response.category) {
            console.log(chalk.yellow("  No category selected. Exiting."));
            return;
        }
        category = response.category;
    }
    // Read current learnings
    const content = await readFile(learningsPath, "utf-8");
    const date = new Date().toISOString().split("T")[0];
    const entry = `- ${text} (${date})`;
    // Find the section and append
    const header = SECTION_HEADERS[category];
    const headerIndex = content.indexOf(header);
    let updated;
    if (headerIndex === -1) {
        // Section doesn't exist, append it
        updated = content.trimEnd() + `\n\n${header}\n\n${entry}\n`;
    }
    else {
        // Find the end of this section (next ## or EOF)
        const afterHeader = headerIndex + header.length;
        const nextSectionIndex = content.indexOf("\n## ", afterHeader);
        if (nextSectionIndex === -1) {
            // Last section, append to end
            updated = content.trimEnd() + `\n${entry}\n`;
        }
        else {
            // Insert before next section
            const before = content.slice(0, nextSectionIndex).trimEnd();
            const after = content.slice(nextSectionIndex);
            updated = `${before}\n${entry}\n${after}`;
        }
    }
    await writeFile(learningsPath, updated, "utf-8");
    const label = LEARNING_CATEGORIES.find((c) => c.value === category)?.label ?? category;
    console.log("");
    console.log(`  ${chalk.green("✓")} Added to ${chalk.white(label)}: ${text}`);
    console.log("");
}
//# sourceMappingURL=learn.js.map