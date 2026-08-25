#!/usr/bin/env node
import { resolve, join } from "node:path";
import { install, readManifest, remove } from "./installer.js";
import { validateRoadmap } from "./roadmap.js";
import type { Consumer } from "./types.js";

const VALID_TOOLS = new Set<Consumer>(["codex", "pi", "claude", "cursor"]);

function usage() {
  console.log(`openspec-roadmap <command> [options]\n\nCommands:\n  init      Install roadmap integration\n  update    Refresh managed integration files\n  doctor    Validate installation and roadmap\n  remove    Remove integration (preserves roadmap.md)\n\nOptions:\n  --root <path>       Project root (default: current directory)\n  --tools <list>      Comma-separated: codex,pi,claude,cursor`);
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const command = process.argv[2];
  if (!command || command === "--help" || command === "-h") return usage();
  const root = resolve(option("--root") ?? process.cwd());
  const toolsText = option("--tools");
  const tools = toolsText?.split(",").map(value => value.trim()) as Consumer[] | undefined;
  if (tools?.some(tool => !VALID_TOOLS.has(tool))) throw new Error("Unknown tool in --tools; use codex, pi, claude, or cursor");
  if (command === "init" || command === "update") {
    if (command === "update" && !await readManifest(root)) throw new Error("Not installed; run `openspec-roadmap init` first");
    const manifest = await install(root, tools);
    console.log(`${command === "init" ? "Installed" : "Updated"} openspec-roadmap for ${manifest.consumers.join(", ") || "no detected skill consumers"}.`);
  } else if (command === "doctor") {
    const manifest = await readManifest(root);
    if (!manifest) throw new Error("Manifest is missing; run `openspec-roadmap init`");
    const result = await validateRoadmap(join(root, "openspec/roadmap.md"));
    if (result.errors.length) throw new Error(`Roadmap validation failed:\n- ${result.errors.join("\n- ")}`);
    console.log(`Healthy: ${result.items.length} roadmap item(s), ${manifest.consumers.length} skill consumer(s).`);
  } else if (command === "remove") {
    await remove(root);
    console.log("Removed openspec-roadmap integration. openspec/roadmap.md was preserved.");
  } else throw new Error(`Unknown command: ${command}`);
}

main().catch(error => { console.error(`Error: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
