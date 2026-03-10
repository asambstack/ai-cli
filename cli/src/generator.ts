import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { RepoScan } from "./types.js";

function formatList(items: readonly string[], prefix: string = "- "): string {
  return items.map((item) => `${prefix}${item}`).join("\n");
}

function formatStructure(
  entries: readonly { readonly path: string; readonly description: string }[]
): string {
  const lines: string[] = [];
  for (const entry of entries) {
    const indent = "  ".repeat(entry.path.split("/").length - 1);
    const dirName = entry.path.replace(/\/$/, "").split("/").pop() ?? entry.path;
    const desc = entry.description ? ` — ${entry.description}` : "";
    lines.push(`${indent}${dirName}/${desc}`);
  }
  return lines.join("\n");
}

function formatScripts(scripts: Readonly<Record<string, string>>): string {
  const entries = Object.entries(scripts);
  if (entries.length === 0) return "";

  const useful = entries.filter(([key]) =>
    ["dev", "start", "build", "test", "lint", "format", "check", "deploy", "seed", "migrate"].some(
      (k) => key.includes(k)
    )
  );

  if (useful.length === 0) return "";

  return useful
    .map(([key, value]) => `- \`${key}\` — ${value}`)
    .join("\n");
}

async function loadLearnings(root: string): Promise<string> {
  const learningsPath = join(root, ".ai", "learnings.md");
  try {
    const content = await readFile(learningsPath, "utf-8");
    return content.trim();
  } catch {
    return "";
  }
}

export async function generateContext(scan: RepoScan): Promise<string> {
  const sections: string[] = [];

  // Header
  sections.push(`# ${scan.name}\n`);

  // Stack
  const stackLines: string[] = [];
  if (scan.languages.length > 0) {
    stackLines.push(`- **Language:** ${scan.languages.join(", ")}`);
  }
  if (scan.frameworks.length > 0) {
    stackLines.push(`- **Framework:** ${scan.frameworks.join(", ")}`);
  }
  if (scan.testRunners.length > 0) {
    stackLines.push(`- **Testing:** ${scan.testRunners.join(", ")}`);
  }
  if (scan.buildTools.length > 0) {
    stackLines.push(`- **Build:** ${scan.buildTools.join(", ")}`);
  }
  if (scan.ci.length > 0) {
    stackLines.push(`- **CI:** ${scan.ci.join(", ")}`);
  }

  if (stackLines.length > 0) {
    sections.push(`## Stack\n\n${stackLines.join("\n")}`);
  }

  // Structure
  if (scan.structure.length > 0) {
    const described = scan.structure.filter((e) => e.description);
    const undescribed = scan.structure.filter((e) => !e.description);
    const toShow = [...described, ...undescribed.slice(0, 5)];

    if (toShow.length > 0) {
      sections.push(`## Structure\n\n\`\`\`\n${formatStructure(toShow)}\n\`\`\``);
    }
  }

  // Entry points
  if (scan.entryPoints.length > 0) {
    sections.push(`## Entry Points\n\n${formatList(scan.entryPoints)}`);
  }

  // Key dependencies
  if (scan.keyDependencies.length > 0) {
    sections.push(`## Key Dependencies\n\n${formatList(scan.keyDependencies)}`);
  }

  // Scripts
  const scriptsBlock = formatScripts(scan.scripts);
  if (scriptsBlock) {
    sections.push(`## Scripts\n\n${scriptsBlock}`);
  }

  // Config
  if (scan.config.length > 0) {
    sections.push(`## Configuration\n\n${formatList(scan.config)}`);
  }

  // Learnings
  const learnings = await loadLearnings(scan.root);
  if (learnings) {
    sections.push(`## Project Knowledge\n\n${learnings}`);
  }

  return sections.join("\n\n") + "\n";
}
