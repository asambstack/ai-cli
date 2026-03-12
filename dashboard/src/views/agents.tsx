import { Layout } from "./layout.js";
import type { AgentSummary, AgentFile } from "../services/agent-service.js";

interface AgentsPageProps {
  readonly activeTab: "agents" | "skills" | "rules";
  readonly items: readonly AgentSummary[];
  readonly selectedItem: AgentFile | null;
}

function TabBar({ activeTab }: { readonly activeTab: string }) {
  return (
    <div class="tabs">
      <a
        href="/agents?tab=agents"
        class={activeTab === "agents" ? "active" : ""}
      >
        Agents
      </a>
      <a
        href="/agents?tab=skills"
        class={activeTab === "skills" ? "active" : ""}
      >
        Skills
      </a>
      <a
        href="/agents?tab=rules"
        class={activeTab === "rules" ? "active" : ""}
      >
        Rules
      </a>
    </div>
  );
}

function FileListPanel({
  items,
  activeTab,
  selectedName,
}: {
  readonly items: readonly AgentSummary[];
  readonly activeTab: string;
  readonly selectedName: string | null;
}) {
  return (
    <div>
      <ul class="file-list">
        {items.map((item) => (
          <li
            class={item.name === selectedName ? "active" : ""}
            hx-get={`/api/${activeTab}/${item.name}`}
            hx-target="#editor-panel"
            hx-swap="innerHTML"
          >
            <strong>{item.name}</strong>
            <br />
            <small style="color: var(--pico-muted-color)">
              {item.description.slice(0, 60)}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AgentsPage({ activeTab, items, selectedItem }: AgentsPageProps) {
  return (
    <Layout title="Agents" activePage="agents">
      <h1>Agent Configuration</h1>

      <TabBar activeTab={activeTab} />

      <div class="two-panel">
        <FileListPanel
          items={items}
          activeTab={activeTab}
          selectedName={selectedItem?.name ?? null}
        />

        <div id="editor-panel">
          {selectedItem ? (
            <EditorPartial item={selectedItem} tab={activeTab} />
          ) : (
            <div class="empty-state">
              <p>Select a file from the list to edit.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function EditorPartial({
  item,
  tab,
}: {
  readonly item: AgentFile;
  readonly tab: string;
}) {
  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem">
        <h3 style="margin: 0">{item.filename}</h3>
        <button
          class="outline"
          hx-put={`/api/${tab}/${item.name}`}
          hx-target="#editor-panel"
          hx-swap="innerHTML"
          hx-include="#editor-textarea"
          id="save-btn"
        >
          Save
        </button>
      </div>
      <textarea
        id="editor-textarea"
        name="content"
        style="font-family: monospace; font-size: 0.85rem; min-height: 500px; width: 100%; resize: vertical"
      >
        {item.content}
      </textarea>
    </div>
  );
}
