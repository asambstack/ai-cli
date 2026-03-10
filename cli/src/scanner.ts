import { readdir, stat, access } from "node:fs/promises";
import { accessSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { execSync } from "node:child_process";
import type { RepoScan, DirEntry } from "./types.js";
import { scanNode } from "./scanners/node.js";
import { scanPython } from "./scanners/python.js";
import { scanRuby } from "./scanners/ruby.js";
import { scanGo } from "./scanners/go.js";
import { scanRust } from "./scanners/rust.js";

const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", ".nuxt",
  "__pycache__", ".venv", "venv", "env", ".tox", ".mypy_cache",
  "vendor", ".bundle", "tmp", "log",
  "target", ".cargo",
  ".idea", ".vscode", ".DS_Store", "coverage", ".cache",
]);

const CI_FILES: readonly string[] = [
  ".github/workflows",
  "Jenkinsfile",
  ".gitlab-ci.yml",
  ".circleci",
  ".travis.yml",
  "bitbucket-pipelines.yml",
];

const CONFIG_FILES: readonly string[] = [
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".env.example",
  "tsconfig.json",
  "pyproject.toml",
  "Makefile",
  ".eslintrc.json",
  ".prettierrc",
  "biome.json",
];

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function scanStructure(root: string, maxDepth: number = 3): Promise<DirEntry[]> {
  const entries: DirEntry[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    let items: string[];
    try {
      items = await readdir(dir);
    } catch {
      return;
    }

    for (const item of items) {
      if (IGNORED_DIRS.has(item) || item.startsWith(".")) continue;

      const fullPath = join(dir, item);
      const s = await stat(fullPath).catch(() => null);
      if (!s || !s.isDirectory()) continue;

      const relativePath = fullPath.slice(root.length + 1) + "/";
      entries.push({ path: relativePath, description: "" });
      await walk(fullPath, depth + 1);
    }
  }

  await walk(root, 1);
  return entries;
}

function describeDirectory(path: string): string {
  const name = path.replace(/\/$/, "").split("/").pop() ?? "";
  const descriptions: Record<string, string> = {
    src: "Source code",
    lib: "Library code",
    app: "Application code",
    api: "API layer",
    routes: "HTTP route handlers",
    controllers: "Request controllers",
    services: "Business logic",
    models: "Data models",
    schemas: "Schema definitions",
    middleware: "Middleware",
    utils: "Utility functions",
    helpers: "Helper functions",
    config: "Configuration",
    scripts: "Build/utility scripts",
    test: "Tests",
    tests: "Tests",
    spec: "Test specs",
    __tests__: "Tests",
    fixtures: "Test fixtures",
    mocks: "Test mocks",
    migrations: "Database migrations",
    prisma: "Prisma schema and migrations",
    public: "Static assets",
    static: "Static files",
    assets: "Asset files",
    styles: "Stylesheets",
    components: "UI components",
    pages: "Page components",
    views: "View templates",
    templates: "Templates",
    layouts: "Layout components",
    hooks: "Custom hooks",
    store: "State management",
    types: "Type definitions",
    interfaces: "Interface definitions",
    constants: "Constants",
    docs: "Documentation",
    bin: "Executable scripts",
    cmd: "CLI entry points",
    pkg: "Importable packages",
    internal: "Internal packages",
    deploy: "Deployment config",
    infra: "Infrastructure",
    ci: "CI/CD config",
  };
  return descriptions[name] ?? "";
}

function getActiveDirectories(root: string): string[] {
  try {
    const output = execSync(
      "git log --oneline -50 --name-only --pretty=format: 2>/dev/null | sort | uniq -c | sort -rn | head -20",
      { cwd: root, encoding: "utf-8", timeout: 5000 }
    );
    const dirs = new Set<string>();
    for (const line of output.split("\n")) {
      const match = line.trim().match(/^\d+\s+(.+)/);
      if (match) {
        const parts = match[1].split("/");
        if (parts.length > 1) {
          dirs.add(parts[0] + "/");
        }
      }
    }
    return [...dirs].slice(0, 10);
  } catch {
    return [];
  }
}

function getHeadCommit(root: string): string {
  try {
    return execSync("git rev-parse HEAD 2>/dev/null", {
      cwd: root,
      encoding: "utf-8",
      timeout: 3000,
    }).trim();
  } catch {
    return "";
  }
}

export function getCommitsSince(root: string, sinceCommit: string): number {
  try {
    const output = execSync(
      `git rev-list --count ${sinceCommit}..HEAD 2>/dev/null`,
      { cwd: root, encoding: "utf-8", timeout: 3000 }
    );
    return parseInt(output.trim(), 10) || 0;
  } catch {
    return -1;
  }
}

export function findRepoRoot(dir: string): string | null {
  let current = resolve(dir);
  while (true) {
    try {
      accessSync(join(current, ".git"));
      return current;
    } catch {
      const parent = resolve(current, "..");
      if (parent === current) return null;
      current = parent;
    }
  }
}

export { getHeadCommit };

export async function scanRepo(root: string): Promise<RepoScan> {
  const name = basename(root);

  // Run all language scanners in parallel
  const [nodeResult, pythonResult, rubyResult, goResult, rustResult] =
    await Promise.all([
      scanNode(root),
      scanPython(root),
      scanRuby(root),
      scanGo(root),
      scanRust(root),
    ]);

  const results = [nodeResult, pythonResult, rubyResult, goResult, rustResult].filter(
    (r): r is NonNullable<typeof r> => r !== null
  );

  // Merge results from all detected languages
  const languages = results.flatMap((r) => r.languages);
  const frameworks = results.flatMap((r) => r.frameworks);
  const testRunners = results.flatMap((r) => r.testRunners);
  const buildTools = results.flatMap((r) => r.buildTools);
  const entryPoints = results.flatMap((r) => r.entryPoints);
  const keyDependencies = results.flatMap((r) => r.keyDependencies);
  const devDependencies = results.flatMap((r) => r.devDependencies);

  let scripts: Record<string, string> = {};
  for (const r of results) {
    scripts = { ...scripts, ...r.scripts };
  }

  // Scan directory structure
  const rawStructure = await scanStructure(root);
  const structure = rawStructure.map((entry) => ({
    ...entry,
    description: describeDirectory(entry.path),
  }));

  // Detect CI
  const ci: string[] = [];
  for (const ciFile of CI_FILES) {
    if (await fileExists(join(root, ciFile))) {
      ci.push(ciFile);
    }
  }

  // Detect config files
  const config: string[] = [];
  for (const configFile of CONFIG_FILES) {
    if (await fileExists(join(root, configFile))) {
      config.push(configFile);
    }
  }

  return {
    name,
    root,
    languages: [...new Set(languages)],
    frameworks: [...new Set(frameworks)],
    testRunners: [...new Set(testRunners)],
    buildTools: [...new Set(buildTools)],
    entryPoints: [...new Set(entryPoints)],
    scripts,
    structure,
    ci,
    config,
    keyDependencies: [...new Set(keyDependencies)],
    devDependencies: [...new Set(devDependencies)],
  };
}
