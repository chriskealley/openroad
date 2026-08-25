import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function makeOpenSpec(root: string, config = "schema: spec-driven\ncontext: |\n  Existing project context\n") {
  await mkdir(join(root, "openspec/specs"), { recursive: true });
  await mkdir(join(root, "openspec/changes"), { recursive: true });
  await writeFile(join(root, "openspec/config.yaml"), config);
}
