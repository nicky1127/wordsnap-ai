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
    // Use FIXED demo user for testing (until Phase 4)
    const DEMO_USER_ID = "demo-test-user";
    localStorage.setItem("userId", DEMO_USER_ID);

    // Set demo user in store
    setUser({
      uid: DEMO_USER_ID,
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
