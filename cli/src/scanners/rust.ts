import { readFile, access } from "node:fs/promises";
import { join } from "node:path";

interface RustScanResult {
  readonly languages: string[];
  readonly frameworks: string[];
  readonly testRunners: string[];
  readonly buildTools: string[];
  readonly entryPoints: string[];
  readonly scripts: Record<string, string>;
  readonly keyDependencies: string[];
  readonly devDependencies: string[];
}

const FRAMEWORK_MAP: Readonly<Record<string, string>> = {
  actix: "Actix Web",
  "actix-web": "Actix Web",
  axum: "Axum",
  rocket: "Rocket",
  warp: "Warp",
  tonic: "Tonic (gRPC)",
  diesel: "Diesel ORM",
  sqlx: "SQLx",
  sea: "SeaORM",
  "sea-orm": "SeaORM",
  tokio: "Tokio",
  serde: "Serde",
  clap: "Clap CLI",
  tracing: "Tracing",
  tower: "Tower",
  reqwest: "Reqwest",
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function extractCrateDeps(content: string): string[] {
  const deps: string[] = [];

  // Match [dependencies] section
  const sections = content.matchAll(
    /\[(?:dev-)?dependencies\]\s*\n([\s\S]*?)(?=\n\[|$)/g
  );

  for (const section of sections) {
    const lines = section[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^([\w-]+)\s*=/);
      if (match) {
        deps.push(match[1]);
      }
    }
  }

  return deps;
}

export async function scanRust(root: string): Promise<RustScanResult | null> {
  const cargoPath = join(root, "Cargo.toml");
  if (!(await fileExists(cargoPath))) {
    return null;
  }

  const content = await readFile(cargoPath, "utf-8");
  const allDeps = extractCrateDeps(content);

  const frameworks: string[] = [];
  for (const [dep, label] of Object.entries(FRAMEWORK_MAP)) {
    if (allDeps.some((d) => d.startsWith(dep))) {
      if (!frameworks.includes(label)) frameworks.push(label);
    }
  }

  const testRunners: string[] = ["cargo test"];
  const buildTools: string[] = ["Cargo"];

  // Check if workspace
  if (content.includes("[workspace]")) {
    buildTools.push("Workspace");
  }

  const entryPoints: string[] = [];
  if (await fileExists(join(root, "src/main.rs"))) entryPoints.push("src/main.rs");
  if (await fileExists(join(root, "src/lib.rs"))) entryPoints.push("src/lib.rs");

  return {
    languages: ["Rust"],
    frameworks,
    testRunners,
    buildTools,
    entryPoints,
    scripts: {},
    keyDependencies: allDeps.slice(0, 20),
    devDependencies: [],
  };
}
