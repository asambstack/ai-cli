import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface NodeScanResult {
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

const TEST_RUNNER_MAP: Readonly<Record<string, string>> = {
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

const BUILD_TOOL_MAP: Readonly<Record<string, string>> = {
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

export async function scanNode(root: string): Promise<NodeScanResult | null> {
  const pkgPath = join(root, "package.json");
  let raw: string;
  try {
    raw = await readFile(pkgPath, "utf-8");
  } catch {
    return null;
  }

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }

  const deps = {
    ...(pkg.dependencies as Record<string, string> | undefined) ?? {},
    ...(pkg.devDependencies as Record<string, string> | undefined) ?? {},
  };

  const prodDeps = Object.keys(
    (pkg.dependencies as Record<string, string> | undefined) ?? {}
  );

  const devDepNames = Object.keys(
    (pkg.devDependencies as Record<string, string> | undefined) ?? {}
  );

  const allDepNames = Object.keys(deps);

  // Language detection
  const languages: string[] = [];
  const hasTsConfig = allDepNames.includes("typescript");
  if (hasTsConfig) {
    languages.push("TypeScript");
  } else {
    languages.push("JavaScript");
  }

  // Framework detection
  const frameworks: string[] = [];
  for (const [dep, label] of Object.entries(FRAMEWORK_MAP)) {
    if (allDepNames.includes(dep)) {
      if (!frameworks.includes(label)) {
        frameworks.push(label);
      }
    }
  }

  // Test runner detection
  const testRunners: string[] = [];
  for (const [dep, label] of Object.entries(TEST_RUNNER_MAP)) {
    if (allDepNames.includes(dep)) {
      if (!testRunners.includes(label)) {
        testRunners.push(label);
      }
    }
  }

  // Build tool detection
  const buildTools: string[] = [];
  for (const [dep, label] of Object.entries(BUILD_TOOL_MAP)) {
    if (allDepNames.includes(dep)) {
      if (!buildTools.includes(label)) {
        buildTools.push(label);
      }
    }
  }

  // Entry points
  const entryPoints: string[] = [];
  if (typeof pkg.main === "string") {
    entryPoints.push(pkg.main);
  }
  if (typeof pkg.bin === "string") {
    entryPoints.push(pkg.bin);
  } else if (pkg.bin && typeof pkg.bin === "object") {
    entryPoints.push(...Object.values(pkg.bin as Record<string, string>));
  }

  // Scripts
  const scripts = (pkg.scripts as Record<string, string> | undefined) ?? {};

  return {
    languages,
    frameworks,
    testRunners,
    buildTools,
    entryPoints,
    scripts,
    keyDependencies: prodDeps.slice(0, 20),
    devDependencies: devDepNames.filter(
      (d) => d in TEST_RUNNER_MAP || d in BUILD_TOOL_MAP
    ),
  };
}
