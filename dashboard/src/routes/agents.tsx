import { Hono } from "hono";
import {
  listAgents,
  listSkills,
  listRules,
  getAgent,
  getSkill,
  getRule,
  updateAgent,
  updateSkill,
  updateRule,
} from "../services/agent-service.js";
import { AgentsPage, EditorPartial } from "../views/agents.js";

const app = new Hono();

type TabType = "agents" | "skills" | "rules";

const listFns: Record<TabType, typeof listAgents> = {
  agents: listAgents,
  skills: listSkills,
  rules: listRules,
};

const getFns: Record<TabType, typeof getAgent> = {
  agents: getAgent,
  skills: getSkill,
  rules: getRule,
};

const updateFns: Record<TabType, typeof updateAgent> = {
  agents: updateAgent,
  skills: updateSkill,
  rules: updateRule,
};

// HTML page
app.get("/agents", async (c) => {
  const tab = (c.req.query("tab") as TabType) ?? "agents";
  const validTab: TabType = ["agents", "skills", "rules"].includes(tab)
    ? tab
    : "agents";

  const items = await listFns[validTab]();
  const selected = c.req.query("name");
  const selectedItem = selected ? await getFns[validTab](selected) : null;

  return c.html(
    <AgentsPage activeTab={validTab} items={items} selectedItem={selectedItem} />
  );
});

// Get file content (HTML partial or JSON)
for (const tab of ["agents", "skills", "rules"] as const) {
  app.get(`/api/${tab}`, async (c) => {
    const items = await listFns[tab]();
    return c.json(items);
  });

  app.get(`/api/${tab}/:name`, async (c) => {
    const name = c.req.param("name");
    const item = await getFns[tab](name);

    if (!item) return c.text("Not found", 404);

    if (c.req.header("HX-Request")) {
      return c.html(<EditorPartial item={item} tab={tab} />);
    }

    return c.json(item);
  });

  app.put(`/api/${tab}/:name`, async (c) => {
    const name = c.req.param("name");
    const body = await c.req.parseBody();
    const content = body.content as string;

    if (!content) return c.text("Missing content", 400);

    await updateFns[tab](name, content);
    const item = await getFns[tab](name);

    if (!item) return c.text("Not found", 404);

    if (c.req.header("HX-Request")) {
      return c.html(<EditorPartial item={item} tab={tab} />);
    }

    return c.json({ ok: true });
  });
}

export default app;
