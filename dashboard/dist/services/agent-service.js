import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
const AGENTS_DIR = join(process.env.HOME ?? "/Users/aditya", ".ai-agents-repo", "agents");
const SKILLS_DIR = join(process.env.HOME ?? "/Users/aditya", ".ai-agents-repo", "skills");
const RULES_DIR = join(process.env.HOME ?? "/Users/aditya", ".ai-agents-repo", "claude", "rules");
function parseYamlFrontmatter(content) {
    if (!content.startsWith("---")) {
        return { frontmatter: {}, body: content };
    }
    const endIndex = content.indexOf("\n---", 3);
    if (endIndex === -1) {
        return { frontmatter: {}, body: content };
    }
    const fmBlock = content.slice(4, endIndex);
    const frontmatter = {};
    for (const line of fmBlock.split("\n")) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
            const key = line.slice(0, colonIdx).trim();
            const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
            frontmatter[key] = value;
        }
    }
    const body = content.slice(endIndex + 4).trim();
    return { frontmatter, body };
}
function extractFirstHeading(content) {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : "";
}
function extractDescription(content) {
    const { frontmatter, body } = parseYamlFrontmatter(content);
    if (frontmatter.description)
        return frontmatter.description;
    // Fallback: first non-empty, non-heading line
    for (const line of body.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            return trimmed.slice(0, 120);
        }
    }
    return "";
}
async function listMdFiles(dir) {
    try {
        const files = await readdir(dir);
        const mdFiles = files.filter((f) => f.endsWith(".md")).sort();
        const results = await Promise.all(mdFiles.map(async (filename) => {
            const content = await readFile(join(dir, filename), "utf-8");
            const name = basename(filename, ".md");
            const heading = extractFirstHeading(content);
            const description = extractDescription(content);
            return {
                name,
                filename,
                description: heading || description,
            };
        }));
        return results;
    }
    catch {
        return [];
    }
}
async function getMdFile(dir, name) {
    const filename = name.endsWith(".md") ? name : `${name}.md`;
    try {
        const content = await readFile(join(dir, filename), "utf-8");
        const heading = extractFirstHeading(content);
        const description = extractDescription(content);
        return {
            name: basename(filename, ".md"),
            filename,
            description: heading || description,
            content,
        };
    }
    catch {
        return null;
    }
}
async function updateMdFile(dir, name, content) {
    const filename = name.endsWith(".md") ? name : `${name}.md`;
    await writeFile(join(dir, filename), content, "utf-8");
}
// Agents
export const listAgents = () => listMdFiles(AGENTS_DIR);
export const getAgent = (name) => getMdFile(AGENTS_DIR, name);
export const updateAgent = (name, content) => updateMdFile(AGENTS_DIR, name, content);
// Skills
export const listSkills = () => listMdFiles(SKILLS_DIR);
export const getSkill = (name) => getMdFile(SKILLS_DIR, name);
export const updateSkill = (name, content) => updateMdFile(SKILLS_DIR, name, content);
// Rules
export const listRules = () => listMdFiles(RULES_DIR);
export const getRule = (name) => getMdFile(RULES_DIR, name);
export const updateRule = (name, content) => updateMdFile(RULES_DIR, name, content);
//# sourceMappingURL=agent-service.js.map