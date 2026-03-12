import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import repoRoutes from "./routes/repos.js";
import agentRoutes from "./routes/agents.js";
import { DashboardPage } from "./views/dashboard.js";
import { listRepos } from "./services/repo-service.js";
import { getLearnings } from "./services/learning-service.js";
const WORKSPACE_ROOT = "/Users/aditya/development";
const app = new Hono();
// Static files
app.use("/public/*", serveStatic({ root: "./src/" }));
// Routes
app.route("/", repoRoutes);
app.route("/", agentRoutes);
// Dashboard landing page
app.get("/", async (c) => {
    const repos = await listRepos(WORKSPACE_ROOT);
    const learnings = await getLearnings(WORKSPACE_ROOT);
    const configuredCount = repos.filter((r) => r.hasConfig).length;
    const totalLearnings = learnings.length;
    return c.html(_jsx(DashboardPage, { repoCount: repos.length, configuredCount: configuredCount, learningCount: totalLearnings }));
});
const PORT = parseInt(process.env.PORT ?? "3141", 10);
console.log(`AI Dashboard running at http://localhost:${PORT}`);
serve({
    fetch: app.fetch,
    port: PORT,
});
//# sourceMappingURL=server.js.map