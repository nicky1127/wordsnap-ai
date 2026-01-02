import { create } from "zustand";

const useAppStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  theme: localStorage.getItem("theme") || "dark",
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      return { theme: newTheme };
    }),

  currentGeneration: null,
  setCurrentGeneration: (generation) => set({ currentGeneration: generation }),

  generationHistory: [],
  setGenerationHistory: (history) => set({ generationHistory: history }),
  addToHistory: (generation) =>
    set((state) => ({
      generationHistory: [generation, ...state.generationHistory],
    })),

  usageStats: null,
  setUsageStats: (stats) => set({ usageStats: stats }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));

export default useAppStore;
