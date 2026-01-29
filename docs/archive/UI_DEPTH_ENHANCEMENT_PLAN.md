# UI Depth Enhancement Plan

## Objective

Add visual depth to the frontend by **incrementing contrast** between component layouts and their contents, creating a clear visual hierarchy that guides user attention.

## Design Principles

### 1. **Layered Depth System**

- **Layer 0 (Background):** `rgb(8, 10, 15)` - Base canvas
- **Layer 1 (Containers):** `rgb(15, 18, 25)` - Main panels
- **Layer 2 (Cards):** `rgb(22, 26, 35)` - Content cards
- **Layer 3 (Elevated):** `rgb(28, 32, 42)` - Active/hover states
- **Layer 4 (Modal):** `rgb(35, 40, 52)` - Overlays

### 2. **Contrast Increments**

Each layer should have a **minimum 7-unit RGB increment** from its parent to ensure perceptible depth.

### 3. **Border Accents**

- Use subtle borders (`rgba(255, 255, 255, 0.05)`) to define boundaries
- Increase to `rgba(255, 255, 255, 0.1)` for elevated states
- Add accent borders (`rgba(139, 92, 246, 0.3)`) for interactive elements

### 4. **Shadow System**

```css
/* Subtle depth */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

/* Medium depth */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

/* High depth */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);

/* Glow (for interactive elements) */
box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
```

---

## Pages to Enhance (Priority Order)

### ✅ High Priority - Primary User Flows

1. **Dashboard (War Room)** - `app/page.tsx`
   - Main metric cards need deeper separation from background
   - Chart containers should float above base layer
   - Action buttons need elevation on hover

2. **Ingestion Workspace** - `app/ingestion/workspace/page.tsx`
   - File upload zone needs clear depth separation
   - Preview table should sit in elevated card
   - Step indicators need visual hierarchy

3. **Reconciliation Workspace** - `app/reconciliation/workspace/page.tsx`
   - Match cards need layered depth
   - Transaction panels should have clear separation
   - Confidence badges need elevation

4. **Investigation/Cases** - `app/investigate/page.tsx`
   - Case cards need depth differentiation
   - Evidence exhibits should float above case container
   - Adjudication bench needs modal-level elevation

5. **Forensic Lab** - `app/forensic/lab/page.tsx`
   - Analysis panels need layered depth
   - Result cards should elevate on interaction
   - Chart containers need clear backgrounds

### ⚠️ Medium Priority - Secondary Flows

1. **Forensic Nexus** - `app/forensic/nexus/page.tsx`
2. **Asset Recovery** - `app/forensic/asset-recovery/page.tsx`
3. **Satellite Verification** - `app/forensic/satellite/page.tsx`
4. **Project Analytics** - `app/analysis/page.tsx`
5. **Legal Dossier** - `app/legal/dossier/page.tsx`

### 📊 Low Priority - Utilities

1. **Settings** - `app/settings/page.tsx`
2. **Login** - `app/login/page.tsx`

---

## Implementation Strategy

### Phase 1: Global CSS Variables (COMPLETED ✅)

Already defined in `globals.css`:

```css
:root {
  --depth-0-bg: rgb(8, 10, 15);
  --depth-1-bg: rgb(15, 18, 25);
  --depth-2-bg: rgb(22, 26, 35);
  --depth-3-bg: rgb(28, 32, 42);
  ...
}
```

### Phase 2: Component Refactoring (IN PROGRESS)

For each page:

1. **Audit current layout structure**
2. **Identify depth layers:**
   - Background/canvas
   - Main containers
   - Content cards
   - Interactive elements
3. **Apply CSS classes:**
   - `.depth-layer-1` for main containers
   - `.depth-layer-2` for cards
   - `.depth-layer-3` for elevated elements
4. **Add transition effects** for hover/active states
5. **Test contrast ratios** for accessibility

### Phase 3: Create Reusable Components

Extract common patterns:

- `<DepthCard>` - Auto-applies depth-2 with shadow
- `<ElevatedPanel>` - Container with depth-1 + border
- `<FloatingCard>` - depth-3 with medium shadow + glow
- `<ModalContainer>` - depth-4 with high shadow

---

## Example Transformation

### Before (Flat)

```tsx
<div className="bg-zinc-900 p-6 rounded-lg">
  <h2>Transaction Details</h2>
  <div className="mt-4">
    <p>Amount: $1,000</p>
  </div>
</div>
```

### After (Depth)

```tsx
<div className="depth-layer-2 p-6 rounded-lg border border-white/5 shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-white/90 font-semibold">Transaction Details</h2>
  <div className="mt-4 depth-layer-3 p-4 rounded border border-white/10">
    <p className="text-white/70">Amount: <span className="text-emerald-400 font-mono">$1,000</span></p>
  </div>
</div>
```

Key improvements:

- Container uses `depth-layer-2` (rgb(22, 26, 35))
- Inner content uses `depth-layer-3` (rgb(28, 32, 42))
- Border creates visual separation
- Shadow adds perceived elevation
- Hover state enhances interactivity

---

## CSS Utility Classes to Add

```css
/* Depth Layers */
.depth-layer-0 { background: var(--depth-0-bg); }
.depth-layer-1 { background: var(--depth-1-bg); }
.depth-layer-2 { background: var(--depth-2-bg); }
.depth-layer-3 { background: var(--depth-3-bg); }
.depth-layer-4 { background: var(--depth-4-bg); }

/* Depth Borders */
.depth-border-subtle { border: 1px solid rgba(255, 255, 255, 0.05); }
.depth-border-medium { border: 1px solid rgba(255, 255, 255, 0.1); }
.depth-border-strong { border: 1px solid rgba(255, 255, 255, 0.15); }
.depth-border-accent { border: 1px solid rgba(139, 92, 246, 0.3); }

/* Depth Shadows */
.depth-shadow-sm { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); }
.depth-shadow-md { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); }
.depth-shadow-lg { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5); }
.depth-shadow-glow { box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }

/* Elevation Transitions */
.depth-elevate {
  transition: all 0.2s ease;
}

.depth-elevate:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

---

## Accessibility Considerations

### Contrast Ratios

- **Text on depth-2:** Minimum 7:1 for body text
- **Text on depth-3:** Minimum 4.5:1 for body text
- **Interactive elements:** Minimum 3:1 against background

### Focus Indicators

```css
.depth-layer-2:focus-visible {
  outline: 2px solid rgba(139, 92, 246, 0.6);
  outline-offset: 2px;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .depth-elevate {
    transition: none;
  }
}
```

---

## Progress Tracker

- [x] Phase 1: Update globals.css with utility classes
- [x] Phase 2: Dashboard (War Room)
- [x] Phase 2: Ingestion Workspace
- [x] Phase 2: Reconciliation Workspace
- [x] Phase 2: Investigation/Cases
- [x] Phase 2: Forensic Lab
- [x] Phase 3: Create reusable depth components (Inline implementation used)
- [x] Phase 4: Apply to remaining pages (Nexus, Satellite, Recovery, Login)
- [x] Phase 5: Accessibility audit

---

**Start Date:** January 29, 2026  
**Target Completion:** February 2, 2026  
**Status:** ✅ COMPLETED
