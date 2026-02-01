import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * MappingKnowledge interface for column mapping storage
 */
interface MappingKnowledge {
    /** column_name -> system_field mappings */
    learnedMappings: Record<string, string>;
    /** Counter to prioritize common mappings */
    frequency: Record<string, number>;
}

/**
 * MappingStore interface for the mapping knowledge store
 */
interface MappingStore {
    knowledge: MappingKnowledge;
    /** Learn a new column to field mapping */
    learnMapping: (columnName: string, systemField: string) => void;
    /** Get suggested field for a column name */
    getSuggestedField: (columnName: string) => string | null;
    /** Clear all learned mappings */
    clearKnowledge: () => void;
    /** Forensic Purge */
    purgeStore: () => void;
}

/**
 * useMappingStore - Zustand store for managing column mapping suggestions
 * Persists learned mappings for better user experience during data ingestion
 * 
 * @example
 * ```tsx
 * const { learnMapping, getSuggestedField } = useMappingStore()
 * 
 * // Learn a mapping
 * learnMapping('uraian', 'description')
 * 
 * // Get suggestion
 * const field = getSuggestedField('uraian') // 'description'
 * ```
 */
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

      purgeStore: () => {
          set({ knowledge: { learnedMappings: {}, frequency: {} } });
          localStorage.removeItem('zenith-mapping-knowledge');
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
