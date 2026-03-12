import type { RepoSummary, RepoDetail } from "../services/repo-service.js";
import type { LearningEntry } from "../services/learning-service.js";
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
] as const;

function StalenessCell({ staleness }: { readonly staleness: number }) {
  if (staleness < 0) {
    return <span class="badge badge-gray">N/A</span>;
  }
  if (staleness === 0) {
    return <span class="badge badge-green">0</span>;
  }
  if (staleness <= 20) {
    return <span class="badge badge-yellow">{staleness}</span>;
  }
  return <span class="badge badge-red">{staleness}</span>;
}

function StatusCell({ hasConfig }: { readonly hasConfig: boolean }) {
  if (hasConfig) {
    return <span class="status-configured">Active</span>;
  }
  return <span class="status-uninit">—</span>;
}

function LanguageTags({
  languages,
}: {
  readonly languages: readonly string[];
}) {
  if (languages.length === 0) return <span class="status-uninit">—</span>;
  return (
    <span>
      {languages.map((lang) => (
        <span class="lang-tag">{lang}</span>
      ))}
    </span>
  );
}

function RepoRow({ repo }: { readonly repo: RepoSummary }) {
  return (
    <tr onclick={`window.location='/repos/${repo.name}'`}>
      <td>
        <span class="repo-name">{repo.name}</span>
      </td>
      <td>
        <LanguageTags languages={repo.languages} />
      </td>
      <td>{repo.frameworks.join(", ") || "—"}</td>
      <td>
        {repo.lastScan
          ? new Date(repo.lastScan).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "—"}
      </td>
      <td>
        <StalenessCell staleness={repo.staleness} />
      </td>
      <td>{repo.learningCount > 0 ? repo.learningCount : "—"}</td>
      <td>
        <StatusCell hasConfig={repo.hasConfig} />
      </td>
    </tr>
  );
}

