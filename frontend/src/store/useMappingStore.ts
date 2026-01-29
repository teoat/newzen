import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MappingKnowledge {
  // column_name -> system_field
  learnedMappings: Record<string, string>;
  // Counter to prioritize common mappings
  frequency: Record<string, number>;
}

interface MappingStore {
  knowledge: MappingKnowledge;
  learnMapping: (columnName: string, systemField: string) => void;
  getSuggestedField: (columnName: string) => string | null;
  clearKnowledge: () => void;
}

export const useMappingStore = create<MappingStore>()(
  persist(
    (set, get) => ({
      knowledge: {
        learnedMappings: {
          'uraian': 'description',
          'debet': 'amount',
          'kredit': 'amount',
          'tanggal': 'date',
          'saldo': 'balance',
          'no rekening': 'account_number',
        },
        frequency: {}
      },

      learnMapping: (columnName, systemField) => {
        const lowCol = columnName.toLowerCase().trim();
        set((state) => ({
          knowledge: {
            learnedMappings: {
              ...state.knowledge.learnedMappings,
              [lowCol]: systemField
            },
            frequency: {
              ...state.knowledge.frequency,
              [`${lowCol}:${systemField}`]: (state.knowledge.frequency[`${lowCol}:${systemField}`] || 0) + 1
            }
          }
        }));
      },

      getSuggestedField: (columnName) => {
        const lowCol = columnName.toLowerCase().trim();
        return get().knowledge.learnedMappings[lowCol] || null;
      },

      clearKnowledge: () => set({ 
        knowledge: { 
          learnedMappings: {}, 
          frequency: {} 
        } 
      })
    }),
    {
      name: 'zenith-mapping-knowledge',
    }
  )
);
