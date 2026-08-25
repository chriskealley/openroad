export const MANIFEST_NAME = ".openroad.json";

export type Consumer = "codex" | "pi" | "claude" | "cursor";

export interface Manifest {
  schemaVersion: 1;
  packageVersion: string;
  installedAt: string;
  consumers: Consumer[];
  files: string[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  status: "planned" | "ready" | "active" | "done" | "cancelled";
  workState?: "available" | "blocked" | "paused";
  priority: number;
  change?: string;
  dependsOn: string[];
  blockedBy?: string;
}
