import { readFile, access } from "node:fs/promises";
import { join } from "node:path";

interface RubyScanResult {
  readonly languages: string[];
  readonly frameworks: string[];
  readonly testRunners: string[];
  readonly buildTools: string[];
  readonly entryPoints: string[];
  readonly scripts: Record<string, string>;
  readonly keyDependencies: string[];
  readonly devDependencies: string[];
}

const FRAMEWORK_MAP: Readonly<Record<string, string>> = {
  rails: "Ruby on Rails",
  sinatra: "Sinatra",
  hanami: "Hanami",
  grape: "Grape",
  roda: "Roda",
  padrino: "Padrino",
  sidekiq: "Sidekiq",
  "active_record": "ActiveRecord",
  sequel: "Sequel",
  rom: "ROM",
  dry: "dry-rb",
  sorbet: "Sorbet",
};

const TEST_RUNNER_MAP: Readonly<Record<string, string>> = {
  rspec: "RSpec",
  minitest: "Minitest",
  cucumber: "Cucumber",
  capybara: "Capybara",
  factory_bot: "FactoryBot",
  faker: "Faker",
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function extractGems(content: string): string[] {
  const gems: string[] = [];
  const matches = content.matchAll(/gem\s+['"]([^'"]+)['"]/g);
  for (const match of matches) {
    gems.push(match[1].toLowerCase());
  }
  return gems;
}

export async function scanRuby(root: string): Promise<RubyScanResult | null> {
  const gemfilePath = join(root, "Gemfile");
  if (!(await fileExists(gemfilePath))) {
    return null;
  }

  const content = await readFile(gemfilePath, "utf-8");
  const allGems = extractGems(content);

  if (allGems.length === 0) return null;

  const frameworks: string[] = [];
  for (const [gem, label] of Object.entries(FRAMEWORK_MAP)) {
    if (allGems.some((g) => g.includes(gem))) {
      if (!frameworks.includes(label)) frameworks.push(label);
    }
  }

  const testRunners: string[] = [];
  for (const [gem, label] of Object.entries(TEST_RUNNER_MAP)) {
    if (allGems.some((g) => g.includes(gem))) {
      if (!testRunners.includes(label)) testRunners.push(label);
    }
  }

  const buildTools: string[] = ["Bundler"];

  const entryPoints: string[] = [];
  if (await fileExists(join(root, "config.ru"))) entryPoints.push("config.ru");
  if (await fileExists(join(root, "Rakefile"))) entryPoints.push("Rakefile");
  if (await fileExists(join(root, "bin/rails"))) entryPoints.push("bin/rails");

  return {
    languages: ["Ruby"],
    frameworks,
    testRunners,
    buildTools,
    entryPoints,
    scripts: {},
    keyDependencies: allGems.slice(0, 20),
    devDependencies: allGems.filter((g) =>
      Object.keys(TEST_RUNNER_MAP).some((t) => g.includes(t))
    ),
  };
}
