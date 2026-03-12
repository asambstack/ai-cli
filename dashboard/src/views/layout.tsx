import type { Child } from "hono/jsx";

interface LayoutProps {
  readonly title: string;
  readonly activePage: string;
  readonly children: Child;
}

export function Layout({ title, activePage, children }: LayoutProps) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} — AI Dashboard</title>
        <link rel="stylesheet" href="/public/pico.min.css" />
        <link rel="stylesheet" href="/public/style.css" />
        <script src="/public/htmx.min.js"></script>
      </head>
      <body>
        <nav class="sidebar">
          <div class="sidebar-header">
            <h2>
              <span>AI</span> Dashboard
            </h2>
          </div>
          <ul>
            <li>
              <a href="/" class={activePage === "dashboard" ? "active" : ""}>
                <svg class="nav-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="1" y="1" width="6" height="6" rx="1" />
                  <rect x="9" y="1" width="6" height="6" rx="1" />
                  <rect x="1" y="9" width="6" height="6" rx="1" />
                  <rect x="9" y="9" width="6" height="6" rx="1" />
                </svg>
                Dashboard
              </a>
            </li>
            <li class="nav-section-label">Workspaces</li>
            <li>
              <a
                href="/workspace"
                class={activePage === "workspace" ? "active" : ""}
              >
                <svg class="nav-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M2 4h12M2 8h12M2 12h12" />
                </svg>
                development
              </a>
            </li>
            <li>
              <a
                href="/repos"
                class={`nav-child ${activePage === "repos" ? "active" : ""}`}
              >
                Repositories
              </a>
            </li>
            <li class="nav-divider" />
            <li>
              <a
                href="/agents"
                class={activePage === "agents" ? "active" : ""}
              >
                <svg class="nav-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="8" cy="5" r="3" />
                  <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
                </svg>
                Agents
              </a>
            </li>
          </ul>
          <div class="sidebar-footer">localhost:3141</div>
        </nav>
        <main class="content">{children}</main>
      </body>
    </html>
  );
}
