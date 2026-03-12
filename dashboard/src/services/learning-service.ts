import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

export type LearningCategory =
  | "architecture"
  | "conventions"
  | "gotchas"
  | "integrations"
  | "domain";

export const LEARNING_CATEGORIES: readonly {
  readonly value: LearningCategory;
  readonly label: string;
}[] = [
  { value: "architecture", label: "Architecture" },
  { value: "conventions", label: "Conventions" },
  { value: "gotchas", label: "Gotchas" },
  { value: "integrations", label: "Integrations" },
  { value: "domain", label: "Domain" },
];

const SECTION_HEADERS: Record<LearningCategory, string> = {
  architecture: "## Architecture",
  conventions: "## Conventions",
  gotchas: "## Gotchas",
  integrations: "## Integrations",
  domain: "## Domain",
};

export interface LearningEntry {
  readonly category: LearningCategory;
  readonly text: string;
  readonly date: string;
  readonly index: number;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function getLearningsPath(root: string): string {
  return join(root, ".ai", "learnings.md");
}

export function parseLearnings(content: string): readonly LearningEntry[] {
  const lines = content.split("\n");
  const entries: LearningEntry[] = [];
  let currentCategory: LearningCategory | null = null;
  let index = 0;

  for (const line of lines) {
    // Check for section headers
    for (const [cat, header] of Object.entries(SECTION_HEADERS)) {
      if (line.trim() === header) {
        currentCategory = cat as LearningCategory;
        break;
      }
    }

    // Parse learning entries: "- text (date)"
    if (currentCategory && line.trimStart().startsWith("- ")) {
      const entryText = line.trimStart().slice(2);
      const dateMatch = entryText.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);

      if (dateMatch) {
        const text = entryText.slice(0, dateMatch.index).trim();
        entries.push({
          category: currentCategory,
          text,
          date: dateMatch[1],
          index,
        });
      } else {
        entries.push({
          category: currentCategory,
          text: entryText.trim(),
          date: "",
          index,
        });
      }
      index++;
    }
  }

  return entries;
}

export async function getLearnings(
  root: string
): Promise<readonly LearningEntry[]> {
  const path = getLearningsPath(root);
  if (!(await fileExists(path))) return [];

  const content = await readFile(path, "utf-8");
  return parseLearnings(content);
}

export async function addLearning(
  root: string,
  category: LearningCategory,
  text: string
): Promise<void> {
  const path = getLearningsPath(root);
  if (!(await fileExists(path))) {
    throw new Error("No learnings.md found. Run `ai init` first.");
  }

  const content = await readFile(path, "utf-8");
  const date = new Date().toISOString().split("T")[0];
  const entry = `- ${text} (${date})`;

  const header = SECTION_HEADERS[category];
  const headerIndex = content.indexOf(header);

  let updated: string;
  if (headerIndex === -1) {
    updated = content.trimEnd() + `\n\n${header}\n\n${entry}\n`;
  } else {
    const afterHeader = headerIndex + header.length;
    const nextSectionIndex = content.indexOf("\n## ", afterHeader);

    if (nextSectionIndex === -1) {
      updated = content.trimEnd() + `\n${entry}\n`;
    } else {
      const before = content.slice(0, nextSectionIndex).trimEnd();
      const after = content.slice(nextSectionIndex);
      updated = `${before}\n${entry}\n${after}`;
    }
  }

  await writeFile(path, updated, "utf-8");
}

export async function updateLearning(
  root: string,
  targetIndex: number,
  newText: string
): Promise<void> {
  const path = getLearningsPath(root);
  const content = await readFile(path, "utf-8");
  const lines = content.split("\n");

  let entryIndex = 0;
  const updatedLines = lines.map((line) => {
    if (line.trimStart().startsWith("- ")) {
      if (entryIndex === targetIndex) {
        const date = new Date().toISOString().split("T")[0];
        entryIndex++;
        return `- ${newText} (${date})`;
      }
      entryIndex++;
    }
    return line;
  });

  await writeFile(path, updatedLines.join("\n"), "utf-8");
}

export async function deleteLearning(
  root: string,
  targetIndex: number
): Promise<void> {
  const path = getLearningsPath(root);
  const content = await readFile(path, "utf-8");
  const lines = content.split("\n");

  let entryIndex = 0;
  const updatedLines = lines.filter((line) => {
    if (line.trimStart().startsWith("- ")) {
      if (entryIndex === targetIndex) {
        entryIndex++;
        return false;
      }
      entryIndex++;
    }
    return true;
  });

  await writeFile(path, updatedLines.join("\n"), "utf-8");
}
