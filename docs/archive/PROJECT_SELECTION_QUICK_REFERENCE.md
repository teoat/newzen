# 🚀 Project Selection - Quick Reference Guide

## For Frontend Developers

### Adding a New Page That Needs Project Context

```tsx
'use client';

import { useProject } from '@/store/useProject';
import { useEffect, useState } from 'react';

export default function MyNewPage() {
  const { activeProjectId } = useProject();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!activeProjectId) return; // Guard clause
    
    // Fetch project-specific data
    fetch(`/api/v1/my-endpoint?project_id=${activeProjectId}`)
      .then(res => res.json())
      .then(setData);
  }, [activeProjectId]); // Re-fetch when project changes

  if (!activeProjectId) {
    return <div>No project selected</div>; // Or loading skeleton
  }

  return <div>Your content here</div>;
}
```

### Key Points

1. **Always** import `useProject` if you need project context
2. **Always** add a guard clause for `!activeProjectId`
3. **Always** include `activeProjectId` in `useEffect` dependency array
4. **Never** auto-select a project (enforced at store level)

---

## For Backend Developers

### Adding an Endpoint That Uses `project_id`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.models import MyModel

router = APIRouter(prefix="/my-module", tags=["My Module"])

@router.get("/data")
async def get_data(
    project_id: str,  # Query parameter
    db: Session = Depends(get_session)
):
    """Fetch project-scoped data"""
    
    # Validate project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Filter by project_id
    results = db.exec(
        select(MyModel)
        .where(MyModel.project_id == project_id)
    ).all()
    
    return results
```

### Key Points

1. **Always** accept `project_id` as parameter
2. **Always** filter queries by `project_id`
3. **Always** validate project exists
4. **Todo:** Add user authorization check (verify user can access this project)

---

## Testing Checklist

Before committing code that uses projects:

- [ ] Does it work with **no project selected**? (gate blocks access)
- [ ] Does it work with **Project A selected**?
- [ ] Can user **switch to Project B** and see updated data?
- [ ] Does data **not leak** between projects?
- [ ] Is **loading state** handled gracefully?
- [ ] Are **error states** (404, 403) handled?

---

## Common Patterns

### Pattern 1: Conditional Rendering Based on Project

```tsx
const { activeProjectId, activeProject } = useProject();

if (!activeProject) {
  return <ProjectRequiredWarning />;
}

return <Content project={activeProject} />;
```

### Pattern 2: Filter Data by Project

```tsx
const filteredData = useMemo(() => {
  return allData.filter(item => item.project_id === activeProjectId);
}, [allData, activeProjectId]);
```

### Pattern 3: API Call with Project Context

```tsx
const fetchProjectData = useCallback(async () => {
  if (!activeProjectId) return;
  
  const response = await fetch(`/api/v1/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: activeProjectId, ...otherPayload })
  });
  
  setData(await response.json());
}, [activeProjectId]);
```

---

## State Management

### useProject Store API

```tsx
const {
  activeProjectId,      // string | null
  activeProject,        // Project | null (full object)
  projects,             // Project[] (all available)
  isLoading,            // boolean
  setActiveProject,     // (id: string) => void
  fetchProjects         // () => Promise<void>
} = useProject();
```

### When to Call What

- `fetchProjects()` - Called automatically by ProjectGate, rarely needed elsewhere
- `setActiveProject(id)` - Called by ProjectGate selector or sidebar dropdown
- Don't mutate `activeProjectId` directly - always use `setActiveProject()`

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│          Root Layout (layout.tsx)       │
│  ┌───────────────────────────────────┐  │
│  │  ProjectGate                      │  │
│  │  ├─ Check: activeProjectId?       │  │
│  │  ├─ No → Show Project Selector    │  │
│  │  └─ Yes → Render Children         │  │
│  │      ┌──────────────────────────┐ │  │
│  │      │  ForensicSidebar         │ │  │
│  │      │  (project dropdown)      │ │  │
│  │      └──────────────────────────┘ │  │
│  │      ┌──────────────────────────┐ │  │
│  │      │  Page Component          │ │  │
│  │      │  useProject() hook       │ │  │
│  │      │  activeProjectId         │ │  │
│  │      └──────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

Backend API Call:
  POST /api/v1/endpoint
  Body: { project_id: "uuid", ... }
         ↓
  Backend validates project exists
         ↓
  Filter DB query by project_id
         ↓
  Return project-scoped data
```

---

## Debugging Tips

### Issue: "No data showing after project selection"

**Check:**

1. Is `activeProjectId` being passed to API call?
2. Is `useEffect` dependency array including `activeProjectId`?
3. Is backend filtering by `project_id`?

### Issue: "Data from previous project still showing"

**Check:**

1. Clear state when project changes:

   ```tsx
   useEffect(() => {
     setData([]); // Clear old data
     if (activeProjectId) {
       fetchNewData();
     }
   }, [activeProjectId]);
   ```

### Issue: "ProjectGate not blocking access"

**Check:**

1. Is component wrapped by `<ProjectGate>` in layout.tsx?
2. Is bypass condition accidentally triggered? (e.g., pathname check)
3. Is Zustand state persisted from previous session?

---

## Quick Commands

### View current project selection state

```javascript
// In browser console:
localStorage.getItem('zenith-project-storage')
```

### Clear project selection (force gate)

```javascript
// In browser console:
localStorage.removeItem('zenith-project-storage')
window.location.reload()
```

### Check if MCP endpoints are working

```bash
curl http://localhost:8200/api/v1/forensic/mcp/search-entities \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "PT Contractor", "threshold": 0.8, "limit": 10}'
```

---

## FAQ

**Q: Can users have access to multiple projects?**  
A: Yes, they can switch via sidebar dropdown. Backend authorization (future) will control which projects they can see.

**Q: What happens if a project is deleted while user has it selected?**  
A: On next API call, backend will return 404. Frontend should handle this and prompt re-selection.

**Q: Can I bypass the gate for admin pages?**  
A: Yes, add pathname check in `ProjectGate.tsx` (e.g., `/admin/*` routes).

**Q: Where should project creation UI live?**  
A: Wire the "New Operation" button in ProjectGate or create `/projects/new` page.

---

**Last Updated:** 2026-01-29  
**Maintained By:** Zenith Platform Team
