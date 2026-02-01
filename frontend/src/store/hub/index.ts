/**
 * Hub Store (Split into Focused Stores)
 * 
 * The original useHubStore was split into three focused stores:
 * - useHubNavigation: Tab management and navigation history
 * - useHubFocus: Focus mode and comparison mode
 * - useHubSelection: Selected entities, milestones, hotspots, etc.
 */

export { useHubNavigation } from '../useHubNavigation';
export { useHubFocus } from '../useHubFocus';
export { useHubSelection } from '../useHubSelection';

// Re-export types
export type { HubTab } from '../useHubNavigation';
