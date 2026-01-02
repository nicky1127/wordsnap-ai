import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Header from "@/components/dashboard/Header";
import GeneratorPage from "@/pages/GeneratorPage";
import HistoryPage from "@/pages/HistoryPage";
import NotFoundPage from "@/pages/NotFoundPage";
import useAppStore from "@/store/useAppStore";

function App() {
  const { theme, setUser } = useAppStore();

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Set a demo user ID for Phase 3
    // In Phase 4, we'll replace this with Firebase Auth
    if (!localStorage.getItem("userId")) {
      const userId = `demo-${Date.now()}`;
      localStorage.setItem("userId", userId);
    }

    // Set demo user in store
    setUser({
      uid: localStorage.getItem("userId"),
      displayName: "Demo User",
      tier: "free",
    });
  }, [setUser]);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Header />

        <main>
          <Routes>
            <Route path="/" exact element={<GeneratorPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          theme={theme}
          toastOptions={{
            className: "bg-card border border-border",
          }}
        />
      </div>
    </Router>
  );
}

export default App;
