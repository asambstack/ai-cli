export interface RepoScan {
  readonly name: string;
  readonly root: string;
  readonly languages: readonly string[];
  readonly frameworks: readonly string[];
  readonly testRunners: readonly string[];
  readonly buildTools: readonly string[];
  readonly entryPoints: readonly string[];
  readonly scripts: Readonly<Record<string, string>>;
  readonly structure: readonly DirEntry[];
  readonly ci: readonly string[];
  readonly config: readonly string[];
  readonly keyDependencies: readonly string[];
  readonly devDependencies: readonly string[];
}

export interface DirEntry {
  readonly path: string;
  readonly description: string;
}

export interface AIConfig {
  readonly editors: readonly string[];
  readonly lastScan: string;
  readonly lastCommit: string;
  readonly repoRoot: string;
}

export interface Learning {
  readonly category: LearningCategory;
  readonly text: string;
  readonly date: string;
}

export type LearningCategory =
  | "architecture"
  | "conventions"
  | "gotchas"
  | "integrations"
  | "domain";

export const LEARNING_CATEGORIES: readonly {
  readonly value: LearningCategory;
  readonly label: string;
  readonly hint: string;
}[] = [
  { value: "architecture", label: "Architecture", hint: "system design, patterns, data flow" },
  { value: "conventions", label: "Conventions", hint: "naming, style, file organization" },
  { value: "gotchas", label: "Gotchas", hint: "known issues, quirks, workarounds" },
  { value: "integrations", label: "Integrations", hint: "external services, APIs" },
  { value: "domain", label: "Domain", hint: "business logic, key concepts" },
];

export interface EditorDef {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly detectPaths: readonly string[];
}

export const EDITORS: readonly EditorDef[] = [
  {
    id: "claude",
    name: "Claude Code",
    path: "CLAUDE.md",
    detectPaths: [".claude", "CLAUDE.md"],
  },
  {
    id: "opencode",
    name: "OpenCode",
    path: ".opencode/instructions.md",
    detectPaths: [".opencode"],
  },
  {
    id: "cursor",
    name: "Cursor",
    path: ".cursorrules",
    detectPaths: [".cursorrules", ".cursor"],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    path: ".windsurfrules",
    detectPaths: [".windsurfrules"],
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    path: ".github/copilot-instructions.md",
    detectPaths: [".github/copilot-instructions.md"],
  },
  {
    id: "cline",
    name: "Cline",
    path: ".clinerules",
    detectPaths: [".clinerules"],
  },
  {
    id: "aider",
    name: "Aider",
    path: "CONVENTIONS.md",
    detectPaths: ["CONVENTIONS.md", ".aider.conf.yml"],
  },
];
