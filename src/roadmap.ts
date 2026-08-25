import { readFile } from "node:fs/promises";
import type { RoadmapItem } from "./types.js";

const STATUSES = new Set(["planned", "ready", "active", "done", "cancelled"]);
const WORK_STATES = new Set(["available", "blocked", "paused"]);

export function parseRoadmap(source: string): { items: RoadmapItem[]; errors: string[] } {
  const errors: string[] = [];
  const items: RoadmapItem[] = [];
  const markdown = source.replace(/<!--[\s\S]*?-->/g, "");
  const headings = [...markdown.matchAll(/^###\s+([A-Za-z][A-Za-z0-9_-]*-\d+)\s+[—-]\s+(.+)$/gm)];
  const seen = new Set<string>();

  for (let index = 0; index < headings.length; index++) {
    const match = headings[index];
    const id = match[1];
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = headings[index + 1]?.index ?? markdown.length;
    const body = markdown.slice(bodyStart, bodyEnd);
    const fields = new Map<string, string>();
    for (const field of body.matchAll(/^\*\*([^*]+):\*\*[ \t]*(.*?)[ \t]*$/gm)) {
      fields.set(field[1].trim().toLowerCase(), field[2].trim());
    }
    if (seen.has(id)) errors.push(`${id}: duplicate roadmap id`);
    seen.add(id);
    const status = fields.get("status") ?? "";
    const workState = fields.get("work state") || undefined;
    const priorityText = fields.get("priority") ?? "";
    const priority = Number(priorityText);
    if (!STATUSES.has(status)) errors.push(`${id}: invalid or missing Status`);
    if (!Number.isInteger(priority) || priority < 0) errors.push(`${id}: Priority must be a non-negative integer`);
    if (status === "active" && !WORK_STATES.has(workState ?? "")) {
      errors.push(`${id}: active items require Work state: available, blocked, or paused`);
    }
    if (status !== "active" && workState) errors.push(`${id}: Work state is only valid for active items`);
    if (status === "active" && !fields.get("change")) errors.push(`${id}: active items require Change`);
    items.push({
      id,
      title: match[2].trim(),
      status: (STATUSES.has(status) ? status : "planned") as RoadmapItem["status"],
      workState: WORK_STATES.has(workState ?? "") ? workState as RoadmapItem["workState"] : undefined,
      priority: Number.isInteger(priority) ? priority : 0,
      change: fields.get("change") || undefined,
      dependsOn: (fields.get("depends on") ?? "").split(",").map(v => v.trim()).filter(Boolean),
      blockedBy: fields.get("blocked by") || undefined
    });
  }
  if (headings.length === 0) errors.push("No roadmap items found (expected headings like `### RM-001 — Title`)");
  const ids = new Set(items.map(item => item.id));
  for (const item of items) for (const dependency of item.dependsOn) {
    if (!ids.has(dependency)) errors.push(`${item.id}: unknown dependency ${dependency}`);
    if (dependency === item.id) errors.push(`${item.id}: item cannot depend on itself`);
  }
  return { items, errors };
}

export async function validateRoadmap(path: string) {
  return parseRoadmap(await readFile(path, "utf8"));
}

export function eligibleReadyItems(items: RoadmapItem[]): RoadmapItem[] {
  const byId = new Map(items.map(item => [item.id, item]));
  return items
    .filter(item => item.status === "ready")
    .filter(item => item.dependsOn.every(id => byId.get(id)?.status === "done"))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}
