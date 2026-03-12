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

export function DashboardPage({
  repoCount,
  configuredCount,
  learningCount,
}: {
  readonly repoCount: number;
  readonly configuredCount: number;
  readonly learningCount: number;
}) {
  return (
    <Layout title="Dashboard" activePage="dashboard">
      <h1>AI Dashboard</h1>
      <p class="page-summary">
        Visual interface for the <code>ai</code> CLI — manage repo context,
        knowledge, and agent configs.
      </p>

      <div class="meta-cards">
        <div class="meta-card">
          <span class="meta-label">Repositories</span>
          <span class="meta-value">{repoCount}</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Configured</span>
          <span class="meta-value">{configuredCount}</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Learnings</span>
          <span class="meta-value">{learningCount}</span>
        </div>
      </div>

      <div class="section-panel">
        <div class="section-header">
          <h3>CLI Reference</h3>
          <span class="section-badge">ai --help</span>
        </div>
        <div class="section-body">
          <pre>
            <code>{CLI_HELP}</code>
          </pre>
        </div>
      </div>

      <div class="page-footer">
        <span class="footer-text">
          Run <code>ai dashboard</code> from any directory to launch this UI.
        </span>
      </div>
    </Layout>
  );
}
