import React from "react";
import { Moon, Sun, Zap, History, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNavigate, useLocation } from "react-router-dom";
import useAppStore from "@/store/useAppStore";

export default function Header() {
  const { theme, toggleTheme } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-gradient-to-br from-primary to-accent rounded-lg p-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">WordSnap AI</h1>
              <p className="text-xs text-muted-foreground">
                Snap a pic. Get pro copy.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              onClick={() => navigate("/")}
            >
              <Home className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button
              variant={location.pathname === "/history" ? "default" : "ghost"}
              onClick={() => navigate("/history")}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium">D</span>
              </div>
              <span className="text-sm font-medium">Demo User</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
