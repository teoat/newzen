# Leakage Hotspots: Frontend Representation & Usage Analysis

## 🎯 Executive Summary

Leakage hotspots are currently represented across the Zenith platform using a mix of **static metrics**, **table rows**, and **simulated map visualizations**. This analysis identifies where leakage data is surfaced and proposes a unified `LeakageMap` component to standardize representation.

## 📊 Current Usage in Frontend

| Component/Page | Representation Type | Data Source | Context |
|---------------|---------------------|-------------|---------|
| **Main Dashboard** (`/`) | **Simulated Map Dots** | `globalStats.hotspots` | Pulsing red dots over a static map indicating high-risk zones. |
| **Main Dashboard** (`/`) | **Metric Card** | `total_leakage_identified` | Aggregated total value (Rp Billions) with "Critical" flagging. |
| **Reconciliation** (`/reconciliation`) | **Table Column** | `leakage_est` | Line-item variance estimation per transaction. |
| **S-Curve Analytics** (`/forensic/analytics`) | **Alert Badge** | `markup_leakage` | "Leakage Signature Detected" warning on cost overruns. |
| **Asset Recovery** (`/forensic/assets`) | **Recovery Pot** | `visual_leakage_recovery_pot` | Estimated recoverable value from identified leakage. |
| **Predictive AI** (`/forensic/predictive`) | **Probability Score** | `leakage_probability` | % chance of future leakage based on vendor patterns. |

## 📍 Visualization Analysis: "Leakage Hotspots" Component

### Current Implementation (Home Page)

Currently, the "Leakage Hotspots" tab in the `Real-time Threat Canvas` uses a simulated CSS-based map:

```tsx
{globalStats?.hotspots?.map((h, i) => (
    <div key={i} className="absolute inset-0 flex items-center justify-center">
        <div 
            className="w-4 h-4 bg-rose-500 rounded-full animate-ping opacity-60" 
            style={{ transform: `translate(${i*10}%, ${i*-10}%)` }} 
        />
    </div>
))}
```

**Critique**:

- **Lack of Precision**: Uses arbitrary `translate` positioning rather than geolocation coordinates.
- **No Interactivity**: Dots are purely visual; clicking them does not reveal specific projects or vendors.
- **Context Isolation**: No link between the "hotspot" and the underlying investigation data.

## 💡 Implemented Architecture: Interactive Geospatial Hotspots

To harmonize leakage representation with the Phase 6 Intelligence Layer, we have upgraded the hotspot visualization to a dedicated component.

### New Component: `ForensicGeoMap`

**Features**:

1. **Coordinate Mapping**: Map actual project site coordinates (Latitude/Longitude).
2. **Smart Auto-Scaling**: Automatically calculates bounds to center the view on relevant hotspots.
3. **Severity scaling**: Hotspot radius proportional to `leakage_value`.
4. **Event Integration**: Clicking a hotspot triggers `INVESTIGATION_STARTED`.
5. **Drag & Drop Evidence**: Dragging a hotspot into the `InvestigationPanel` instantly secures it as evidence.

**Proposed Data Structure**:

```typescript
interface LeakageHotspot {
  id: string;
  location: { lat: number; lng: number; name: string };
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number; // e.g., 5500000000 (5.5B)
  rootCause: string; // e.g., "Markup > 20%"
  vendorId?: string;
}
```

## 🔄 Integration with Investigation System

When an investigator interacts with a leakage hotspot:

1. **Click**: Opens `ToolDrawer` (Split View).
2. **View**: Shows `Project Details`, `Vendor Nexus`, and `Transaction Logs` for that specific site.
3. **Action**: "Flag as Investigation Target" button publishes `PROJECT_STALLED` or `TRANSACTION_FLAGGED` event.

## ✅ Completed Harmonization

1. **Standardize Data**: Backend `GlobalAuditStats` now returns `LeakageHotspot` objects with fully qualified `site_location` {lat, lng, name} metadata.
2. **Interactive Visualization**: Replaced static CSS simulation with `ForensicGeoMap` component, utilizing Framer Motion for geospatial plotting.
3. **Investigation Integration**: Hotspots are now actionable entities. Clicking a hotspot triggers `INVESTIGATION_STARTED` or adds evidence to the active case via `ForensicEventBus`.
