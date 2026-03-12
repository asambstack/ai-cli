import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
import { join } from "node:path";
import { getLearnings, addLearning, updateLearning, deleteLearning, LEARNING_CATEGORIES, } from "../services/learning-service.js";
import { getWorkspaceConfig } from "../services/repo-service.js";
import { LearningsPage, LearningsListPartial, LearningEditForm, } from "../views/learnings.js";
const WORKSPACE_ROOT = "/Users/aditya/development";
const app = new Hono();
function resolveRepoRoot(repo) {
    if (repo === "__workspace__")
        return WORKSPACE_ROOT;
    return join(WORKSPACE_ROOT, repo);
}
// HTML page
app.get("/learnings", async (c) => {
    const selectedRepo = c.req.query("repo") ?? "__workspace__";
    const wsConfig = await getWorkspaceConfig(WORKSPACE_ROOT);
    const repos = wsConfig?.repos ?? [];
    const root = resolveRepoRoot(selectedRepo);
    const entries = await getLearnings(root);
    return c.html(_jsx(LearningsPage, { repos: repos, selectedRepo: selectedRepo, entries: entries }));
});
// JSON API
app.get("/api/learnings", async (c) => {
    const repo = c.req.query("repo") ?? "__workspace__";
    const root = resolveRepoRoot(repo);
    const entries = await getLearnings(root);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(LearningsListPartial, { entries: entries, repo: repo }));
    }
    return c.json(entries);
});
// Edit form partial
app.get("/api/learnings/:index/edit", async (c) => {
    const index = parseInt(c.req.param("index"), 10);
    const repo = c.req.query("repo") ?? "__workspace__";
    const root = resolveRepoRoot(repo);
    const entries = await getLearnings(root);
    const entry = entries.find((e) => e.index === index);
    if (!entry)
        return c.text("Not found", 404);
    return c.html(_jsx(LearningEditForm, { entry: entry, repo: repo }));
});
// Add learning
app.post("/api/learnings", async (c) => {
    const body = await c.req.parseBody();
    const repo = body.repo ?? "__workspace__";
    const category = body.category;
    const text = body.text?.trim();
    if (!text || !category) {
        return c.text("Missing category or text", 400);
    }
    const validCategory = LEARNING_CATEGORIES.find((cat) => cat.value === category);
    if (!validCategory) {
        return c.text("Invalid category", 400);
    }
    const root = resolveRepoRoot(repo);
    await addLearning(root, category, text);
    const entries = await getLearnings(root);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(LearningsListPartial, { entries: entries, repo: repo }));
    }
    return c.json({ ok: true });
});
// Update learning
app.put("/api/learnings/:index", async (c) => {
    const index = parseInt(c.req.param("index"), 10);
    const repo = c.req.query("repo") ?? "__workspace__";
    const body = await c.req.parseBody();
    const text = body.text?.trim();
    if (!text)
        return c.text("Missing text", 400);
    const root = resolveRepoRoot(repo);
    await updateLearning(root, index, text);
    const entries = await getLearnings(root);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(LearningsListPartial, { entries: entries, repo: repo }));
    }
    return c.json({ ok: true });
});
// Delete learning
app.delete("/api/learnings/:index", async (c) => {
    const index = parseInt(c.req.param("index"), 10);
    const repo = c.req.query("repo") ?? "__workspace__";
    const root = resolveRepoRoot(repo);
    await deleteLearning(root, index);
    const entries = await getLearnings(root);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(LearningsListPartial, { entries: entries, repo: repo }));
    }
    return c.json({ ok: true });
});
export default app;
//# sourceMappingURL=learnings.js.map