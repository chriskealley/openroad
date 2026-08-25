# openspec-roadmap

A companion CLI that connects a project-level roadmap to [OpenSpec](https://openspec.dev/) without forking OpenSpec or modifying its generated skills.

## Install in an OpenSpec project

Initialize OpenSpec first, then run:

```sh
npx openspec-roadmap init --tools codex,pi,claude,cursor
```

If `--tools` is omitted, existing `.codex`, `.pi`, `.claude`, and `.cursor` directories are detected. The installer creates `openspec/roadmap.md`, installs the `openspec-roadmap` and `openspec-next` skills, adds narrowly scoped context/rules/archive guidance to `openspec/config.yaml`, and records managed files in `.openspec-roadmap.json`.

Commands:

```sh
openspec-roadmap init
openspec-roadmap update
openspec-roadmap doctor
openspec-roadmap remove
```

All commands accept `--root <path>`. `init` and `update` accept `--tools <comma-separated-list>`. Updates preserve roadmap content. Removal preserves `openspec/roadmap.md` and removes only this package's exact config guidance and managed skill files.

## Roadmap semantics

Lifecycle statuses are `planned`, `ready`, `active`, `done`, and `cancelled`. Only active items have a work state: `available`, `blocked`, or `paused`. Multiple items may be active simultaneously. `openspec-next` selects the eligible ready item with the lowest numeric priority, after checking dependencies, regardless of other blocked or paused active work.
