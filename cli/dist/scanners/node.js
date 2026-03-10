import { readFile } from "node:fs/promises";
import { join } from "node:path";
const FRAMEWORK_MAP = {
    express: "Express",
    fastify: "Fastify",
    koa: "Koa",
    hapi: "@hapi/hapi",
    next: "Next.js",
    nuxt: "Nuxt",
    "react-scripts": "Create React App",
    react: "React",
    vue: "Vue",
    svelte: "Svelte",
    "@sveltejs/kit": "SvelteKit",
    angular: "Angular",
    "@angular/core": "Angular",
    nest: "NestJS",
    "@nestjs/core": "NestJS",
    remix: "Remix",
    "@remix-run/node": "Remix",
    astro: "Astro",
    gatsby: "Gatsby",
    electron: "Electron",
    prisma: "Prisma",
    "@prisma/client": "Prisma",
    drizzle: "Drizzle ORM",
    "drizzle-orm": "Drizzle ORM",
    typeorm: "TypeORM",
    sequelize: "Sequelize",
    mongoose: "Mongoose",
    "socket.io": "Socket.IO",
    trpc: "tRPC",
    "@trpc/server": "tRPC",
    graphql: "GraphQL",
    "apollo-server": "Apollo GraphQL",
};
const TEST_RUNNER_MAP = {
    jest: "Jest",
    vitest: "Vitest",
    mocha: "Mocha",
    ava: "Ava",
    tap: "Tap",
    playwright: "Playwright",
    "@playwright/test": "Playwright",
    cypress: "Cypress",
    "testing-library": "Testing Library",
    "@testing-library/react": "Testing Library",
    supertest: "Supertest",
};
const BUILD_TOOL_MAP = {
    typescript: "TypeScript (tsc)",
    esbuild: "esbuild",
    tsup: "tsup",
    vite: "Vite",
    webpack: "Webpack",
    rollup: "Rollup",
    swc: "SWC",
    "@swc/core": "SWC",
    parcel: "Parcel",
    turbo: "Turborepo",
    nx: "Nx",
    lerna: "Lerna",
};
export async function scanNode(root) {
    const pkgPath = join(root, "package.json");
    let raw;
    try {
        raw = await readFile(pkgPath, "utf-8");
    }
    catch {
        return null;
    }
    let pkg;
    try {
        pkg = JSON.parse(raw);
    }
    catch {
        return null;
    }
    const deps = {
        ...pkg.dependencies ?? {},
        ...pkg.devDependencies ?? {},
    };
    const prodDeps = Object.keys(pkg.dependencies ?? {});
    const devDepNames = Object.keys(pkg.devDependencies ?? {});
    const allDepNames = Object.keys(deps);
    // Language detection
    const languages = [];
    const hasTsConfig = allDepNames.includes("typescript");
    if (hasTsConfig) {
        languages.push("TypeScript");
    }
    else {
        languages.push("JavaScript");
    }
    // Framework detection
    const frameworks = [];
    for (const [dep, label] of Object.entries(FRAMEWORK_MAP)) {
        if (allDepNames.includes(dep)) {
            if (!frameworks.includes(label)) {
                frameworks.push(label);
            }
        }
    }
    // Test runner detection
    const testRunners = [];
    for (const [dep, label] of Object.entries(TEST_RUNNER_MAP)) {
        if (allDepNames.includes(dep)) {
            if (!testRunners.includes(label)) {
                testRunners.push(label);
            }
        }
    }
    // Build tool detection
    const buildTools = [];
    for (const [dep, label] of Object.entries(BUILD_TOOL_MAP)) {
        if (allDepNames.includes(dep)) {
            if (!buildTools.includes(label)) {
                buildTools.push(label);
            }
        }
    }
    // Entry points
    const entryPoints = [];
    if (typeof pkg.main === "string") {
        entryPoints.push(pkg.main);
    }
    if (typeof pkg.bin === "string") {
        entryPoints.push(pkg.bin);
    }
    else if (pkg.bin && typeof pkg.bin === "object") {
        entryPoints.push(...Object.values(pkg.bin));
    }
    // Scripts
    const scripts = pkg.scripts ?? {};
    return {
        languages,
        frameworks,
        testRunners,
        buildTools,
        entryPoints,
        scripts,
        keyDependencies: prodDeps.slice(0, 20),
        devDependencies: devDepNames.filter((d) => d in TEST_RUNNER_MAP || d in BUILD_TOOL_MAP),
    };
}
//# sourceMappingURL=node.js.map