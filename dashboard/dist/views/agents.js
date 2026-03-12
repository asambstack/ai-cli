import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Layout } from "./layout.js";
function TabBar({ activeTab }) {
    return (_jsxs("div", { class: "tabs", children: [_jsx("a", { href: "/agents?tab=agents", class: activeTab === "agents" ? "active" : "", children: "Agents" }), _jsx("a", { href: "/agents?tab=skills", class: activeTab === "skills" ? "active" : "", children: "Skills" }), _jsx("a", { href: "/agents?tab=rules", class: activeTab === "rules" ? "active" : "", children: "Rules" })] }));
}
function FileListPanel({ items, activeTab, selectedName, }) {
    return (_jsx("div", { children: _jsx("ul", { class: "file-list", children: items.map((item) => (_jsxs("li", { class: item.name === selectedName ? "active" : "", "hx-get": `/api/${activeTab}/${item.name}`, "hx-target": "#editor-panel", "hx-swap": "innerHTML", children: [_jsx("strong", { children: item.name }), _jsx("br", {}), _jsx("small", { style: "color: var(--pico-muted-color)", children: item.description.slice(0, 60) })] }))) }) }));
}
export function AgentsPage({ activeTab, items, selectedItem }) {
    return (_jsxs(Layout, { title: "Agents", activePage: "agents", children: [_jsx("h1", { children: "Agent Configuration" }), _jsx(TabBar, { activeTab: activeTab }), _jsxs("div", { class: "two-panel", children: [_jsx(FileListPanel, { items: items, activeTab: activeTab, selectedName: selectedItem?.name ?? null }), _jsx("div", { id: "editor-panel", children: selectedItem ? (_jsx(EditorPartial, { item: selectedItem, tab: activeTab })) : (_jsx("div", { class: "empty-state", children: _jsx("p", { children: "Select a file from the list to edit." }) })) })] })] }));
}
export function EditorPartial({ item, tab, }) {
    return (_jsxs("div", { children: [_jsxs("div", { style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem", children: [_jsx("h3", { style: "margin: 0", children: item.filename }), _jsx("button", { class: "outline", "hx-put": `/api/${tab}/${item.name}`, "hx-target": "#editor-panel", "hx-swap": "innerHTML", "hx-include": "#editor-textarea", id: "save-btn", children: "Save" })] }), _jsx("textarea", { id: "editor-textarea", name: "content", style: "font-family: monospace; font-size: 0.85rem; min-height: 500px; width: 100%; resize: vertical", children: item.content })] }));
}
//# sourceMappingURL=agents.js.map