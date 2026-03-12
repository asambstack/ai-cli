import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { listRepos, getRepoDetail } from "../services/repo-service.js";
import { getLearnings, addLearning, updateLearning, deleteLearning, LEARNING_CATEGORIES, } from "../services/learning-service.js";
import { ReposPage, RepoDetailPage, WorkspacePage, KnowledgeList, LearningEditForm, SyncResult, WorkspaceKnowledgeList, WorkspaceLearningEditForm, } from "../views/repos.js";
const WORKSPACE_ROOT = "/Users/aditya/development";
function repoRoot(name) {
    return join(WORKSPACE_ROOT, name);
}
const app = new Hono();
// Workspace page
app.get("/workspace", async (c) => {
    const repos = await listRepos(WORKSPACE_ROOT);
    const workspaceLearnings = await getLearnings(WORKSPACE_ROOT);
    return c.html(_jsx(WorkspacePage, { workspaceLearnings: workspaceLearnings, repoCount: repos.length }));
});
// Repo list page
app.get("/repos", async (c) => {
    const repos = await listRepos(WORKSPACE_ROOT);
    return c.html(_jsx(ReposPage, { repos: repos }));
});
// Repo detail page (full page)
app.get("/repos/:name", async (c) => {
    const name = c.req.param("name");
    const detail = await getRepoDetail(WORKSPACE_ROOT, name);
    const learnings = await getLearnings(repoRoot(name));
    return c.html(_jsx(RepoDetailPage, { detail: detail, learnings: learnings }));
});
// JSON APIs
app.get("/api/repos", async (c) => {
    const repos = await listRepos(WORKSPACE_ROOT);
    return c.json(repos);
});
app.get("/api/repos/:name", async (c) => {
    const name = c.req.param("name");
    const detail = await getRepoDetail(WORKSPACE_ROOT, name);
    return c.json(detail);
});
/* ── Sync / Init actions ── */
app.post("/api/repos/:name/sync", async (c) => {
    const name = c.req.param("name");
    const root = repoRoot(name);
    try {
        execSync("ai refresh", {
            cwd: root,
            encoding: "utf-8",
            timeout: 30000,
            stdio: ["pipe", "pipe", "pipe"],
        });
        if (c.req.header("HX-Request")) {
            return c.html(_jsx(SyncResult, { success: true, message: `Synced ${name} — context regenerated, symlinks updated.` }));
        }
        return c.json({ ok: true });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (c.req.header("HX-Request")) {
            return c.html(_jsx(SyncResult, { success: false, message: `Sync failed: ${message.slice(0, 200)}` }));
        }
        return c.json({ ok: false, error: message }, 500);
    }
});
app.post("/api/repos/:name/init", async (c) => {
    const name = c.req.param("name");
    const root = repoRoot(name);
    const body = await c.req.parseBody();
    // Collect selected editors from checkboxes
    const rawEditors = body["editors"];
    let editorList;
    if (Array.isArray(rawEditors)) {
        editorList = rawEditors.map(String);
    }
    else if (typeof rawEditors === "string" && rawEditors) {
        editorList = [rawEditors];
    }
    else {
        editorList = [];
    }
    if (editorList.length === 0) {
        if (c.req.header("HX-Request")) {
            return c.html(_jsx(SyncResult, { success: false, message: "No editors selected." }));
        }
        return c.json({ ok: false, error: "No editors selected" }, 400);
    }
    const editorsFlag = editorList.join(",");
    try {
        execSync(`ai init --editors ${editorsFlag}`, {
            cwd: root,
            encoding: "utf-8",
            timeout: 30000,
            stdio: ["pipe", "pipe", "pipe"],
        });
        if (c.req.header("HX-Request")) {
            return c.html(_jsx(SyncResult, { success: true, message: `Initialized ${name} with editors: ${editorList.join(", ")}` }));
        }
        return c.json({ ok: true });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (c.req.header("HX-Request")) {
            return c.html(_jsx(SyncResult, { success: false, message: `Init failed: ${message.slice(0, 200)}` }));
        }
        return c.json({ ok: false, error: message }, 500);
    }
});
/* ── Workspace-level learning CRUD ── */
app.get("/api/workspace/learnings", async (c) => {
    const learnings = await getLearnings(WORKSPACE_ROOT);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(WorkspaceKnowledgeList, { learnings: learnings }));
    }
    return c.json(learnings);
});
app.get("/api/workspace/learnings/:index/edit", async (c) => {
    const index = parseInt(c.req.param("index"), 10);
    const entries = await getLearnings(WORKSPACE_ROOT);
    const entry = entries.find((e) => e.index === index);
    if (!entry)
        return c.text("Not found", 404);
    return c.html(_jsx(WorkspaceLearningEditForm, { entry: entry }));
});
app.post("/api/workspace/learnings", async (c) => {
    const body = await c.req.parseBody();
    const category = body.category;
    const text = body.text?.trim();
    if (!text || !category)
        return c.text("Missing fields", 400);
    const valid = LEARNING_CATEGORIES.find((cat) => cat.value === category);
    if (!valid)
        return c.text("Invalid category", 400);
    await addLearning(WORKSPACE_ROOT, category, text);
    const learnings = await getLearnings(WORKSPACE_ROOT);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(WorkspaceKnowledgeList, { learnings: learnings }));
    }
    return c.json({ ok: true });
});
app.put("/api/workspace/learnings/:index", async (c) => {
    const index = parseInt(c.req.param("index"), 10);
    const body = await c.req.parseBody();
    const text = body.text?.trim();
    if (!text)
        return c.text("Missing text", 400);
    await updateLearning(WORKSPACE_ROOT, index, text);
    const learnings = await getLearnings(WORKSPACE_ROOT);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(WorkspaceKnowledgeList, { learnings: learnings }));
    }
    return c.json({ ok: true });
});
app.delete("/api/workspace/learnings/:index", async (c) => {
    const index = parseInt(c.req.param("index"), 10);
    await deleteLearning(WORKSPACE_ROOT, index);
    const learnings = await getLearnings(WORKSPACE_ROOT);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(WorkspaceKnowledgeList, { learnings: learnings }));
    }
    return c.json({ ok: true });
});
/* ── Repo-level learning CRUD ── */
app.get("/api/repos/:name/learnings", async (c) => {
    const name = c.req.param("name");
    const learnings = await getLearnings(repoRoot(name));
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(KnowledgeList, { learnings: learnings, repoName: name }));
    }
    return c.json(learnings);
});
app.get("/api/repos/:name/learnings/:index/edit", async (c) => {
    const name = c.req.param("name");
    const index = parseInt(c.req.param("index"), 10);
    const entries = await getLearnings(repoRoot(name));
    const entry = entries.find((e) => e.index === index);
    if (!entry)
        return c.text("Not found", 404);
    return c.html(_jsx(LearningEditForm, { entry: entry, repoName: name }));
});
app.post("/api/repos/:name/learnings", async (c) => {
    const name = c.req.param("name");
    const body = await c.req.parseBody();
    const category = body.category;
    const text = body.text?.trim();
    if (!text || !category)
        return c.text("Missing fields", 400);
    const valid = LEARNING_CATEGORIES.find((cat) => cat.value === category);
    if (!valid)
        return c.text("Invalid category", 400);
    const root = repoRoot(name);
    await addLearning(root, category, text);
    const learnings = await getLearnings(root);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(KnowledgeList, { learnings: learnings, repoName: name }));
    }
    return c.json({ ok: true });
});
app.put("/api/repos/:name/learnings/:index", async (c) => {
    const name = c.req.param("name");
    const index = parseInt(c.req.param("index"), 10);
    const body = await c.req.parseBody();
    const text = body.text?.trim();
    if (!text)
        return c.text("Missing text", 400);
    const root = repoRoot(name);
    await updateLearning(root, index, text);
    const learnings = await getLearnings(root);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(KnowledgeList, { learnings: learnings, repoName: name }));
    }
    return c.json({ ok: true });
});
app.delete("/api/repos/:name/learnings/:index", async (c) => {
    const name = c.req.param("name");
    const index = parseInt(c.req.param("index"), 10);
    const root = repoRoot(name);
    await deleteLearning(root, index);
    const learnings = await getLearnings(root);
    if (c.req.header("HX-Request")) {
        return c.html(_jsx(KnowledgeList, { learnings: learnings, repoName: name }));
    }
    return c.json({ ok: true });
});
export default app;
//# sourceMappingURL=repos.js.map