import { readFile, writeFile } from "node:fs/promises";
import { parseDocument, YAMLMap, YAMLSeq, Scalar } from "yaml";

export const CONTEXT_LINE = "Roadmap coordination: read openspec/roadmap.md before proposing, applying, or archiving changes. Multiple changes may be active concurrently; lifecycle Status and active Work state are separate.";
export const PROPOSAL_RULE = "Link the proposal to exactly one roadmap item and record the OpenSpec change name on that item when work becomes active.";
export const TASKS_RULE = "Respect roadmap dependencies and blocked or paused work states; do not treat another active change as preventing concurrent work.";
export const ARCHIVE_GUIDANCE = "After a successful archive, mark the linked roadmap item done and clear its active Work state; do not change unrelated roadmap items.";

function sequence(doc: ReturnType<typeof parseDocument>, values: string[]) {
  const seq = new YAMLSeq();
  seq.items = values.map(value => new Scalar(value));
  return seq;
}

function addUnique(doc: ReturnType<typeof parseDocument>, path: string[], value: string) {
  const current = doc.getIn(path, true);
  if (current instanceof YAMLSeq) {
    if (!current.items.some(item => String((item as Scalar).value) === value)) current.add(value);
  } else if (current == null) doc.setIn(path, sequence(doc, [value]));
  else throw new Error(`Cannot merge config: ${path.join(".")} must be a sequence`);
}

export async function mergeConfig(path: string): Promise<void> {
  const source = await readFile(path, "utf8");
  const doc = parseDocument(source);
  if (doc.errors.length) throw new Error(`Invalid YAML in ${path}: ${doc.errors[0].message}`);
  if (!(doc.contents instanceof YAMLMap)) throw new Error(`Invalid YAML in ${path}: root must be a mapping`);
  const context = doc.get("context");
  if (context == null) doc.set("context", CONTEXT_LINE);
  else if (typeof context === "string" && !context.includes(CONTEXT_LINE)) doc.set("context", `${context.trimEnd()}\n${CONTEXT_LINE}`);
  else if (typeof context !== "string") throw new Error("Cannot merge config: context must be a string");
  addUnique(doc, ["rules", "proposal"], PROPOSAL_RULE);
  addUnique(doc, ["rules", "tasks"], TASKS_RULE);
  addUnique(doc, ["operations", "archive", "guidance"], ARCHIVE_GUIDANCE);
  await writeFile(path, doc.toString({ lineWidth: 0 }), "utf8");
}

function removeFromSequence(doc: ReturnType<typeof parseDocument>, path: string[], value: string) {
  const current = doc.getIn(path, true);
  if (current instanceof YAMLSeq) current.items = current.items.filter(item => String((item as Scalar).value) !== value);
}

export async function removeConfig(path: string): Promise<void> {
  const doc = parseDocument(await readFile(path, "utf8"));
  const context = doc.get("context");
  if (typeof context === "string") doc.set("context", context.split("\n").filter(line => line.trim() !== CONTEXT_LINE).join("\n").trimEnd());
  removeFromSequence(doc, ["rules", "proposal"], PROPOSAL_RULE);
  removeFromSequence(doc, ["rules", "tasks"], TASKS_RULE);
  removeFromSequence(doc, ["operations", "archive", "guidance"], ARCHIVE_GUIDANCE);
  await writeFile(path, doc.toString({ lineWidth: 0 }), "utf8");
}
