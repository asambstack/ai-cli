import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import prompts from "prompts";
import { scanRepo, getHeadCommit } from "../scanner.js";
import { generateContext } from "../generator.js";
import { detectEditors, linkEditor } from "../editors.js";
import { EDITORS, type AIConfig } from "../types.js";

interface InitOptions {
  readonly all?: boolean;
  readonly editors?: readonly string[];
}

export async function init(root: string, options: InitOptions): Promise<void> {
  console.log("");
  console.log(chalk.blue("  Scanning repository..."));
  console.log("");

  const scan = await scanRepo(root);

  // Display detected info
  console.log("  Detected:");
  if (scan.languages.length > 0) {
    console.log(`    Language:    ${chalk.white(scan.languages.join(", "))}`);
  }
  if (scan.frameworks.length > 0) {
    console.log(`    Framework:   ${chalk.white(scan.frameworks.join(", "))}`);
  }
  if (scan.testRunners.length > 0) {
    console.log(`    Test runner: ${chalk.white(scan.testRunners.join(", "))}`);
  }
  if (scan.buildTools.length > 0) {
    console.log(`    Build tool:  ${chalk.white(scan.buildTools.join(", "))}`);
  }
  if (scan.structure.length > 0) {
    const dirs = scan.structure
      .filter((e) => !e.path.includes("/"))
      .map((e) => e.path)
      .slice(0, 8);
    console.log(`    Structure:   ${chalk.white(dirs.join(", "))}`);
  }
  if (scan.ci.length > 0) {
    console.log(`    CI:          ${chalk.white(scan.ci.join(", "))}`);
  }
  if (scan.entryPoints.length > 0) {
    console.log(`    Entry:       ${chalk.white(scan.entryPoints.join(", "))}`);
  }
  console.log("");

  // Determine which editors to configure
  let selectedEditors: string[];

  if (options.all) {
    selectedEditors = EDITORS.map((e) => e.id);
  } else if (options.editors && options.editors.length > 0) {
    selectedEditors = [...options.editors];
  } else {
    // Interactive selection
    const detectedEditors = detectEditors(root);

    const response = await prompts({
      type: "multiselect",
      name: "editors",
      message: "Select editors to configure",
      choices: EDITORS.map((editor) => ({
        title: `${editor.name}  ${chalk.dim(`(${editor.path})`)}`,
        value: editor.id,
        selected: detectedEditors.includes(editor.id),
      })),
      hint: "- Space to toggle. Enter to confirm.",
    });

    if (!response.editors || response.editors.length === 0) {
      console.log(chalk.yellow("  No editors selected. Exiting."));
      return;
    }

    selectedEditors = response.editors;
  }

  // Create .ai/ directory
  const aiDir = join(root, ".ai");
  await mkdir(aiDir, { recursive: true });

  // Generate context
  const context = await generateContext(scan);
  const contextPath = join(aiDir, "context.md");
  await writeFile(contextPath, context, "utf-8");
  console.log(chalk.green("  Generated:"));
  console.log(`    .ai/context.md ${chalk.dim("— repo context (canonical)")}`);

  // Create learnings.md if it doesn't exist
  const learningsPath = join(aiDir, "learnings.md");
  try {
    await readFile(learningsPath, "utf-8");
  } catch {
    const learningsTemplate = [
      "## Architecture\n",
      "## Conventions\n",
      "## Gotchas\n",
      "## Integrations\n",
      "## Domain\n",
    ].join("\n");
    await writeFile(learningsPath, learningsTemplate, "utf-8");
    console.log(`    .ai/learnings.md ${chalk.dim("— manual knowledge")}`);
  }

  // Save config
  const headCommit = getHeadCommit(root);
  const config: AIConfig = {
    editors: selectedEditors,
    lastScan: new Date().toISOString(),
    lastCommit: headCommit,
    repoRoot: root,
  };
  await writeFile(
    join(aiDir, "config.json"),
    JSON.stringify(config, null, 2) + "\n",
    "utf-8"
  );

  // Create symlinks for each editor
  console.log("");
  for (const editorId of selectedEditors) {
    const result = await linkEditor(root, editorId, contextPath);
    if (result.ok) {
      console.log(`    ${chalk.green("✓")} ${result.message}`);
    } else {
      console.log(`    ${chalk.red("✗")} ${result.message}`);
    }
  }

  console.log("");
  console.log(
    chalk.green("  Done.") +
      chalk.dim(" Run `ai learn` to add project-specific knowledge.")
  );
  console.log("");
}
