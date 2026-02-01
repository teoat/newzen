# V3 Migration Guide

This guide will help you migrate your existing code to use V3 features.

---

## TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Testing Migration](#testing-migration)
3. [Store Migration](#store-migration)
4. [WebSocket Migration](#websocket-migration)
5. [Service Migration](#service-migration)
6. [Validation Migration](#validation-migration)
7. [Breaking Changes](#breaking-changes)
8. [Troubleshooting](#troubleshooting)

---

## QUICK START

### 1. Install Dependencies

```bash
cd /Users/Arief/Newzen/zenith-lite/frontend
npm install
```

### 2. Run Tests

```bash
# Verify tests work
npm run test

# View test UI
npm run test:ui

# Check coverage
npm run test:coverage
```

### 3. Setup Pre-commit Hooks

```bash
# Install husky
npm run prepare

# Test pre-commit hook
git add .
git commit -m "test: pre-commit hooks"
```

---

## TESTING MIGRATION

### Before V3
```typescript
// No tests existed
// Code changes could break things without warning
```

### After V3
```typescript
// Write tests for new features
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## STORE MIGRATION

### Before V3

```typescript
import { useHubStore } from '@/store/useHubStore';

export default function MyComponent() {
  const {
    activeTab,
    selectedEntity,
    focusMode,
    setActiveTab,
    selectEntity,
    toggleFocusMode,
  } = useHubStore();

  return (
    <div>
      <p>Tab: {activeTab}</p>
      <p>Entity: {selectedEntity}</p>
      <p>Focus: {focusMode ? 'On' : 'Off'}</p>
      <button onClick={() => setActiveTab('analytics')}>Analytics</button>
      <button onClick={() => selectEntity('entity-1')}>Select Entity</button>
      <button onClick={toggleFocusMode}>Toggle Focus</button>
    </div>
  );
}
```

### After V3

```typescript
import {
  useHubNavigation,
  useHubSelection,
  useHubFocus,
} from '@/store/hub';

export default function MyComponent() {
  // Import from focused stores
  const navigation = useHubNavigation();
  const selection = useHubSelection();
  const focus = useHubFocus();

  return (
    <div>
      <p>Tab: {navigation.activeTab}</p>
      <p>Entity: {selection.selectedEntity}</p>
      <p>Focus: {focus.focusMode ? 'On' : 'Off'}</p>

      {/* Actions from appropriate store */}
      <button onClick={() => navigation.setActiveTab('analytics')}>
        Analytics
      </button>
      <button onClick={() => selection.selectEntity('entity-1')}>
        Select Entity
      </button>
      <button onClick={focus.toggleFocusMode}>
        Toggle Focus
      </button>
    </div>
  );
}
```

### Migration Benefits

| Before | After | Benefit |
|--------|-------|---------|
| One large store | 3 focused stores | Better separation of concerns |
| 15+ properties | 5-7 per store | Easier to understand |
| All re-renders on any change | Selective re-renders | Better performance |
| Difficult to test | Easy to test | Better testability |

### Store API Reference

#### useHubNavigation
```typescript
const navigation = useHubNavigation();

// State
navigation.activeTab;           // Current tab
navigation.tabHistory;          // Navigation history
navigation.secondaryTab;        // Secondary tab (optional)

// Actions
navigation.setActiveTab(tab);                    // Set active tab
navigation.setSecondaryTab(tab);                 // Set secondary tab
navigation.navigateToTab(tab);                   // Navigate to tab
navigation.goBack();                              // Go back in history
navigation.clearHistory();                          // Clear history
```

#### useHubFocus
```typescript
const focus = useHubFocus();

// State
focus.focusMode;            // Focus mode enabled?
focus.comparisonMode;       // Comparison mode enabled?
focus.focusedEntity;        // Currently focused entity
focus.focusedTransaction;   // Currently focused transaction

// Actions
focus.toggleFocusMode();                // Toggle focus mode
focus.setFocusMode(enabled);            // Set focus mode
focus.toggleComparisonMode();           // Toggle comparison mode
focus.setComparisonMode(enabled);       // Set comparison mode
focus.setFocusedEntity(id);             // Set focused entity
focus.setFocusedTransaction(id);        // Set focused transaction
focus.clearFocus();                      // Clear all focus
```

#### useHubSelection
```typescript
const selection = useHubSelection();

// State
selection.selectedEntity;       // Selected entity
selection.selectedMilestone;    // Selected milestone
selection.selectedHotspot;      // Selected hotspot
selection.selectedTransaction;   // Selected transaction
selection.evidenceFlags;        // Evidence flag Set

// Actions
selection.selectEntity(id);              // Select entity
selection.selectMilestone(id);           // Select milestone
selection.selectHotspot(id);             // Select hotspot
selection.selectTransaction(id);          // Select transaction
selection.toggleEvidenceFlag(id);         // Toggle evidence flag
selection.clearSelection();               // Clear all selections
selection.clearEvidenceFlags();           // Clear evidence flags
```

---

## WEBSOCKET MIGRATION

### Before V3

```typescript
import { useWebSocketUpdates } from '@/hooks/useWebSocketUpdates';

export default function Dashboard() {
  const { stats, alerts, isConnected } = useWebSocketUpdates('project-1');

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Risk: {stats?.risk_index}</p>
      <p>Alerts: {alerts.length}</p>
    </div>
  );
}
```

### After V3

```typescript
import { useWebSocketUpdates } from '@/hooks/useWebSocketUpdates.v2';

export default function Dashboard() {
  // Import from v2 (API is the same, race conditions fixed)
  const { stats, alerts, isConnected, connectionStatus, error } =
    useWebSocketUpdates('project-1');

  return (
    <div>
      <p>Status: {connectionStatus}</p>
      <p>Risk: {stats?.risk_index}</p>
      <p>Alerts: {alerts.length}</p>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Migration Steps

1. Update import path
```typescript
// Before
import { useWebSocketUpdates } from '@/hooks/useWebSocketUpdates';

// After
import { useWebSocketUpdates } from '@/hooks/useWebSocketUpdates.v2';
```

2. Update component if needed (API is mostly the same)
3. Test the component

### Improvements in V2

| Feature | Before | After |
|---------|--------|-------|
| Race Conditions | ❌ Yes | ✅ Fixed |
| Message Versioning | ❌ No | ✅ Yes |
| Message Queuing | ❌ No | ✅ Yes |
| Polling Interval | 30s | 5s |
| Retry Logic | Linear | Exponential |
| Optimistic Updates | ❌ No | ✅ Yes |

---

## SERVICE MIGRATION

### Before V3

```typescript
import { ProjectService } from '@/services/ProjectService';

export async function createProject(data: any) {
  // No validation
  const project = await ProjectService.createProject(data);
  return project;
}
```

### After V3

```typescript
import { ProjectService } from '@/services/ProjectService.v2';
import { CreateProjectSchema } from '@/schemas';

export async function createProject(data: any) {
  // Validation is automatic in the service
  const project = await ProjectService.createProject(data);
  return project;
}
```

### With Client-Side Validation

```typescript
import { ProjectService } from '@/services/ProjectService.v2';
import {
  CreateProjectSchema,
  validate,
  type CreateProject,
} from '@/schemas';

export async function createProject(data: any) {
  // Client-side validation before API call
  const validatedInput = validate(CreateProjectSchema, data);

  // Service validates again on response
  const project = await ProjectService.createProject(validatedInput);
  return project;
}
```

### Error Handling

```typescript
import { ProjectService } from '@/services/ProjectService.v2';
import { ValidationError } from '@/utils/validation';

try {
  const project = await ProjectService.createProject(data);
  return { success: true, data: project };
} catch (error) {
  if (error instanceof ValidationError) {
    // Validation error
    return {
      success: false,
      errors: error.errors,
      formattedErrors: error.getFormattedErrors(),
    };
  }

  // Other errors
  return { success: false, error: error.message };
}
```

---

## VALIDATION MIGRATION

### Using Zod Schemas

```typescript
import {
  ProjectSchema,
  CreateProjectSchema,
  validate,
  safeValidate,
} from '@/schemas';

// Validate with error throwing
try {
  const project = validate(ProjectSchema, apiResponse.data);
  console.log('Project:', project);
} catch (error) {
  console.error('Validation failed:', error);
}

// Validate without error throwing
const result = safeValidate(CreateProjectSchema, formData);

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.log('Errors:', result.errors);
}
```

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form';
import { createFormValidator, CreateProjectSchema } from '@/schemas';

export default function ProjectForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: createFormValidator(CreateProjectSchema),
  });

  const onSubmit = async (data: any) => {
    // Data is already validated
    const project = await ProjectService.createProject(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <p>{errors.name.message}</p>}

      <input {...register('description')} />
      {errors.description && <p>{errors.description.message}</p>}

      <input type="number" {...register('contract_value')} />
      {errors.contract_value && <p>{errors.contract_value.message}</p>}

      <button type="submit">Create Project</button>
    </form>
  );
}
```

### File Upload Validation

```typescript
import {
  UploadEvidenceSchema,
  validate,
  type UploadEvidence,
} from '@/schemas';

export async function uploadEvidence(file: File, type: string) {
  const input = {
    investigation_id: 'inv-1',
    file,
    type,
    description: 'Evidence file',
  };

  // Validate file size and type
  const validated = validate(UploadEvidenceSchema, input);

  // Upload validated file
  const result = await EvidenceService.upload(validated);
  return result;
}
```

---

## BREAKING CHANGES

### 1. Store API

**Breaking Change:** `useHubStore` is replaced with 3 focused stores

**Migration:**
```typescript
// Before
import { useHubStore } from '@/store/useHubStore';

// After
import {
  useHubNavigation,
  useHubSelection,
  useHubFocus,
} from '@/store/hub';
```

### 2. Pre-commit Hooks

**Breaking Change:** Git commits will now run linters and formatters

**Migration:** No action needed, hooks are automatic

### 3. Middleware

**Breaking Change:** All protected routes now require authentication

**Migration:** Ensure `/login` route is public

### 4. WebSocket Behavior

**Breaking Change:** Messages now use versioning

**Migration:** No action needed, API is the same

---

## TROUBLESHOOTING

### Issue: Tests fail

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install

# Run tests in verbose mode
npm run test -- --reporter=verbose
```

### Issue: Pre-commit hook blocks commit

```bash
# Skip hook (not recommended)
git commit --no-verify -m "commit message"

# Fix issues manually
npm run lint:fix
npm run format
git add .
git commit -m "commit message"
```

### Issue: Store not working

```bash
# Clear localStorage
localStorage.clear();

# Reload page
```

### Issue: WebSocket not connecting

```bash
# Check WebSocket URL
echo $NEXT_PUBLIC_WS_URL

# Check console for errors
# Open browser DevTools → Console
```

### Issue: Validation errors

```bash
# Check schema
import { CreateProjectSchema } from '@/schemas';
console.log(CreateProjectSchema.shape);
```

---

## SUPPORT

### Documentation
- Full implementation: `V3_IMPLEMENTATION.md`
- System diagnostic: `SYSTEM_DIAGNOSTIC.md`
- Lighthouse report: `LIGHTHOUSE_REPORT.md`

### Getting Help
- Check existing issues in GitHub
- Create new issue with:
  - Description
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Environment details

---

**Migration complete! Welcome to V3.** 🚀
