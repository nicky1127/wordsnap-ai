import { create } from "zustand";

const useAppStore = create((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),

  // Auth loading state
  authLoading: true,
  setAuthLoading: (loading) => set({ authLoading: loading }),

  // Theme
  theme: localStorage.getItem("theme") || "dark",
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      return { theme: newTheme };
    }),

  // Generation state
  currentGeneration: null,
  setCurrentGeneration: (generation) => set({ currentGeneration: generation }),

  // History
  generationHistory: [],
  setGenerationHistory: (history) => set({ generationHistory: history }),
  addToHistory: (generation) =>
    set((state) => ({
      generationHistory: [generation, ...state.generationHistory],
    })),

  // Usage stats
  usageStats: null,
  setUsageStats: (stats) => set({ usageStats: stats }),

  // Loading states
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));

export default useAppStore;
