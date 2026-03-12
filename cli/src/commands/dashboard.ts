import { resolve } from "node:path";
import { execSync, spawn } from "node:child_process";
import chalk from "chalk";

const DASHBOARD_DIR = resolve(
  process.env.HOME ?? "/Users/aditya",
  ".ai-agents-repo",
  "dashboard"
);

export async function dashboard(): Promise<void> {
  console.log("");
  console.log(`  ${chalk.cyan("Starting AI Dashboard...")}`);

  // Check if dashboard is built
  try {
    const distPath = resolve(DASHBOARD_DIR, "dist", "server.js");
    const { accessSync } = await import("node:fs");
    accessSync(distPath);
  } catch {
    console.log(`  ${chalk.yellow("Building dashboard...")}`);
    try {
      execSync("npm run build", { cwd: DASHBOARD_DIR, stdio: "inherit" });
    } catch {
      console.log(chalk.red("  Failed to build dashboard. Run:"));
      console.log(chalk.dim(`  cd ${DASHBOARD_DIR} && npm install && npm run build`));
      return;
    }
  }

  const child = spawn("node", ["dist/server.js"], {
    cwd: DASHBOARD_DIR,
    stdio: "inherit",
    detached: false,
  });

  // Give server a moment to start, then open browser
  setTimeout(() => {
    try {
      execSync("open http://localhost:3141", { stdio: "ignore" });
    } catch {
      // Non-macOS — just print URL
      console.log(`  ${chalk.green("Open:")} http://localhost:3141`);
    }
  }, 1000);

  // Keep running until Ctrl+C
  process.on("SIGINT", () => {
    child.kill();
    process.exit(0);
  });

  await new Promise(() => {
    // Block forever — server runs until killed
  });
}
