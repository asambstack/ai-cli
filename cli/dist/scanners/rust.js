import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
const FRAMEWORK_MAP = {
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
async function fileExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
function extractCrateDeps(content) {
    const deps = [];
    // Match [dependencies] section
    const sections = content.matchAll(/\[(?:dev-)?dependencies\]\s*\n([\s\S]*?)(?=\n\[|$)/g);
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
export async function scanRust(root) {
    const cargoPath = join(root, "Cargo.toml");
    if (!(await fileExists(cargoPath))) {
        return null;
    }
    const content = await readFile(cargoPath, "utf-8");
    const allDeps = extractCrateDeps(content);
    const frameworks = [];
    for (const [dep, label] of Object.entries(FRAMEWORK_MAP)) {
        if (allDeps.some((d) => d.startsWith(dep))) {
            if (!frameworks.includes(label))
                frameworks.push(label);
        }
    }
    const testRunners = ["cargo test"];
    const buildTools = ["Cargo"];
    // Check if workspace
    if (content.includes("[workspace]")) {
        buildTools.push("Workspace");
    }
    const entryPoints = [];
    if (await fileExists(join(root, "src/main.rs")))
        entryPoints.push("src/main.rs");
    if (await fileExists(join(root, "src/lib.rs")))
        entryPoints.push("src/lib.rs");
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
//# sourceMappingURL=rust.js.map