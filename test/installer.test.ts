import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install, readManifest, remove } from "../src/installer.js";
import { ARCHIVE_GUIDANCE, CONTEXT_LINE, PROPOSAL_RULE } from "../src/config.js";
import { makeOpenSpec } from "./helpers.js";

test("installs roadmap, requested skills, manifest, and merges config", async () => {
  const root = await mkdtemp(join(tmpdir(), "openroad-"));
  await makeOpenSpec(root);
  const manifest = await install(root, ["codex", "pi"]);
  const packageJson = JSON.parse(await readFile(join(process.cwd(), "package.json"), "utf8")) as { version: string };
  assert.deepEqual(manifest.consumers, ["codex", "pi"]);
  assert.equal(manifest.packageVersion, packageJson.version);
  await access(join(root, "openspec/roadmap.md"));
  await access(join(root, ".codex/skills/openroad-next/SKILL.md"));
  const config = await readFile(join(root, "openspec/config.yaml"), "utf8");
  assert.match(config, /Existing project context/);
  assert.ok(config.includes(CONTEXT_LINE));
  assert.ok(config.includes(PROPOSAL_RULE));
  assert.ok(config.includes(ARCHIVE_GUIDANCE));
});

test("install and update are idempotent and preserve roadmap edits", async () => {
  const root = await mkdtemp(join(tmpdir(), "openroad-"));
  await makeOpenSpec(root);
  await install(root, ["claude"]);
  const roadmapPath = join(root, "openspec/roadmap.md");
  const edited = (await readFile(roadmapPath, "utf8")) + "\nUser content\n";
  const { writeFile } = await import("node:fs/promises");
  await writeFile(roadmapPath, edited);
  await install(root, ["claude"]);
  assert.equal(await readFile(roadmapPath, "utf8"), edited);
  const config = await readFile(join(root, "openspec/config.yaml"), "utf8");
  assert.equal(config.split(CONTEXT_LINE).length - 1, 1);
  assert.equal(config.split(PROPOSAL_RULE).length - 1, 1);
});

test("remove preserves roadmap and user config", async () => {
  const root = await mkdtemp(join(tmpdir(), "openroad-"));
  await makeOpenSpec(root);
  await install(root, ["cursor"]);
  await remove(root);
  await access(join(root, "openspec/roadmap.md"));
  assert.equal(await readManifest(root), undefined);
  const config = await readFile(join(root, "openspec/config.yaml"), "utf8");
  assert.match(config, /Existing project context/);
  assert.ok(!config.includes(CONTEXT_LINE));
});
