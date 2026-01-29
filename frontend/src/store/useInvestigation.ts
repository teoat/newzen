/**
 * Investigation Session Store
 * Tracks the entire forensic investigation workflow as a cohesive session
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InvestigationResult {
  evidenceId?: string;
  value?: number;
  severity?: number;
  hotspotId?: string;
  context?: string;
  [key: string]: unknown;
}

export interface EvidenceItem {
  id: string;
  type: 'entity' | 'transaction' | 'hotspot' | 'milestone' | 'document';
  label: string;
  description?: string;
  sourceTool: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  verdict?: 'ADMITTED' | 'REJECTED' | 'PENDING';
}

export interface InvestigationAction {
  timestamp: Date;
  action: string;
  tool: string;
  result?: InvestigationResult;
  metadata?: Record<string, unknown>;
}

export interface InvestigationPhaseProgress {
  acquisition: number;
  forensic: number;
  verdict: number;
  enforcement: number;
}

export interface Contradiction {
  type: string;
  description: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, unknown>;
}

export interface InvestigationContext {
  projectId?: string;
  caseId?: string;
  transactionIds: string[];
  suspects: string[];
  evidenceIds: string[];
  toolsUsed: string[];
  hotspotId?: string;
  leakageValue?: number;
  assetId?: string;
  bankRecordId?: string;
  internalRecordId?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence_items?: EvidenceItem[];
  contradictions?: Contradiction[];
  final_report_hash?: string;
  sealed_at?: string;
}

export interface Investigation {
  id: string;
  title: string;
  startedAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'completed';
  context: InvestigationContext;
  timeline: InvestigationAction[];
  findings: string[];
  riskScore?: number;
  phaseProgress: InvestigationPhaseProgress;
}

interface InvestigationState {
  activeInvestigation: Investigation | null;
  investigations: Investigation[];
  
  // Actions
  startInvestigation: (title: string, context?: Partial<Investigation['context']>) => string;
  endInvestigation: () => void;
  pauseInvestigation: () => void;
  resumeInvestigation: (id: string) => void;
  
  addAction: (action: Omit<InvestigationAction, 'timestamp'>) => void;
  addTransaction: (txId: string) => void;
  addSuspect: (name: string) => void;
  addEvidence: (evidenceId: string) => void;
  addFinding: (finding: string) => void;
  updateRiskScore: (score: number) => void;
  updatePhaseProgress: (phase: keyof InvestigationPhaseProgress, progress: number) => void;
  
  getInvestigation: (id: string) => Investigation | undefined;
  clearAllInvestigations: () => void;
  
  // Verdict Command Actions
  injectEvidence: (investigationId: string, evidence: EvidenceItem) => void;
  updateEvidenceStatus: (investigationId: string, evidenceId: string, status: 'ADMITTED' | 'REJECTED' | 'PENDING') => void;
  generateNarrative: (investigationId: string) => Promise<string>;
  fetchContradictions: (investigationId: string) => Promise<void>;
  sealCase: (investigationId: string) => Promise<string>;
}

export const useInvestigation = create<InvestigationState>()(
  persist(
    (set, get) => ({
      activeInvestigation: null,
      investigations: [],

      startInvestigation: (title, context = {}) => {
        const id = `INV-${Date.now()}`;
        const now = new Date();
        const investigation: Investigation = {
          id,
          title,
          startedAt: now,
          updatedAt: now,
          status: 'active',
          context: {
            transactionIds: [],
            suspects: [],
            evidenceIds: [],
            toolsUsed: [],
            ...context,
          },
          timeline: [],
          findings: [],
          phaseProgress: {
            acquisition: 0,
            forensic: 0,
            verdict: 0,
            enforcement: 0,
          }
        };

        set((state) => ({
          activeInvestigation: investigation,
          investigations: [...state.investigations, investigation],
        }));

        return id;
      },

      endInvestigation: () => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        set((state) => ({
          activeInvestigation: null,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id
              ? { ...inv, status: 'completed' as const, updatedAt: new Date() }
              : inv
          ),
        }));
      },

      pauseInvestigation: () => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        const updated = { ...activeInvestigation, status: 'paused' as const, updatedAt: new Date() };
        set((state) => ({
          activeInvestigation: updated,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id ? updated : inv
          ),
        }));
      },

      resumeInvestigation: (id) => {
        const investigation = get().investigations.find((inv) => inv.id === id);
        if (!investigation) return;

        const updated = { ...investigation, status: 'active' as const, updatedAt: new Date() };
        set((state) => ({
          activeInvestigation: updated,
          investigations: state.investigations.map((inv) =>
            inv.id === id ? updated : inv
          ),
        }));
      },

      addAction: (action) => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        const newAction: InvestigationAction = {
          ...action,
          timestamp: new Date(),
        };

        const updatedContext = {
          ...activeInvestigation.context,
          toolsUsed: Array.from(
            new Set([...activeInvestigation.context.toolsUsed, action.tool])
          ),
        };

        const updatedInvestigation = {
          ...activeInvestigation,
          timeline: [...activeInvestigation.timeline, newAction],
          context: updatedContext,
          updatedAt: new Date(),
        };

        set((state) => ({
          activeInvestigation: updatedInvestigation,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id ? updatedInvestigation : inv
          ),
        }));
      },

      addTransaction: (txId) => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        const updatedTxIds = Array.from(
          new Set([...activeInvestigation.context.transactionIds, txId])
        );

        const updatedInvestigation = {
          ...activeInvestigation,
          context: {
            ...activeInvestigation.context,
            transactionIds: updatedTxIds,
          },
          updatedAt: new Date(),
        };

        set((state) => ({
          activeInvestigation: updatedInvestigation,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id ? updatedInvestigation : inv
          ),
        }));
      },

      addSuspect: (name) => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        const updatedSuspects = Array.from(
          new Set([...activeInvestigation.context.suspects, name])
        );

        const updatedInvestigation = {
          ...activeInvestigation,
          context: {
            ...activeInvestigation.context,
            suspects: updatedSuspects,
          },
          updatedAt: new Date(),
        };

        set((state) => ({
          activeInvestigation: updatedInvestigation,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id ? updatedInvestigation : inv
          ),
        }));
      },

      addEvidence: (evidenceId) => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        const updatedEvidence = Array.from(
          new Set([...activeInvestigation.context.evidenceIds, evidenceId])
        );

        const updatedInvestigation = {
          ...activeInvestigation,
          context: {
            ...activeInvestigation.context,
            evidenceIds: updatedEvidence,
          },
          updatedAt: new Date(),
        };

        set((state) => ({
          activeInvestigation: updatedInvestigation,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id ? updatedInvestigation : inv
          ),
        }));
      },

      addFinding: (finding) => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        const updatedInvestigation = {
          ...activeInvestigation,
          findings: [...activeInvestigation.findings, finding],
          updatedAt: new Date(),
        };

        set((state) => ({
          activeInvestigation: updatedInvestigation,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id ? updatedInvestigation : inv
          ),
        }));
      },

      updateRiskScore: (score) => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        const updatedInvestigation = {
          ...activeInvestigation,
          riskScore: score,
          updatedAt: new Date(),
        };

        set((state) => ({
          activeInvestigation: updatedInvestigation,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id ? updatedInvestigation : inv
          ),
        }));
      },

      updatePhaseProgress: (phase, progress) => {
        const { activeInvestigation } = get();
        if (!activeInvestigation) return;

        const updatedInvestigation = {
          ...activeInvestigation,
          phaseProgress: {
            ...activeInvestigation.phaseProgress,
            [phase]: progress,
          },
          updatedAt: new Date(),
        };

        set((state) => ({
          activeInvestigation: updatedInvestigation,
          investigations: state.investigations.map((inv) =>
            inv.id === activeInvestigation.id ? updatedInvestigation : inv
          ),
        }));
      },

      getInvestigation: (id) => {
        return get().investigations.find((inv) => inv.id === id);
      },

      clearAllInvestigations: () => {
        set({ activeInvestigation: null, investigations: [] });
      },

      injectEvidence: (investigationId, evidence) => {
        const investigation = get().investigations.find(i => i.id === investigationId);
        if (!investigation) return;

        const currentItems = investigation.context.evidence_items || [];
        // Prevent duplicates
        if (currentItems.some(item => item.id === evidence.id && item.type === evidence.type)) return;

        const updatedItems = [...currentItems, evidence];
        
        // Also add logic to update standard fields based on evidence type if needed
        const contextUpdates: Partial<Investigation['context']> = { evidence_items: updatedItems };
        if (evidence.type === 'transaction') {
            contextUpdates.transactionIds = Array.from(new Set([...investigation.context.transactionIds, evidence.id]));
        } else if (evidence.type === 'entity') {
            contextUpdates.suspects = Array.from(new Set([...investigation.context.suspects, evidence.label]));
        }

        const updatedInvestigation = {
          ...investigation,
          context: { ...investigation.context, ...contextUpdates },
          updatedAt: new Date()
        };
        
        // Add an action to the timeline automatically
        const injectionAction: InvestigationAction = {
             timestamp: new Date(),
             action: 'EVIDENCE_INJECTED',
             tool: evidence.sourceTool,
             result: {
                 evidenceId: evidence.id,
                 context: `Injected from ${evidence.sourceTool}: ${evidence.label}`
             }
        };
        updatedInvestigation.timeline = [...updatedInvestigation.timeline, injectionAction];

        set(state => ({
             activeInvestigation: state.activeInvestigation?.id === investigationId ? updatedInvestigation : state.activeInvestigation,
             investigations: state.investigations.map(inv => inv.id === investigationId ? updatedInvestigation : inv)
        }));
      },

      updateEvidenceStatus: (investigationId, evidenceId, status) => {
        set(state => {
          const updatedInvestigations = state.investigations.map(inv => {
            if (inv.id !== investigationId) return inv;
            
            const updatedItems = (inv.context.evidence_items || []).map(item => 
              item.id === evidenceId ? { ...item, verdict: status } : item
            );
            
            const updatedInv = {
              ...inv,
              context: { ...inv.context, evidence_items: updatedItems },
              updatedAt: new Date()
            };

            // Log action to timeline
            const action: InvestigationAction = {
                timestamp: new Date(),
                action: `EVIDENCE_${status}`,
                tool: 'AdjudicationBench',
                result: { evidenceId, context: `Evidence ${evidenceId} marked as ${status}` }
            };
            updatedInv.timeline = [...updatedInv.timeline, action];

            return updatedInv;
          });

          return {
            investigations: updatedInvestigations,
            activeInvestigation: state.activeInvestigation?.id === investigationId 
              ? updatedInvestigations.find(i => i.id === investigationId) || null 
              : state.activeInvestigation
          };
        });
      },

      generateNarrative: async (investigationId) => {
          try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200'}/api/v1/ai/dossier/${investigationId}`);
              const data = await res.json();
              return data.narrative;
          } catch (e) {
              console.error("Narrative API failed, falling back to local synthesis", e);
              const inv = get().investigations.find(i => i.id === investigationId);
              if (!inv) return "Investigation not found.";
              return `## ${inv.title}\nFallback local narrative logic...`;
          }
      },

      fetchContradictions: async (investigationId) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200'}/api/v1/ai/contradictions/${investigationId}`);
            const data = await res.json();
            
            set(state => {
                const inv = state.investigations.find(i => i.id === investigationId);
                if (!inv) return state;
                const updated = { ...inv, context: { ...inv.context, contradictions: data.contradictions }};
                return {
                    investigations: state.investigations.map(i => i.id === investigationId ? updated : i),
                    activeInvestigation: state.activeInvestigation?.id === investigationId ? updated : state.activeInvestigation
                };
            });
        } catch (e) {
            console.error("Contradiction check failed", e);
        }
      },

      sealCase: async (investigationId) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200'}/api/v1/cases/${investigationId}/seal`, { method: 'POST' });
            const data = await res.json();
            
            set(state => ({
                investigations: state.investigations.map(inv => 
                    inv.id === investigationId 
                        ? { ...inv, status: 'completed', context: { ...inv.context, final_report_hash: data.report_hash, sealed_at: new Date().toISOString() }} 
                        : inv
                )
            }));
            return data.report_hash;
        } catch (e) {
            console.error("Seal failed", e);
            throw e;
        }
      }
    }),
    {
      name: 'forensic-investigation-storage',
    }
  )
);
