import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import useAppStore from "@/store/useAppStore";

// Components
import Header from "@/components/dashboard/Header";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import LoginPage from "@/pages/LoginPage";
import GeneratorPage from "@/pages/GeneratorPage";
import HistoryPage from "@/pages/HistoryPage";
import AdminDashboard from "@/pages/AdminDashboard"; // NEW

function App() {
  const { theme, setUser, clearUser, setAuthLoading } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          tier: "free",
        });
      } else {
        clearUser();
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, clearUser, setAuthLoading]);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Header />
                <GeneratorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <Header />
                <HistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Route - NEW */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

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
