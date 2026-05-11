import { create } from "zustand";

interface UIStore {
  selectedBinId: number | null;
  selectBin: (id: number | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedBinId: null,
  selectBin: (id) => set({ selectedBinId: id }),
}));
