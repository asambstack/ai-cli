import { readFile, access } from "node:fs/promises";
import { join } from "node:path";

interface GoScanResult {
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
  "github.com/gin-gonic/gin": "Gin",
  "github.com/labstack/echo": "Echo",
  "github.com/gofiber/fiber": "Fiber",
  "github.com/gorilla/mux": "Gorilla Mux",
  "github.com/go-chi/chi": "Chi",
  "google.golang.org/grpc": "gRPC",
  "github.com/graphql-go/graphql": "GraphQL",
  "gorm.io/gorm": "GORM",
  "github.com/jmoiron/sqlx": "sqlx",
  "github.com/jackc/pgx": "pgx",
  "go.uber.org/fx": "Uber Fx",
  "go.uber.org/zap": "Zap",
  "github.com/spf13/cobra": "Cobra CLI",
  "github.com/spf13/viper": "Viper",
  "github.com/nats-io/nats.go": "NATS",
  "github.com/redis/go-redis": "go-redis",
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function scanGo(root: string): Promise<GoScanResult | null> {
  const goModPath = join(root, "go.mod");
  if (!(await fileExists(goModPath))) {
    return null;
  }

  const content = await readFile(goModPath, "utf-8");
  const lines = content.split("\n");

  // Extract module dependencies
  const deps: string[] = [];
  let inRequire = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "require (") {
      inRequire = true;
      continue;
    }
    if (trimmed === ")") {
      inRequire = false;
      continue;
    }
    if (inRequire && trimmed && !trimmed.startsWith("//")) {
      const parts = trimmed.split(/\s+/);
      if (parts[0]) deps.push(parts[0]);
    }
  }

  const frameworks: string[] = [];
  for (const [dep, label] of Object.entries(FRAMEWORK_MAP)) {
    if (deps.some((d) => d.startsWith(dep))) {
      if (!frameworks.includes(label)) frameworks.push(label);
    }
  }

  // Go has built-in testing
  const testRunners: string[] = ["go test"];
  if (deps.some((d) => d.includes("testify"))) testRunners.push("Testify");

  const buildTools: string[] = ["go build"];
  if (await fileExists(join(root, "Makefile"))) buildTools.push("Make");

  // Entry points — look for cmd/ pattern
  const entryPoints: string[] = [];
  if (await fileExists(join(root, "main.go"))) {
    entryPoints.push("main.go");
  }
  if (await fileExists(join(root, "cmd"))) {
    entryPoints.push("cmd/");
  }

  return {
    languages: ["Go"],
    frameworks,
    testRunners,
    buildTools,
    entryPoints,
    scripts: {},
    keyDependencies: deps.slice(0, 20),
    devDependencies: [],
  };
}
