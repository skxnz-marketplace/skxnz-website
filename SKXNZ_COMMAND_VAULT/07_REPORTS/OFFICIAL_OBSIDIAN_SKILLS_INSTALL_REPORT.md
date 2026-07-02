---
tags: [skxnz, report, skills, obsidian, claude]
---
# Official Obsidian Skills Install Report

## Source repos used

- Official Obsidian skills: https://github.com/kepano/obsidian-skills
- Impeccable: https://github.com/pbakaus/impeccable
- Taste Skill: https://github.com/Leonxlnx/taste-skill

All repositories were fetched over HTTPS.

## Skills installed

- obsidian-markdown
- obsidian-bases
- json-canvas
- obsidian-cli
- defuddle
- impeccable
- taste-skill

## Files copied

Installed to Claude Code / Codex:

- `.claude/skills/obsidian-markdown/`
- `.claude/skills/obsidian-bases/`
- `.claude/skills/json-canvas/`
- `.claude/skills/obsidian-cli/`
- `.claude/skills/defuddle/`
- `.claude/skills/impeccable/`
- `.claude/skills/taste-skill/`

Each folder contains the upstream `SKILL.md`. Extra upstream files/folders were preserved, including Impeccable `reference/` and `scripts/`.

## ZIP exports created

Obsidian skill ZIPs:

- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/obsidian-markdown.zip`
- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/obsidian-bases.zip`
- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/json-canvas.zip`
- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/obsidian-cli.zip`
- `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/defuddle.zip`

Design skill ZIPs:

- `SKXNZ_SKILL_EXPORTS/design-skills-for-claude-ai/impeccable.zip`
- `SKXNZ_SKILL_EXPORTS/design-skills-for-claude-ai/taste-skill.zip`

Every ZIP is structured with the skill folder at the root, for example `obsidian-markdown/SKILL.md`.

## Missing skills

None.

## Errors

- Initial sandboxed HTTPS clone of `kepano/obsidian-skills` failed with a Windows credential/TLS error. It was retried with approved HTTPS git clone access and completed.
- The `impeccable` clone command timed out in the shell output, but the checkout existed and contained valid upstream `SKILL.md` files.
- Two initial PowerShell copy/zip attempts timed out or produced partial ZIP output. The final installed folders and ZIP exports were rebuilt and verified.

## Preservation checks

- SKXNZ custom skill folders were preserved.
- Only the requested official/community skill folders were added or updated under `.claude/skills/`.
- SKXNZ app/source code was not touched by this task.
- `git status` still shows pre-existing app/source changes that were present before this task. The changes made for this task are limited to the allowed `.claude/skills/`, `SKXNZ_COMMAND_VAULT/01_COMMAND_CENTER/`, `SKXNZ_COMMAND_VAULT/04_SKILLS_LIBRARY/`, `SKXNZ_COMMAND_VAULT/07_REPORTS/`, and `SKXNZ_SKILL_EXPORTS/` paths.
- No commit was made.
- No PR was created.

## Exact next manual Claude.ai upload steps

1. Open Claude.ai.
2. Go to Customize.
3. Go to Skills.
4. Click +.
5. Click Create skill.
6. Choose Upload a skill.
7. Upload one ZIP at a time from `SKXNZ_SKILL_EXPORTS/obsidian-skills-for-claude-ai/`.
8. Optional: upload `impeccable.zip` and `taste-skill.zip` from `SKXNZ_SKILL_EXPORTS/design-skills-for-claude-ai/`.
9. Toggle each uploaded skill on.

## Exact next test prompt

`Use the obsidian-markdown skill to create an Obsidian project note with YAML properties, wikilinks, tags, a callout, and an embedded note link. Then use the json-canvas skill to outline the same project as a three-node canvas.`
