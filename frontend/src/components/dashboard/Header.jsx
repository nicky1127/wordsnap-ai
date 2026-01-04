import React, { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Zap,
  History,
  Home,
  LogOut,
  User,
  Menu,
  X,
  BarChart3,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNavigate, useLocation } from "react-router-dom";
import useAppStore from "@/store/useAppStore";
import { signOut, auth } from "@/lib/firebase";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Header() {
  const { theme, toggleTheme, user, clearUser } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  console.log("isAdmin", isAdmin);
  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        // Try to call admin endpoint - if it succeeds, user is admin
        const response = await api.get("/api/admin/stats");
        setIsAdmin(true);
      } catch (error) {
        // If 403, user is not admin
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      clearUser();
      toast.success("Signed out successfully");
      navigate("/login");
    }
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  // Helper component for user avatar
  const UserAvatar = ({ size = "md", showFallback = true }) => {
    const sizeClasses = {
      sm: "w-9 h-9 text-sm",
      md: "w-8 h-8 text-sm",
      lg: "w-12 h-12 text-lg",
    };

    if (user?.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt={user.displayName || "User"}
          className={`${sizeClasses[size]} rounded-full ring-2 ring-primary/20`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (showFallback) {
              e.target.style.display = "none";
            }
          }}
        />
      );
    }

    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold flex-shrink-0`}
      >
        {(user?.displayName || user?.email || "U")[0].toUpperCase()}
      </div>
    );
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Compact on mobile */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => navigate("/")}
          >
            <div className="bg-gradient-to-br from-primary to-accent rounded-lg p-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight">WordSnap AI</h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Snap. Generate. Sell.
              </p>
            </div>
            <h1 className="sm:hidden text-lg font-bold">WordSnap</h1>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/")}
            >
              <Home className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button
              variant={location.pathname === "/history" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/history")}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>

            {/* Admin link - Only show for admins */}
            {isAdmin && (
              <Button
                variant={location.pathname === "/admin" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/admin")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="flex-shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex-shrink-0"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>

            {/* User Profile - Desktop */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <UserAvatar size="md" />
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user?.displayName || user?.email?.split("@")[0] || "User"}
                </span>
                {isAdmin && (
                  <Shield className="w-4 h-4 text-primary" title="Admin" />
                )}
              </button>

              {/* Desktop User Dropdown */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-20">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <UserAvatar size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user?.displayName || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              Free Plan
                            </span>
                            {isAdmin && (
                              <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      {/* Admin Dashboard Link - Only show if admin */}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md transition-colors mb-1"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Admin Dashboard
                        </button>
                      )}

                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Avatar - Mobile */}
            <div className="md:hidden">
              <UserAvatar size="sm" />
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {/* Navigation Links */}
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                navigate("/");
                setShowMobileMenu(false);
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              Generate Descriptions
            </Button>

            <Button
              variant={location.pathname === "/history" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                navigate("/history");
                setShowMobileMenu(false);
              }}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>

            {/* Admin Link - Only show for admins */}
            {isAdmin && (
              <Button
                variant={location.pathname === "/admin" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  navigate("/admin");
                  setShowMobileMenu(false);
                }}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}

            {/* User Info */}
            <div className="pt-2 pb-2 px-3 border-t border-border mt-2">
              <div className="flex items-center gap-3 mb-3">
                <UserAvatar size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="mb-3 flex gap-2">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Free Plan
                </span>
                {isAdmin && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>

              {/* Single Sign Out Button */}
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
