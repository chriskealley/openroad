export const MANIFEST_NAME = ".openspec-roadmap.json";
export const PACKAGE_VERSION = "0.1.0";

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
