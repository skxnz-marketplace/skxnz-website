---
tags: [skxnz, dashboard, obsidian]
---
# GRAPH DASHBOARD

Graph health checklist. Run weekly.

## Checklist
- [ ] Every important note has 2–3 wikilinks.
- [ ] Every major folder reachable from [[MASTER_INDEX]].
- [ ] No orphan files (Graph View → look for unconnected dots).
- [ ] Orphans archived or linked.
- [ ] Tags consistent per [[TAG_SYSTEM]].
- [ ] Hubs healthy: [[MASTER_INDEX]], [[MASTER_MAP]], [[MASTER_DASHBOARD]], [[00_START_HERE]].
- [ ] Legacy files tagged `#archived`, clustered separately.

## Find orphans (Dataview — files with no inlinks)
```dataview
list
where length(file.inlinks) = 0 and file.name != "MASTER_INDEX"
sort file.name asc
```

## Untagged files
```dataview
list
where !contains(file.tags, "#skxnz")
sort file.name asc
```

Related: [[GRAPH_RULES]] · [[NOTE_LINKING_RULES]] · [[CANVAS_MAP_PLAN]]
