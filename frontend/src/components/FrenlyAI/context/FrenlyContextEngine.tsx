import React, { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { useProject } from '@/store/useProject';
import { useInvestigation } from '@/store/useInvestigation';
import { useHubStore } from '@/store/useHubStore';

export interface QuickAction {
  label: string;
  icon?: string;
  route?: string;
  action?: () => void;
}

export const executeFrenlyAction = (action: QuickAction) => {
  if (action.action) {
    action.action();
  } else if (action.route) {
    window.location.href = action.route;
  }
};

interface ContextData {
  pageName: string;
  greeting: string;
  quickActions: QuickAction[];
  tips: string[];
}

const PAGE_CONTEXTS: Record<string, ContextData> = {
  '/': {
    pageName: 'Audit Command Center',
    greeting: 'System Online. Overview of active cases and financial anomalies.',
    quickActions: [
      { label: 'Review High-Risk Alerts', route: '/investigate' },
      { label: 'Upload New Evidence', route: '/ingestion' },
      { label: 'Generate Executive Summary', action: () => console.log('Gen Report') }
    ],
    tips: [
      '💡 3 new high-risk transactions detected in the last 24h.',
      '🎯 Reconciliation gap has increased by 15% in Project Alpha.'
    ]
  },
  '/ingestion': {
    pageName: 'Evidence Ingestion',
    greeting: 'Ready to process financial records. Supported formats: CSV, PDF, XLS.',
    quickActions: [
      { label: 'Use BCA Standard Template', action: () => console.log('Template') },
      { label: 'View Mapping Guide', action: () => console.log('Guide') },
      { label: 'Load Sample Dataset', action: () => console.log('Sample') }
    ],
    tips: [
      '💡 CSV files process 40% faster than Excel workbooks.',
      '🎯 Ensure column headers match the standard schema for auto-mapping.'
    ]
  },
  '/reconciliation': {
    pageName: 'Reconciliation Workspace',
    greeting: 'Ledger matching engine active. Reviewing discrepancies.',
    quickActions: [
      { label: 'Auto-Match High Confidence', action: () => console.log('Auto') },
      { label: 'Filter by Variance > 10%', action: () => console.log('Filter') },
      { label: 'Export Discrepancy Report', action: () => console.log('Export') }
    ],
    tips: [
      '💡 Use the "Forensic History" view to track status changes.',
      '🎯 Tier 1 matches are 99% accurate based on invoice reference.'
    ]
  },
  '/forensic/nexus': {
    pageName: 'Entity Nexus Graph',
    greeting: 'Visualizing entity relationships and financial flows.',
    quickActions: [
      { label: 'Highlight High-Risk Nodes', action: () => console.log('Highlight') },
      { label: 'Trace Fund Flow', action: () => console.log('Trace') },
      { label: 'Export Graph Snapshot', action: () => console.log('Snapshot') }
    ],
    tips: [
      '💡 Red edges indicate inflated transaction values.',
      '🎯 Double-click a node to expand hidden relationships.'
    ]
  },
  '/forensic/assets': {
    pageName: 'Asset Tracing Intelligence',
    greeting: 'Asset identification and recovery analysis module.',
    quickActions: [
      { label: 'Log New Asset', action: () => console.log('Add') },
      { label: 'Verify Ownership', action: () => console.log('Verify') },
      { label: 'Calculate Recoverable Value', action: () => console.log('Calc') }
    ],
    tips: [
      '💡 Verify ownership via AHU database integration.',
      '🎯 Link assets to specific transactions for evidence chain.'
    ]
  }
};

// ... Context Provider Implementation ...

interface FrenlyContextType {
  context: ContextData | null;
  getSuggestion: (query: string) => string;
}

const FrenlyContext = createContext<FrenlyContextType>({
  context: null,
  getSuggestion: () => ''
});

// Imports moved to top
// ... (Keep existing interfaces)

export function FrenlyContextProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeProjectId } = useProject();
  const { activeInvestigation } = useInvestigation();
  const { activeTab } = useHubStore();
  
  // Dynamic Context Generation
  const getContext = (): ContextData => {
    // 1. Check for Forensic Hub special handling
    if (pathname.startsWith('/forensic/hub')) {
        return {
            pageName: `Forensic Hub: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
            greeting: activeProjectId 
                ? `Analyzing Project ${activeProjectId}. Workspace active.` 
                : 'Select a project to begin forensic analysis.',
            quickActions: [
                { label: 'Switch View Mode', action: () => useHubStore.getState().toggleComparisonMode() },
                { label: 'Clear Workspace', action: () => useHubStore.getState().clearContext() },
                { label: 'View Project Audit', route: '/forensic/analytics' }
            ],
            tips: [
                '💡 Use Split View to compare Nexus graph with financial flow.',
                '🎯 Inject findings directly into the active case.'
            ]
        };
    }

    // 2. Check for Investigation active state
    if (activeInvestigation && pathname.includes('/investigate')) {
         return {
            pageName: `Case: ${activeInvestigation.title}`,
            greeting: `Investigation active. Risk Score: ${activeInvestigation.riskScore}%`,
            quickActions: [
                { label: 'Generate Dossier', route: '/investigate' },
                { label: 'Adjudicate Findings', route: '/investigate' },
                { label: 'Pause Investigation', action: () => console.log('Pause') }
            ],
            tips: [
                '💡 3 new pieces of evidence added since last review.',
                '🎯 Automated narrative has been updated.'
            ]
         };
    }

    // 3. Fallback to static map
    return PAGE_CONTEXTS[pathname] || PAGE_CONTEXTS['/'];
  };

  const context = getContext();

  const getSuggestion = (query: string) => {
    // Simple rule-based AI mocking
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('risk') || lowerQuery.includes('score')) {
        return activeInvestigation 
            ? `Current risk score is ${activeInvestigation.riskScore}%. High priority.`
            : "No active investigation to rate.";
    }
    
    if (lowerQuery.includes('project') || lowerQuery.includes('status')) {
        return activeProjectId
            ? `Project ${activeProjectId} is currently under audit.`
            : "Please select a project.";
    }

    if (lowerQuery.includes('graph') || lowerQuery.includes('nexus')) {
        return "Nexus graph shows 3 suspicious circular paths.";
    }

    return "Analyzing context... Recommendation: Cross-reference findings with external watchlists.";
  };

  return (
    <FrenlyContext.Provider value={{ context, getSuggestion }}>
      {children}
    </FrenlyContext.Provider>
  );
}

export const useFrenlyContext = () => useContext(FrenlyContext);