import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";
import UserTable from "@/components/admin/UserTable";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AuditLog from "@/components/admin/AuditLog";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats:", error);

      // If 403, user is not admin
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        navigate("/");
      } else {
        toast.error("Failed to load dashboard stats");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor and manage WordSnap AI
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to App
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "users"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "analytics"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "audit"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.activeUsers || 0} active (30d)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Generations
                  </CardTitle>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalGenerations?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.todayGenerations || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    This Month
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.monthGenerations?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Estimated Cost
                  </CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stats?.estimatedCost?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All-time API costs
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setActiveTab("users")}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("analytics")}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("audit")}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Audit Log
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && <UserTable />}
        {activeTab === "analytics" && <AnalyticsCharts />}
        {activeTab === "audit" && <AuditLog />}
      </div>
    </div>
  );
}
