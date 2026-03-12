import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Layout } from "./layout.js";
const CLI_HELP = `ai — repo context manager for AI code editors

Repo commands (run inside a git repo):
  ai init                          Scan repo, pick editors, generate context
  ai init --all                    Configure all editors (non-interactive)
  ai init --editors claude,cursor   Configure specific editors
  ai learn "<text>"                 Add knowledge (interactive category)
  ai learn -c architecture "<text>" Add to specific category
  ai refresh                       Re-scan and regenerate context
  ai status                        Show current setup and staleness

Workspace commands (run from parent directory with multiple repos):
  ai init --workspace              Scan all sub-repos, generate workspace context
  ai learn --workspace "<text>"     Add cross-repo knowledge
  ai refresh --workspace           Re-scan all sub-repos
  ai status --workspace            Show workspace overview

Categories for learn:
  architecture    system design, patterns, data flow
  conventions     naming, style, file organization
  gotchas         known issues, quirks, workarounds
  integrations    external services, APIs
  domain          business logic, key concepts

Other commands:
  ai dashboard                     Open visual dashboard in browser`;
export function DashboardPage({ repoCount, configuredCount, learningCount, }) {
    return (_jsxs(Layout, { title: "Dashboard", activePage: "dashboard", children: [_jsx("h1", { children: "AI Dashboard" }), _jsxs("p", { class: "page-summary", children: ["Visual interface for the ", _jsx("code", { children: "ai" }), " CLI \u2014 manage repo context, knowledge, and agent configs."] }), _jsxs("div", { class: "meta-cards", children: [_jsxs("div", { class: "meta-card", children: [_jsx("span", { class: "meta-label", children: "Repositories" }), _jsx("span", { class: "meta-value", children: repoCount })] }), _jsxs("div", { class: "meta-card", children: [_jsx("span", { class: "meta-label", children: "Configured" }), _jsx("span", { class: "meta-value", children: configuredCount })] }), _jsxs("div", { class: "meta-card", children: [_jsx("span", { class: "meta-label", children: "Learnings" }), _jsx("span", { class: "meta-value", children: learningCount })] })] }), _jsxs("div", { class: "section-panel", children: [_jsxs("div", { class: "section-header", children: [_jsx("h3", { children: "CLI Reference" }), _jsx("span", { class: "section-badge", children: "ai --help" })] }), _jsx("div", { class: "section-body", children: _jsx("pre", { children: _jsx("code", { children: CLI_HELP }) }) })] }), _jsx("div", { class: "page-footer", children: _jsxs("span", { class: "footer-text", children: ["Run ", _jsx("code", { children: "ai dashboard" }), " from any directory to launch this UI."] }) })] }));
}
//# sourceMappingURL=dashboard.js.map