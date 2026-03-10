export const LEARNING_CATEGORIES = [
    { value: "architecture", label: "Architecture", hint: "system design, patterns, data flow" },
    { value: "conventions", label: "Conventions", hint: "naming, style, file organization" },
    { value: "gotchas", label: "Gotchas", hint: "known issues, quirks, workarounds" },
    { value: "integrations", label: "Integrations", hint: "external services, APIs" },
    { value: "domain", label: "Domain", hint: "business logic, key concepts" },
];
export const EDITORS = [
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
//# sourceMappingURL=types.js.map