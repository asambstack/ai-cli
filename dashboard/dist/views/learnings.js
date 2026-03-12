import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Layout } from "./layout.js";
import { LEARNING_CATEGORIES } from "../services/learning-service.js";
function LearningEntryRow({ entry, repo, }) {
    return (_jsxs("div", { class: "learning-entry", id: `learning-${entry.index}`, children: [_jsx("div", { class: "text", children: entry.text }), _jsx("div", { class: "date", children: entry.date }), _jsxs("div", { class: "actions", children: [_jsx("button", { class: "outline secondary", "hx-get": `/api/learnings/${entry.index}/edit?repo=${encodeURIComponent(repo)}`, "hx-target": `#learning-${entry.index}`, "hx-swap": "outerHTML", children: "Edit" }), _jsx("button", { class: "outline secondary", "hx-delete": `/api/learnings/${entry.index}?repo=${encodeURIComponent(repo)}`, "hx-target": "#learnings-list", "hx-swap": "outerHTML", "hx-confirm": "Delete this learning?", children: "Del" })] })] }));
}
function LearningEditForm({ entry, repo, }) {
    return (_jsxs("div", { class: "inline-edit", id: `learning-${entry.index}`, children: [_jsx("input", { type: "text", name: "text", value: entry.text, "hx-put": `/api/learnings/${entry.index}?repo=${encodeURIComponent(repo)}`, "hx-target": "#learnings-list", "hx-swap": "outerHTML", "hx-include": "this", "hx-trigger": "keydown[key=='Enter']" }), _jsx("button", { class: "outline", "hx-put": `/api/learnings/${entry.index}?repo=${encodeURIComponent(repo)}`, "hx-target": "#learnings-list", "hx-swap": "outerHTML", "hx-include": "closest .inline-edit", children: "Save" }), _jsx("button", { class: "outline secondary", "hx-get": `/api/learnings?repo=${encodeURIComponent(repo)}`, "hx-target": "#learnings-list", "hx-swap": "outerHTML", children: "Cancel" })] }));
}
function LearningsListPartial({ entries, repo, }) {
    const grouped = new Map();
    for (const cat of LEARNING_CATEGORIES) {
        grouped.set(cat.value, []);
    }
    for (const entry of entries) {
        const list = grouped.get(entry.category);
        if (list)
            list.push(entry);
    }
    return (_jsx("div", { id: "learnings-list", children: entries.length === 0 ? (_jsx("div", { class: "empty-state", children: _jsx("p", { children: "No learnings yet. Add one above." }) })) : (Array.from(grouped.entries()).map(([category, catEntries]) => catEntries.length > 0 ? (_jsxs("div", { class: "learning-group", children: [_jsx("h3", { children: category }), catEntries.map((entry) => (_jsx(LearningEntryRow, { entry: entry, repo: repo })))] })) : null)) }));
}
export function LearningsPage({ repos, selectedRepo, entries, }) {
    return (_jsxs(Layout, { title: "Knowledge", activePage: "learnings", children: [_jsx("h1", { children: "Knowledge" }), _jsx("div", { class: "repo-selector", children: _jsxs("select", { name: "repo", "hx-get": "/learnings", "hx-target": "main.content", "hx-swap": "innerHTML", "hx-select": "main.content > *", "hx-push-url": "true", children: [_jsx("option", { value: "__workspace__", selected: selectedRepo === "__workspace__", children: "Workspace" }), repos.map((name) => (_jsx("option", { value: name, selected: selectedRepo === name, children: name })))] }) }), _jsxs("form", { class: "add-form", "hx-post": "/api/learnings", "hx-target": "#learnings-list", "hx-swap": "outerHTML", "hx-on--after-request": "if(event.detail.successful) this.reset()", children: [_jsx("input", { type: "hidden", name: "repo", value: selectedRepo }), _jsx("select", { name: "category", required: true, children: LEARNING_CATEGORIES.map((cat) => (_jsx("option", { value: cat.value, children: cat.label }))) }), _jsx("input", { type: "text", name: "text", placeholder: "What did you learn?", required: true }), _jsx("button", { type: "submit", children: "Add" })] }), _jsx(LearningsListPartial, { entries: entries, repo: selectedRepo })] }));
}
export { LearningsListPartial, LearningEditForm };
//# sourceMappingURL=learnings.js.map