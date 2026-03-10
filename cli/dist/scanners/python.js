import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
const FRAMEWORK_MAP = {
    django: "Django",
    flask: "Flask",
    fastapi: "FastAPI",
    starlette: "Starlette",
    tornado: "Tornado",
    aiohttp: "aiohttp",
    sanic: "Sanic",
    sqlalchemy: "SQLAlchemy",
    alembic: "Alembic",
    celery: "Celery",
    pydantic: "Pydantic",
    typer: "Typer",
    click: "Click",
    httpx: "HTTPX",
    "boto3": "AWS SDK (boto3)",
    streamlit: "Streamlit",
    gradio: "Gradio",
    langchain: "LangChain",
    pandas: "Pandas",
    numpy: "NumPy",
    pytorch: "PyTorch",
    torch: "PyTorch",
    tensorflow: "TensorFlow",
    scikit: "scikit-learn",
};
const TEST_RUNNER_MAP = {
    pytest: "pytest",
    unittest: "unittest",
    nose: "nose",
    tox: "tox",
    nox: "nox",
    hypothesis: "Hypothesis",
};
const BUILD_TOOL_MAP = {
    poetry: "Poetry",
    setuptools: "setuptools",
    hatch: "Hatch",
    flit: "Flit",
    pdm: "PDM",
    uv: "uv",
    ruff: "Ruff",
    black: "Black",
    mypy: "mypy",
    pyright: "Pyright",
};
function extractDepsFromRequirements(content) {
    return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"))
        .map((line) => line.split(/[>=<!\[;]/)[0].trim().toLowerCase());
}
function extractDepsFromPyproject(content) {
    const deps = [];
    // Simple TOML parsing for dependencies array
    const depsMatch = content.match(/\[project\]\s[\s\S]*?dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (depsMatch) {
        const items = depsMatch[1].match(/"([^"]+)"/g);
        if (items) {
            for (const item of items) {
                const name = item.replace(/"/g, "").split(/[>=<!\[;]/)[0].trim().toLowerCase();
                deps.push(name);
            }
        }
    }
    // Poetry dependencies
    const poetryMatch = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?:\n\[|$)/);
    if (poetryMatch) {
        const lines = poetryMatch[1].split("\n");
        for (const line of lines) {
            const m = line.match(/^(\w[\w-]*)\s*=/);
            if (m && m[1] !== "python") {
                deps.push(m[1].toLowerCase());
            }
        }
    }
    return deps;
}
async function fileExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
export async function scanPython(root) {
    const allDeps = [];
    let scripts = {};
    let buildTool = "";
    // Check pyproject.toml
    const pyprojectPath = join(root, "pyproject.toml");
    if (await fileExists(pyprojectPath)) {
        const content = await readFile(pyprojectPath, "utf-8");
        allDeps.push(...extractDepsFromPyproject(content));
        if (content.includes("[tool.poetry]"))
            buildTool = "Poetry";
        else if (content.includes("[tool.hatch]"))
            buildTool = "Hatch";
        else if (content.includes("[tool.pdm]"))
            buildTool = "PDM";
        else if (content.includes("[tool.flit]"))
            buildTool = "Flit";
        else if (content.includes("[build-system]"))
            buildTool = "setuptools";
        // Extract scripts
        const scriptsMatch = content.match(/\[(?:project\.scripts|tool\.poetry\.scripts)\]([\s\S]*?)(?:\n\[|$)/);
        if (scriptsMatch) {
            const lines = scriptsMatch[1].split("\n");
            for (const line of lines) {
                const m = line.match(/^(\w[\w-]*)\s*=\s*"([^"]+)"/);
                if (m) {
                    scripts = { ...scripts, [m[1]]: m[2] };
                }
            }
        }
    }
    // Check requirements.txt
    const reqPath = join(root, "requirements.txt");
    if (await fileExists(reqPath)) {
        const content = await readFile(reqPath, "utf-8");
        allDeps.push(...extractDepsFromRequirements(content));
        if (!buildTool)
            buildTool = "pip";
    }
    // Check setup.py
    if (await fileExists(join(root, "setup.py"))) {
        if (!buildTool)
            buildTool = "setuptools";
    }
    if (allDeps.length === 0 && !buildTool) {
        return null;
    }
    const unique = [...new Set(allDeps)];
    const frameworks = [];
    for (const [dep, label] of Object.entries(FRAMEWORK_MAP)) {
        if (unique.some((d) => d.startsWith(dep))) {
            if (!frameworks.includes(label))
                frameworks.push(label);
        }
    }
    const testRunners = [];
    for (const [dep, label] of Object.entries(TEST_RUNNER_MAP)) {
        if (unique.some((d) => d.startsWith(dep))) {
            if (!testRunners.includes(label))
                testRunners.push(label);
        }
    }
    const buildTools = [];
    if (buildTool)
        buildTools.push(buildTool);
    for (const [dep, label] of Object.entries(BUILD_TOOL_MAP)) {
        if (unique.some((d) => d.startsWith(dep)) && !buildTools.includes(label)) {
            buildTools.push(label);
        }
    }
    // Entry points
    const entryPoints = [];
    if (await fileExists(join(root, "manage.py")))
        entryPoints.push("manage.py");
    if (await fileExists(join(root, "app.py")))
        entryPoints.push("app.py");
    if (await fileExists(join(root, "main.py")))
        entryPoints.push("main.py");
    return {
        languages: ["Python"],
        frameworks,
        testRunners,
        buildTools,
        entryPoints,
        scripts,
        keyDependencies: unique.slice(0, 20),
        devDependencies: unique.filter((d) => Object.keys(TEST_RUNNER_MAP).some((t) => d.startsWith(t)) ||
            Object.keys(BUILD_TOOL_MAP).some((t) => d.startsWith(t))),
    };
}
//# sourceMappingURL=python.js.map