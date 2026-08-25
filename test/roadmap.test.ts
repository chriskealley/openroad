import test from "node:test";
import assert from "node:assert/strict";
import { eligibleReadyItems, parseRoadmap } from "../src/roadmap.js";

test("validates separate lifecycle and work state", () => {
  const valid = parseRoadmap(`### RM-001 — Active\n\n**Status:** active\n**Work state:** blocked\n**Priority:** 1\n**Change:** active-one\n**Depends on:**\n`);
  assert.deepEqual(valid.errors, []);
  const invalid = parseRoadmap(`### RM-001 — Ready\n\n**Status:** ready\n**Work state:** available\n**Priority:** 1\n`);
  assert.match(invalid.errors.join("\n"), /only valid for active/);
});

test("selects highest-priority eligible ready item amid concurrent active work", () => {
  const { items, errors } = parseRoadmap(`
### RM-001 — Done dependency
**Status:** done
**Priority:** 1

### RM-002 — Blocked active
**Status:** active
**Work state:** blocked
**Priority:** 2
**Change:** blocked-change

### RM-003 — Eligible later priority
**Status:** ready
**Priority:** 20
**Depends on:** RM-001

### RM-004 — Eligible first priority
**Status:** ready
**Priority:** 10
**Depends on:** RM-001

### RM-005 — Dependency not done
**Status:** ready
**Priority:** 5
**Depends on:** RM-002
`);
  assert.deepEqual(errors, []);
  assert.deepEqual(eligibleReadyItems(items).map(item => item.id), ["RM-004", "RM-003"]);
});

test("an empty field does not absorb the prose that follows it", () => {
  const { items, errors } = parseRoadmap(`### RM-001 — Empty trailing field

**Status:** planned
**Priority:** 100
**Depends on:**

Describe the outcome, scope, and acceptance signal here.
`);
  assert.deepEqual(errors, []);
  assert.deepEqual(items[0].dependsOn, []);
});

test("commented-out examples are not parsed as roadmap items", () => {
  const { items, errors } = parseRoadmap(`### RM-001 — Real item

**Status:** planned
**Priority:** 100

<!-- Active example:
### RM-002 — Example active outcome

**Status:** active
**Work state:** available
**Priority:** 200
**Change:** add-example-outcome
**Depends on:** RM-001
**Blocked by:**
-->
`);
  assert.deepEqual(errors, []);
  assert.deepEqual(items.map(item => item.id), ["RM-001"]);
});

test("the shipped roadmap template validates cleanly", async () => {
  const { validateRoadmap } = await import("../src/roadmap.js");
  const { join } = await import("node:path");
  const { errors, items } = await validateRoadmap(join(process.cwd(), "templates/roadmap.md"));
  assert.deepEqual(errors, []);
  assert.deepEqual(items.map(item => item.id), ["RM-001"]);
});
