import { create } from 'zustand';
import { apiService } from '@/shared/api';
import type { RagChunk } from '@/shared/api/types';

interface RagState {
  query: string;
  answer: string | null;
  sources: RagChunk[];
  isLoading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  executeSearch: () => Promise<void>;
  clearSearch: () => void;
}

export const useRagStore = create<RagState>((set, get) => ({
  query: '',
  answer: null,
  sources: [],
  isLoading: false,
  error: null,

  setQuery: (query) => set({ query }),

  executeSearch: async () => {
    const { query } = get();
    if (!query.trim()) return;

    set({ isLoading: true, error: null, answer: null, sources: [] });

    try {
      const response = await apiService.answerRag({
        query: query.trim(),
        top_k: 5,
        filters: { task: 'text' },
      });

      set({
        answer: response.answer,
        sources: response.sources,
        isLoading: false,
      });
    } catch (err) {
      let errorMessage = 'Не удалось выполнить поиск по базе знаний';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearSearch: () => set({ query: '', answer: null, sources: [], error: null, isLoading: false }),
}));