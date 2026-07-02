---
tags: [skxnz, skills, obsidian, claude]
---
# Official Obsidian Skills Install Guide

## Installed official Obsidian skills

Installed from: https://github.com/kepano/obsidian-skills

| Skill | What it does |
|---|---|
| obsidian-markdown | Creates and edits Obsidian Flavored Markdown, including wikilinks, embeds, callouts, properties, tags, and Obsidian note syntax. |
| obsidian-bases | Works with Obsidian Bases files and related structured note views. |
| json-canvas | Creates and edits Obsidian JSON Canvas files. |
| obsidian-cli | Helps use Obsidian-related command line workflows. |
| defuddle | Helps extract readable article content using Defuddle-related workflows. |

## Additional community design skills installed

| Skill | Source | What it does |
|---|---|---|
| impeccable | https://github.com/pbakaus/impeccable | Design guidance for AI coding agents, frontend design quality, layout polish, browser/design iteration, and avoiding common AI-generated UI mistakes. |
| taste-skill | https://github.com/Leonxlnx/taste-skill | Improves AI-built interfaces with stronger layout, typography, motion, spacing, reference direction, and anti-slop frontend taste. |

## Claude Code / Codex install location

Installed folders:

- `.claude/skills/obsidian-markdown/`
- `.claude/skills/obsidian-bases/`
- `.claude/skills/json-canvas/`
- `.claude/skills/obsidian-cli/`
- `.claude/skills/defuddle/`
- `.claude/skills/impeccable/`
- `.claude/skills/taste-skill/`

Each installed folder contains its upstream `SKILL.md`. Extra official files and folders were preserved.

## ZIP exports

Obsidian exports for Claude.ai:

- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/obsidian-markdown.zip`
- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/obsidian-bases.zip`
- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/json-canvas.zip`
- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/obsidian-cli.zip`
- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/defuddle.zip`

Design skill exports for Claude.ai:

- `SKXNZ_SKILL_EXPORTS/design-skills-for-claude-ai/impeccable.zip`
- `SKXNZ_SKILL_EXPORTS/design-skills-for-claude-ai/taste-skill.zip`

Each ZIP contains the skill folder at the root, for example `obsidian-markdown/SKILL.md`.

## Upload to normal Claude / Claude.ai

1. Open Claude.ai.
2. Go to Customize.
3. Go to Skills.
4. Click +.
5. Click Create skill.
6. Choose Upload a skill.
7. Upload one ZIP at a time.
8. Toggle the skill on.

## Test prompts after upload

Use one test prompt per skill:

- obsidian-markdown: `Use the obsidian-markdown skill to create an Obsidian note with YAML properties, wikilinks, tags, a callout, and an embedded note link.`
- obsidian-bases: `Use the obsidian-bases skill to draft a simple Obsidian Bases view for tracking project notes by status and owner.`
- json-canvas: `Use the json-canvas skill to create a small Obsidian canvas with three connected nodes for a project workflow.`
- obsidian-cli: `Use the obsidian-cli skill to explain a safe command-line workflow for opening or searching an Obsidian vault.`
- defuddle: `Use the defuddle skill to explain how you would extract clean readable content from a web article for an Obsidian note.`
- impeccable: `Use the impeccable skill to audit a landing page UI for layout, spacing, typography, responsiveness, and generic AI-design mistakes.`
- taste-skill: `Use the design-taste-frontend skill to improve a landing page concept with stronger layout, typography, motion, and anti-slop design direction.`

## Safety note

Only install skills from trusted sources. Review each `SKILL.md` and any included scripts or references before enabling a skill in Claude.ai or any coding agent.
