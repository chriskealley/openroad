# OpenRoad

A companion CLI that connects a project-level roadmap to [OpenSpec](https://openspec.dev/) without forking OpenSpec or modifying its generated skills.

## Requirements

- Node.js 22 or later, with npm and `npx` available.
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

## Development

The CLI is TypeScript compiled to ES modules. Node.js 22 or later is required to build and test; the repository has one runtime dependency (`yaml`) and no build tooling beyond `tsc`.

```sh
git clone https://github.com/chriskealley/openroad.git
cd openroad
npm install
npm test
```

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile `src/` and `test/` to `dist/` |
| `npm test` | Build, then run the suite with the Node test runner |
| `npm run typecheck` | Type-check without emitting output |

Sources live in [src/](src/); `cli.ts` handles argument parsing, `installer.ts` manages the managed-file lifecycle and `.openroad.json` manifest, `config.ts` merges and removes the OpenSpec `config.yaml` guidance, and `roadmap.ts` parses and validates `roadmap.md`. The roadmap template shipped to new projects is [templates/roadmap.md](templates/roadmap.md), and the agent skills are in [skills/](skills/).

Two behaviours are worth preserving when changing the installer or parser, and both are covered by tests: installing and removing must leave an existing `openspec/config.yaml` byte-identical, and the shipped roadmap template must validate cleanly under `openroad doctor`.

To try a change against a real project, pack the tarball and install it rather than linking, so you exercise the same layout users get:

```sh
npm pack
npm install --global ./chriskealley-openroad-*.tgz
```
