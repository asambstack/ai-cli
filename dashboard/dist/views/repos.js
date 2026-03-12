import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { LEARNING_CATEGORIES } from "../services/learning-service.js";
import { Layout } from "./layout.js";
const EDITORS = [
    { id: "claude", name: "Claude Code" },
    { id: "opencode", name: "OpenCode" },
    { id: "cursor", name: "Cursor" },
    { id: "windsurf", name: "Windsurf" },
    { id: "copilot", name: "GitHub Copilot" },
    { id: "cline", name: "Cline" },
    { id: "aider", name: "Aider" },
];
function StalenessCell({ staleness }) {
    if (staleness < 0) {
        return _jsx("span", { class: "badge badge-gray", children: "N/A" });
    }
    if (staleness === 0) {
        return _jsx("span", { class: "badge badge-green", children: "0" });
    }
    if (staleness <= 20) {
        return _jsx("span", { class: "badge badge-yellow", children: staleness });
    }
    return _jsx("span", { class: "badge badge-red", children: staleness });
}
function StatusCell({ hasConfig }) {
    if (hasConfig) {
        return _jsx("span", { class: "status-configured", children: "Active" });
    }
    return _jsx("span", { class: "status-uninit", children: "\u2014" });
}
function LanguageTags({ languages, }) {
    if (languages.length === 0)
        return _jsx("span", { class: "status-uninit", children: "\u2014" });
    return (_jsx("span", { children: languages.map((lang) => (_jsx("span", { class: "lang-tag", children: lang }))) }));
}
function RepoRow({ repo }) {
    return (_jsxs("tr", { onclick: `window.location='/repos/${repo.name}'`, children: [_jsx("td", { children: _jsx("span", { class: "repo-name", children: repo.name }) }), _jsx("td", { children: _jsx(LanguageTags, { languages: repo.languages }) }), _jsx("td", { children: repo.frameworks.join(", ") || "—" }), _jsx("td", { children: repo.lastScan
                    ? new Date(repo.lastScan).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    })
                    : "—" }), _jsx("td", { children: _jsx(StalenessCell, { staleness: repo.staleness }) }), _jsx("td", { children: repo.learningCount > 0 ? repo.learningCount : "—" }), _jsx("td", { children: _jsx(StatusCell, { hasConfig: repo.hasConfig }) })] }));
}
export function ReposPage({ repos, }) {
    const configured = repos.filter((r) => r.hasConfig).length;
    const stale = repos.filter((r) => r.staleness > 20).length;
    return (_jsxs(Layout, { title: "Repos", activePage: "repos", children: [_jsx("h1", { children: "Repositories" }), _jsxs("p", { class: "page-summary", children: [_jsx("span", { class: "count", children: repos.length }), " repos \u00A0\u00B7\u00A0", " ", _jsx("span", { class: "count", children: configured }), " configured \u00A0\u00B7\u00A0", " ", stale > 0 ? (_jsxs("span", { class: "alert", children: [stale, " stale"] })) : ("0 stale")] }), _jsx("div", { class: "table-scroll", children: _jsxs("table", { class: "repo-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Language" }), _jsx("th", { children: "Framework" }), _jsx("th", { children: "Scanned" }), _jsx("th", { children: "Drift" }), _jsx("th", { children: "Knowledge" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: repos.map((repo) => (_jsx(RepoRow, { repo: repo }))) })] }) })] }));
}
/* ── Workspace page ── */
export function WorkspacePage({ workspaceLearnings, repoCount, }) {
    return (_jsxs(Layout, { title: "Workspace", activePage: "workspace", children: [_jsx("h1", { children: "Workspace" }), _jsxs("p", { class: "page-summary", children: [_jsx("span", { class: "count", children: repoCount }), " repositories \u00A0\u00B7\u00A0", " ", _jsx("span", { class: "count", children: workspaceLearnings.length }), " cross-repo learnings"] }), _jsxs("div", { class: "section-panel knowledge-section", children: [_jsxs("div", { class: "section-header", children: [_jsx("h3", { children: "Workspace Knowledge" }), _jsx("span", { class: "section-badge", children: "Cross-repo learnings" })] }), _jsxs("form", { class: "knowledge-add", "hx-post": "/api/workspace/learnings", "hx-target": "#ws-knowledge-list", "hx-swap": "outerHTML", "hx-on--after-request": "if(event.detail.successful) this.reset()", children: [_jsx("select", { name: "category", required: true, children: LEARNING_CATEGORIES.map((cat) => (_jsx("option", { value: cat.value, children: cat.label }))) }), _jsx("input", { type: "text", name: "text", placeholder: "Cross-repo knowledge...", required: true }), _jsx("button", { type: "submit", children: "Add" })] }), _jsx(WorkspaceKnowledgeList, { learnings: workspaceLearnings })] }), _jsx("div", { class: "page-footer", children: _jsxs("span", { class: "footer-text", children: ["Workspace root: ", _jsx("code", { children: "/Users/aditya/development" })] }) })] }));
}
/* ── Workspace knowledge list ── */
export function WorkspaceKnowledgeList({ learnings, }) {
    const grouped = new Map();
    for (const cat of LEARNING_CATEGORIES) {
        grouped.set(cat.value, []);
    }
    for (const entry of learnings) {
        const list = grouped.get(entry.category);
        if (list)
            list.push(entry);
    }
    return (_jsx("div", { id: "ws-knowledge-list", class: "knowledge-entries", children: learnings.length === 0 ? (_jsx("div", { class: "knowledge-empty", children: "No workspace-level learnings yet. Add cross-repo knowledge above." })) : (Array.from(grouped.entries()).map(([category, catEntries]) => catEntries.length > 0 ? (_jsxs("div", { class: "learning-group", children: [_jsx("h3", { children: category }), catEntries.map((entry) => (_jsxs("div", { class: "learning-entry", id: `ws-learning-${entry.index}`, children: [_jsx("div", { class: "text", children: entry.text }), _jsx("div", { class: "date", children: entry.date }), _jsxs("div", { class: "actions", children: [_jsx("button", { "hx-get": `/api/workspace/learnings/${entry.index}/edit`, "hx-target": `#ws-learning-${entry.index}`, "hx-swap": "outerHTML", children: "Edit" }), _jsx("button", { "hx-delete": `/api/workspace/learnings/${entry.index}`, "hx-target": "#ws-knowledge-list", "hx-swap": "outerHTML", "hx-confirm": "Delete this learning?", children: "Del" })] })] })))] })) : null)) }));
}
export function WorkspaceLearningEditForm({ entry, }) {
    return (_jsxs("div", { class: "inline-edit", id: `ws-learning-${entry.index}`, children: [_jsx("input", { type: "text", name: "text", value: entry.text, "hx-put": `/api/workspace/learnings/${entry.index}`, "hx-target": "#ws-knowledge-list", "hx-swap": "outerHTML", "hx-include": "this", "hx-trigger": "keydown[key=='Enter']" }), _jsx("button", { "hx-put": `/api/workspace/learnings/${entry.index}`, "hx-target": "#ws-knowledge-list", "hx-swap": "outerHTML", "hx-include": "closest .inline-edit", children: "Save" }), _jsx("button", { "hx-get": "/api/workspace/learnings", "hx-target": "#ws-knowledge-list", "hx-swap": "outerHTML", children: "Cancel" })] }));
}
/* ── Full repo detail page ── */
export function RepoDetailPage({ detail, learnings, }) {
    const learningCount = learnings.length;
    return (_jsxs(Layout, { title: detail.name, activePage: "repos", children: [_jsx("a", { href: "/repos", class: "back-link", children: "\u2190 All Repositories" }), _jsxs("div", { class: "repo-header", children: [_jsx("h1", { children: detail.name }), _jsxs("div", { class: "repo-actions", children: [_jsx(StalenessCell, { staleness: detail.staleness }), detail.config ? (_jsx("span", { class: "status-configured", children: "Active" })) : (_jsx("span", { class: "status-uninit", children: "Not initialized" })), _jsxs("button", { class: "btn-action btn-primary", "hx-post": `/api/repos/${detail.name}/sync`, "hx-target": "#sync-status", "hx-swap": "innerHTML", children: [_jsx("span", { class: "btn-icon", children: "\u21BB" }), "Sync"] }), _jsxs("button", { class: "btn-action", onclick: "document.getElementById('init-panel').toggleAttribute('hidden')", children: [_jsx("span", { class: "btn-icon", children: "\u2699" }), "Init"] })] })] }), _jsx("div", { id: "sync-status" }), _jsx("div", { id: "init-panel", class: "init-panel", hidden: true, children: _jsxs("form", { class: "init-form", "hx-post": `/api/repos/${detail.name}/init`, "hx-target": "#sync-status", "hx-swap": "innerHTML", "hx-on--after-request": "document.getElementById('init-panel').hidden=true", children: [_jsxs("div", { class: "init-panel-header", children: [_jsx("h3", { children: "Initialize \u2014 Select Editors" }), _jsx("button", { type: "button", class: "btn-action", onclick: "document.getElementById('init-panel').hidden=true", children: "Cancel" })] }), _jsx("div", { class: "editor-grid", children: EDITORS.map((editor) => (_jsxs("label", { class: "editor-option", children: [_jsx("input", { type: "checkbox", name: "editors", value: editor.id, checked: detail.editors.includes(editor.id) }), _jsx("span", { class: "editor-label", children: editor.name }), _jsx("span", { class: "editor-id", children: editor.id })] }))) }), _jsx("div", { class: "init-panel-footer", children: _jsxs("button", { type: "submit", class: "btn-action btn-primary", children: [_jsx("span", { class: "btn-icon", children: "\u2699" }), "Initialize with selected editors"] }) })] }) }), _jsxs("div", { class: "meta-cards", children: [_jsxs("div", { class: "meta-card", children: [_jsx("span", { class: "meta-label", children: "Editors" }), _jsx("span", { class: "meta-value", children: detail.editors.length > 0
                                    ? detail.editors.join(", ")
                                    : _jsx("span", { class: "muted", children: "None" }) })] }), _jsxs("div", { class: "meta-card", children: [_jsx("span", { class: "meta-label", children: "Last Scan" }), _jsx("span", { class: `meta-value ${!detail.config ? "muted" : ""}`, children: detail.config
                                    ? new Date(detail.config.lastScan).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })
                                    : "Never" })] }), _jsxs("div", { class: "meta-card", children: [_jsx("span", { class: "meta-label", children: "Drift" }), _jsx("span", { class: "meta-value", children: detail.staleness >= 0
                                    ? `${detail.staleness} commits behind`
                                    : "Unknown" })] }), _jsxs("div", { class: "meta-card", children: [_jsx("span", { class: "meta-label", children: "Knowledge" }), _jsx("span", { class: "meta-value", children: learningCount > 0 ? `${learningCount} entries` : "None yet" })] })] }), _jsxs("div", { class: "section-panel", children: [_jsxs("div", { class: "section-header", children: [_jsx("h3", { children: "Context" }), detail.contextMd && (_jsx("span", { class: "section-badge", children: ".ai/context.md" }))] }), detail.contextMd ? (_jsx("div", { class: "section-body", children: _jsx("pre", { children: _jsx("code", { children: detail.contextMd }) }) })) : (_jsxs("div", { class: "no-context", children: ["No context file found. Run ", _jsx("code", { children: "ai init" }), " in this repo to generate it."] }))] }), _jsxs("div", { class: "section-panel knowledge-section", children: [_jsxs("div", { class: "section-header", children: [_jsx("h3", { children: "Knowledge" }), _jsx("span", { class: "section-badge", children: ".ai/learnings.md" })] }), _jsxs("form", { class: "knowledge-add", "hx-post": `/api/repos/${detail.name}/learnings`, "hx-target": "#knowledge-list", "hx-swap": "outerHTML", "hx-on--after-request": "if(event.detail.successful) this.reset()", children: [_jsx("select", { name: "category", required: true, children: LEARNING_CATEGORIES.map((cat) => (_jsx("option", { value: cat.value, children: cat.label }))) }), _jsx("input", { type: "text", name: "text", placeholder: "What did you learn about this repo?", required: true }), _jsx("button", { type: "submit", children: "Add" })] }), _jsx(KnowledgeList, { learnings: learnings, repoName: detail.name })] })] }));
}
/* ── Knowledge list partial (for htmx swaps) ── */
export function KnowledgeList({ learnings, repoName, }) {
    const grouped = new Map();
    for (const cat of LEARNING_CATEGORIES) {
        grouped.set(cat.value, []);
    }
    for (const entry of learnings) {
        const list = grouped.get(entry.category);
        if (list)
            list.push(entry);
    }
    return (_jsx("div", { id: "knowledge-list", class: "knowledge-entries", children: learnings.length === 0 ? (_jsx("div", { class: "knowledge-empty", children: "No learnings captured yet. Add one above." })) : (Array.from(grouped.entries()).map(([category, catEntries]) => catEntries.length > 0 ? (_jsxs("div", { class: "learning-group", children: [_jsx("h3", { children: category }), catEntries.map((entry) => (_jsxs("div", { class: "learning-entry", id: `learning-${entry.index}`, children: [_jsx("div", { class: "text", children: entry.text }), _jsx("div", { class: "date", children: entry.date }), _jsxs("div", { class: "actions", children: [_jsx("button", { "hx-get": `/api/repos/${repoName}/learnings/${entry.index}/edit`, "hx-target": `#learning-${entry.index}`, "hx-swap": "outerHTML", children: "Edit" }), _jsx("button", { "hx-delete": `/api/repos/${repoName}/learnings/${entry.index}`, "hx-target": "#knowledge-list", "hx-swap": "outerHTML", "hx-confirm": "Delete this learning?", children: "Del" })] })] })))] })) : null)) }));
}
export function SyncResult({ success, message, }) {
    return (_jsx("div", { class: `sync-result ${success ? "success" : "error"}`, children: message }));
}
export function LearningEditForm({ entry, repoName, }) {
    return (_jsxs("div", { class: "inline-edit", id: `learning-${entry.index}`, children: [_jsx("input", { type: "text", name: "text", value: entry.text, "hx-put": `/api/repos/${repoName}/learnings/${entry.index}`, "hx-target": "#knowledge-list", "hx-swap": "outerHTML", "hx-include": "this", "hx-trigger": "keydown[key=='Enter']" }), _jsx("button", { "hx-put": `/api/repos/${repoName}/learnings/${entry.index}`, "hx-target": "#knowledge-list", "hx-swap": "outerHTML", "hx-include": "closest .inline-edit", children: "Save" }), _jsx("button", { "hx-get": `/api/repos/${repoName}/learnings`, "hx-target": "#knowledge-list", "hx-swap": "outerHTML", children: "Cancel" })] }));
}
//# sourceMappingURL=repos.js.map