import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, removeConfig } from "./config.js";
import { MANIFEST_NAME, type Consumer, type Manifest } from "./types.js";

const CONSUMER_DIRS: Record<Consumer, string> = {
  codex: ".codex/skills",
  pi: ".pi/skills",
  claude: ".claude/skills",
  cursor: ".cursor/skills"
};

async function exists(path: string) { try { await access(path); return true; } catch { return false; } }

function assetRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return here.endsWith("/dist/src") ? resolve(here, "../..") : resolve(here, "..");
}

async function packageVersion(): Promise<string> {
  const packageJson = JSON.parse(await readFile(join(assetRoot(), "package.json"), "utf8")) as { version?: unknown };
  if (typeof packageJson.version !== "string") throw new Error("Package version is missing from package.json");
  return packageJson.version;
}

export async function detectConsumers(root: string): Promise<Consumer[]> {
  const found: Consumer[] = [];
  for (const [consumer, dir] of Object.entries(CONSUMER_DIRS) as [Consumer, string][]) {
    if (await exists(join(root, dir.split("/")[0]))) found.push(consumer);
  }
  return found;
}

export async function install(root: string, requested?: Consumer[]): Promise<Manifest> {
  const openspec = join(root, "openspec");
  const config = join(openspec, "config.yaml");
  if (!await exists(config) || !await exists(join(openspec, "changes")) || !await exists(join(openspec, "specs"))) {
    throw new Error("OpenSpec is not initialized (expected openspec/config.yaml, specs/, and changes/). Run `openspec init` first.");
  }
  const prior = await readManifest(root);
  const detected = requested ?? await detectConsumers(root);
  const consumers = [...new Set([...(prior?.consumers ?? []), ...detected])];
  const files = new Set<string>(prior?.files ?? []);
  const roadmap = join(openspec, "roadmap.md");
  if (!await exists(roadmap)) {
    await copyFile(join(assetRoot(), "templates/roadmap.md"), roadmap);
  }
  files.add(relative(root, roadmap));
  for (const consumer of consumers) for (const skill of ["openroad", "openroad-next"]) {
    const destination = join(root, CONSUMER_DIRS[consumer], skill, "SKILL.md");
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(assetRoot(), "skills", skill, "SKILL.md"), destination);
    files.add(relative(root, destination));
  }
  await mergeConfig(config);
  const manifest: Manifest = { schemaVersion: 1, packageVersion: await packageVersion(), installedAt: prior?.installedAt ?? new Date().toISOString(), consumers, files: [...files].sort() };
  await writeFile(join(root, MANIFEST_NAME), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

export async function readManifest(root: string): Promise<Manifest | undefined> {
  try { return JSON.parse(await readFile(join(root, MANIFEST_NAME), "utf8")) as Manifest; } catch { return undefined; }
}

export async function remove(root: string): Promise<void> {
  const manifest = await readManifest(root);
  if (!manifest) throw new Error("OpenRoad is not installed (manifest not found)");
  for (const file of manifest.files) if (file !== "openspec/roadmap.md") await rm(join(root, file), { force: true });
  await removeConfig(join(root, "openspec/config.yaml"));
  await rm(join(root, MANIFEST_NAME), { force: true });
}
