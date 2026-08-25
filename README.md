# OpenRoad

A companion CLI that connects a project-level roadmap to [OpenSpec](https://openspec.dev/) without forking OpenSpec or modifying its generated skills.

## Requirements

- Node.js 20 or later, with npm and `npx` available.
- An existing project initialized with OpenSpec. The project must contain `openspec/config.yaml`, `openspec/specs/`, and `openspec/changes/`.
- At least one supported agent/tool if you want skills installed automatically: Codex, Pi, Claude, or Cursor.
- Write access to the target project. A global installation may also require permission to write to npm's global package directory.

Initialize OpenSpec in the target project before installing this integration:

```sh
cd path/to/your-project
openspec init
```

## Run with npx

You can run the CLI without installing it globally:

```sh
npx @chriskealley/openroad init --tools codex,pi,claude,cursor
```

To install only for Codex, for example:

```sh
npx @chriskealley/openroad init --tools codex
```

## Install globally

Install the CLI globally if you plan to use it across several OpenSpec projects:

```sh
npm install --global @chriskealley/openroad
```

Then run it from the root of an initialized OpenSpec project:

```sh
openroad init --tools codex,pi,claude,cursor
```

If npm reports a permissions error during global installation, configure an npm-managed user-level global directory or use the `npx` option above; avoid running npm with `sudo`.

## What installation changes

If `--tools` is omitted, the CLI detects existing `.codex`, `.pi`, `.claude`, and `.cursor` directories. It then:

- Creates `openspec/roadmap.md` if it does not already exist.
- Installs the `openroad` and `openroad-next` skills for each selected tool.
- Adds narrowly scoped context, rules, and archive guidance to `openspec/config.yaml`.
- Records managed files in `.openroad.json` so updates and removal are safe.

Existing roadmap content is preserved during updates. Removal preserves `openspec/roadmap.md` and removes only this package's exact configuration guidance and managed skill files.

## Commands

```sh
openroad init
openroad update
openroad doctor
openroad remove
```

All commands accept `--root <path>`; the default is the current directory. `init` and `update` accept `--tools <comma-separated-list>` using any combination of `codex`, `pi`, `claude`, and `cursor`.

## Roadmap semantics

Lifecycle statuses are `planned`, `ready`, `active`, `done`, and `cancelled`. Only active items have a work state: `available`, `blocked`, or `paused`. Multiple items may be active simultaneously. `openroad-next` selects the eligible ready item with the lowest numeric priority, after checking dependencies, regardless of other blocked or paused active work.