export function ReposPage({
  repos,
}: {
  readonly repos: readonly RepoSummary[];
}) {
  const configured = repos.filter((r) => r.hasConfig).length;
  const stale = repos.filter((r) => r.staleness > 20).length;

  return (
    <Layout title="Repos" activePage="repos">
      <h1>Repositories</h1>
      <p class="page-summary">
        <span class="count">{repos.length}</span> repos &nbsp;&middot;&nbsp;{" "}
        <span class="count">{configured}</span> configured &nbsp;&middot;&nbsp;{" "}
        {stale > 0 ? (
          <span class="alert">{stale} stale</span>
        ) : (
          "0 stale"
        )}
      </p>

      <div class="table-scroll">
        <table class="repo-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Language</th>
              <th>Framework</th>
              <th>Scanned</th>
              <th>Drift</th>
              <th>Knowledge</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo) => (
              <RepoRow repo={repo} />
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

/* ── Workspace page ── */

export function WorkspacePage({
  workspaceLearnings,
  repoCount,
}: {
  readonly workspaceLearnings: readonly LearningEntry[];
  readonly repoCount: number;
}) {
  return (
    <Layout title="Workspace" activePage="workspace">
      <h1>Workspace</h1>
      <p class="page-summary">
        <span class="count">{repoCount}</span> repositories
        &nbsp;&middot;&nbsp;{" "}
        <span class="count">{workspaceLearnings.length}</span> cross-repo
        learnings
      </p>

      <div class="section-panel knowledge-section">
        <div class="section-header">
          <h3>Workspace Knowledge</h3>
          <span class="section-badge">Cross-repo learnings</span>
        </div>

        <form
          class="knowledge-add"
          hx-post="/api/workspace/learnings"
          hx-target="#ws-knowledge-list"
          hx-swap="outerHTML"
          hx-on--after-request="if(event.detail.successful) this.reset()"
        >
          <select name="category" required>
            {LEARNING_CATEGORIES.map((cat) => (
              <option value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <input
            type="text"
            name="text"
            placeholder="Cross-repo knowledge..."
            required
          />
          <button type="submit">Add</button>
        </form>

        <WorkspaceKnowledgeList learnings={workspaceLearnings} />
      </div>

      <div class="page-footer">
        <span class="footer-text">
          Workspace root: <code>/Users/aditya/development</code>
        </span>
      </div>
    </Layout>
  );
}

/* ── Workspace knowledge list ── */

export function WorkspaceKnowledgeList({
  learnings,
}: {
  readonly learnings: readonly LearningEntry[];
}) {
  const grouped = new Map<string, LearningEntry[]>();
  for (const cat of LEARNING_CATEGORIES) {
    grouped.set(cat.value, []);
  }
  for (const entry of learnings) {
    const list = grouped.get(entry.category);
    if (list) list.push(entry);
  }

  return (
    <div id="ws-knowledge-list" class="knowledge-entries">
      {learnings.length === 0 ? (
        <div class="knowledge-empty">
          No workspace-level learnings yet. Add cross-repo knowledge above.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, catEntries]) =>
          catEntries.length > 0 ? (
            <div class="learning-group">
              <h3>{category}</h3>
              {catEntries.map((entry) => (
                <div class="learning-entry" id={`ws-learning-${entry.index}`}>
                  <div class="text">{entry.text}</div>
                  <div class="date">{entry.date}</div>
                  <div class="actions">
                    <button
                      hx-get={`/api/workspace/learnings/${entry.index}/edit`}
                      hx-target={`#ws-learning-${entry.index}`}
                      hx-swap="outerHTML"
                    >
                      Edit
                    </button>
                    <button
                      hx-delete={`/api/workspace/learnings/${entry.index}`}
                      hx-target="#ws-knowledge-list"
                      hx-swap="outerHTML"
                      hx-confirm="Delete this learning?"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null
        )
      )}
    </div>
  );
}

export function WorkspaceLearningEditForm({
  entry,
}: {
  readonly entry: LearningEntry;
}) {
  return (
    <div class="inline-edit" id={`ws-learning-${entry.index}`}>
      <input
        type="text"
        name="text"
        value={entry.text}
        hx-put={`/api/workspace/learnings/${entry.index}`}
        hx-target="#ws-knowledge-list"
        hx-swap="outerHTML"
        hx-include="this"
        hx-trigger="keydown[key=='Enter']"
      />
      <button
        hx-put={`/api/workspace/learnings/${entry.index}`}
        hx-target="#ws-knowledge-list"
        hx-swap="outerHTML"
        hx-include="closest .inline-edit"
      >
        Save
      </button>
      <button
        hx-get="/api/workspace/learnings"
        hx-target="#ws-knowledge-list"
        hx-swap="outerHTML"
      >
        Cancel
      </button>
    </div>
  );
}

/* ── Full repo detail page ── */

export function RepoDetailPage({
  detail,
  learnings,
}: {
  readonly detail: RepoDetail;
  readonly learnings: readonly LearningEntry[];
}) {
  const learningCount = learnings.length;

  return (
    <Layout title={detail.name} activePage="repos">
      <a href="/repos" class="back-link">
        &#8592; All Repositories
      </a>

      <div class="repo-header">
        <h1>{detail.name}</h1>
        <div class="repo-actions">
          <StalenessCell staleness={detail.staleness} />
          {detail.config ? (
            <span class="status-configured">Active</span>
          ) : (
            <span class="status-uninit">Not initialized</span>
          )}
          <button
            class="btn-action btn-primary"
            hx-post={`/api/repos/${detail.name}/sync`}
            hx-target="#sync-status"
            hx-swap="innerHTML"
          >
            <span class="btn-icon">&#8635;</span>
            Sync
          </button>
          <button
            class="btn-action"
            onclick="document.getElementById('init-panel').toggleAttribute('hidden')"
          >
            <span class="btn-icon">&#9881;</span>
            Init
          </button>
        </div>
      </div>

      <div id="sync-status"></div>

      {/* Init panel — editor selection */}
      <div id="init-panel" class="init-panel" hidden>
        <form
          class="init-form"
          hx-post={`/api/repos/${detail.name}/init`}
          hx-target="#sync-status"
          hx-swap="innerHTML"
          hx-on--after-request="document.getElementById('init-panel').hidden=true"
        >
          <div class="init-panel-header">
            <h3>Initialize — Select Editors</h3>
            <button
              type="button"
              class="btn-action"
              onclick="document.getElementById('init-panel').hidden=true"
            >
              Cancel
            </button>
          </div>
          <div class="editor-grid">
            {EDITORS.map((editor) => (
              <label class="editor-option">
                <input
                  type="checkbox"
                  name="editors"
                  value={editor.id}
                  checked={detail.editors.includes(editor.id)}
                />
                <span class="editor-label">{editor.name}</span>
                <span class="editor-id">{editor.id}</span>
              </label>
            ))}
          </div>
          <div class="init-panel-footer">
            <button type="submit" class="btn-action btn-primary">
              <span class="btn-icon">&#9881;</span>
              Initialize with selected editors
            </button>
          </div>
        </form>
      </div>

      {/* Metadata cards */}
      <div class="meta-cards">
        <div class="meta-card">
          <span class="meta-label">Editors</span>
          <span class="meta-value">
            {detail.editors.length > 0
              ? detail.editors.join(", ")
              : <span class="muted">None</span>}
          </span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Last Scan</span>
          <span class={`meta-value ${!detail.config ? "muted" : ""}`}>
            {detail.config
              ? new Date(detail.config.lastScan).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Never"}
          </span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Drift</span>
          <span class="meta-value">
            {detail.staleness >= 0
              ? `${detail.staleness} commits behind`
              : "Unknown"}
          </span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Knowledge</span>
          <span class="meta-value">
            {learningCount > 0 ? `${learningCount} entries` : "None yet"}
          </span>
        </div>
      </div>

      {/* Context section */}
      <div class="section-panel">
        <div class="section-header">
          <h3>Context</h3>
          {detail.contextMd && (
            <span class="section-badge">.ai/context.md</span>
          )}
        </div>
        {detail.contextMd ? (
          <div class="section-body">
            <pre><code>{detail.contextMd}</code></pre>
          </div>
        ) : (
          <div class="no-context">
            No context file found. Run <code>ai init</code> in this repo to generate it.
          </div>
        )}
      </div>

      {/* Knowledge section — integrated */}
      <div class="section-panel knowledge-section">
        <div class="section-header">
          <h3>Knowledge</h3>
          <span class="section-badge">.ai/learnings.md</span>
        </div>

        <form
          class="knowledge-add"
          hx-post={`/api/repos/${detail.name}/learnings`}
          hx-target="#knowledge-list"
          hx-swap="outerHTML"
          hx-on--after-request="if(event.detail.successful) this.reset()"
        >
          <select name="category" required>
            {LEARNING_CATEGORIES.map((cat) => (
              <option value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <input
            type="text"
            name="text"
            placeholder="What did you learn about this repo?"
            required
          />
          <button type="submit">Add</button>
        </form>

        <KnowledgeList learnings={learnings} repoName={detail.name} />
      </div>
    </Layout>
  );
}

/* ── Knowledge list partial (for htmx swaps) ── */

export function KnowledgeList({
  learnings,
  repoName,
}: {
  readonly learnings: readonly LearningEntry[];
  readonly repoName: string;
}) {
  const grouped = new Map<string, LearningEntry[]>();
  for (const cat of LEARNING_CATEGORIES) {
    grouped.set(cat.value, []);
  }
  for (const entry of learnings) {
    const list = grouped.get(entry.category);
    if (list) list.push(entry);
  }

  return (
    <div id="knowledge-list" class="knowledge-entries">
      {learnings.length === 0 ? (
        <div class="knowledge-empty">
          No learnings captured yet. Add one above.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, catEntries]) =>
          catEntries.length > 0 ? (
            <div class="learning-group">
              <h3>{category}</h3>
              {catEntries.map((entry) => (
                <div class="learning-entry" id={`learning-${entry.index}`}>
                  <div class="text">{entry.text}</div>
                  <div class="date">{entry.date}</div>
                  <div class="actions">
                    <button
                      hx-get={`/api/repos/${repoName}/learnings/${entry.index}/edit`}
                      hx-target={`#learning-${entry.index}`}
                      hx-swap="outerHTML"
                    >
                      Edit
                    </button>
                    <button
                      hx-delete={`/api/repos/${repoName}/learnings/${entry.index}`}
                      hx-target="#knowledge-list"
                      hx-swap="outerHTML"
                      hx-confirm="Delete this learning?"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null
        )
      )}
    </div>
  );
}

export function SyncResult({
  success,
  message,
}: {
  readonly success: boolean;
  readonly message: string;
}) {
  return (
    <div class={`sync-result ${success ? "success" : "error"}`}>
      {message}
    </div>
  );
}

export function LearningEditForm({
  entry,
  repoName,
}: {
  readonly entry: LearningEntry;
  readonly repoName: string;
}) {
  return (
    <div class="inline-edit" id={`learning-${entry.index}`}>
      <input
        type="text"
        name="text"
        value={entry.text}
        hx-put={`/api/repos/${repoName}/learnings/${entry.index}`}
        hx-target="#knowledge-list"
        hx-swap="outerHTML"
        hx-include="this"
        hx-trigger="keydown[key=='Enter']"
      />
      <button
        hx-put={`/api/repos/${repoName}/learnings/${entry.index}`}
        hx-target="#knowledge-list"
        hx-swap="outerHTML"
        hx-include="closest .inline-edit"
      >
        Save
      </button>
      <button
        hx-get={`/api/repos/${repoName}/learnings`}
        hx-target="#knowledge-list"
        hx-swap="outerHTML"
      >
        Cancel
      </button>
    </div>
  );
}
