import { create } from 'zustand';
import localforage from 'localforage';

// Instância isolada do IndexedDB para sincronia com o carrossel
const carouselDB = localforage.createInstance({
  name: 'PowerDanceCarouselDB',
  storeName: 'carousel_data',
});

const GLOBAL_INDEX_KEY = 'carousel_global_index';
const BLOCK_10_INDEX_KEY = 'carousel_block_10_index';

interface CarouselState {
  globalIndex: number;
  totalItems: number;
  isPaused: boolean;
  savedBlockIndex: number; // Salva a referência do bloco de 10

  setTotalItems: (total: number) => void;
  setGlobalIndex: (index: number) => void;
  nextIndex: () => void;
  setPaused: (paused: boolean) => void;
  saveCurrentPosition: () => void;
  restoreSavedPosition: () => Promise<void>;
}

export const useCarouselStore = create<CarouselState>((set, get) => ({
  globalIndex: 0,
  totalItems: 0,
  isPaused: false,
  savedBlockIndex: 0,

  setTotalItems: (total) => set({ totalItems: total }),

  setGlobalIndex: (index) => {
    set({ globalIndex: index });
    if (typeof window !== 'undefined') {
      carouselDB.setItem(GLOBAL_INDEX_KEY, index).catch(console.error);
    }
  },

  nextIndex: () => {
    const { globalIndex, totalItems, isPaused } = get();
    if (isPaused || totalItems === 0) return;

    const next = (globalIndex + 1) % totalItems;
    set({ globalIndex: next });

    if (typeof window !== 'undefined') {
      carouselDB.setItem(GLOBAL_INDEX_KEY, next).catch(console.error);

      // A cada 10 posições, atualiza e persiste a referência do bloco de 10
      if (next % 10 === 0) {
        set({ savedBlockIndex: next });
        carouselDB.setItem(BLOCK_10_INDEX_KEY, next).catch(console.error);
      }
    }
  },

  setPaused: (paused) => set({ isPaused: paused }),

  saveCurrentPosition: () => {
    const { globalIndex } = get();
    set({ savedBlockIndex: globalIndex });
    if (typeof window !== 'undefined') {
      carouselDB.setItem(BLOCK_10_INDEX_KEY, globalIndex).catch(console.error);
      carouselDB.setItem(GLOBAL_INDEX_KEY, globalIndex).catch(console.error);
    }
  },

  restoreSavedPosition: async () => {
    if (typeof window !== 'undefined') {
      try {
        const savedIndex = await carouselDB.getItem<number>(GLOBAL_INDEX_KEY);
        const savedBlock = await carouselDB.getItem<number>(BLOCK_10_INDEX_KEY);

        set({
          globalIndex: typeof savedIndex === 'number' ? savedIndex : 0,
          savedBlockIndex: typeof savedBlock === 'number' ? savedBlock : 0,
        });
      } catch (err) {
        console.error('Erro ao restaurar índice do IndexedDB:', err);
      }
    }
  },
}));