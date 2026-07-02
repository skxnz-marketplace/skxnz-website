---
tags: [skxnz, dashboard, obsidian]
---
# 📊 DATAVIEW DASHBOARD

Powered by **Dataview** plugin. Auto-lists files by tag. (Needs Dataview enabled + reading view.)

## Files tagged #skxnz
```dataview
list
from #skxnz
sort file.name asc
```

## Agents (#agent)
```dataview
list
from #agent
sort file.name asc
```

## Skills (#skill)
```dataview
list
from #skill
sort file.name asc
```

## Animation (#animation)
```dataview
list
from #animation
sort file.name asc
```

## Reports (#daily-report)
```dataview
list
from #daily-report
sort file.mtime desc
```

## Recently modified
```dataview
table file.mtime as "Modified"
from #skxnz
sort file.mtime desc
limit 15
```

Related: [[MASTER_DASHBOARD]] · [[TASKS_DASHBOARD]] · [[GRAPH_DASHBOARD]]
