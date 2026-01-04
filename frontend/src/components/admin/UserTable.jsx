import React, { useEffect, useState } from "react";
import {
  Shield,
  ShieldOff,
  RotateCcw,
  Ban,
  CheckCircle,
  MoreVertical,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const exportToCSV = () => {
    const headers = [
      "Email",
      "Name",
      "Role",
      "Tier",
      "Monthly Used",
      "Monthly Quota",
      "Total Generations",
      "Auth Provider",
      "Status",
      "Joined",
      "Last Login",
    ];

    const rows = users.map((user) => [
      user.email,
      user.displayName || "",
      user.role,
      user.tier,
      user.monthlyUsed,
      user.monthlyQuota === -1 ? "Unlimited" : user.monthlyQuota,
      user.totalGenerations,
      user.authProvider,
      user.status,
      formatDate(user.createdAt),
      formatDate(user.lastLoginAt),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wordsnap-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("User data exported to CSV");
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update user role");
    }
    setActiveMenu(null);
  };

  const handleResetQuota = async (userId) => {
    if (
      !confirm(
        "Reset this user's monthly quota? This will delete all their generations for this month."
      )
    ) {
      return;
    }

    try {
      const response = await adminApi.resetUserQuota(userId);
      toast.success(
        `Quota reset - ${response.data.deletedCount} generations removed`
      );
      loadUsers();
    } catch (error) {
      console.error("Failed to reset quota:", error);
      toast.error("Failed to reset quota");
    }
    setActiveMenu(null);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";

    try {
      await adminApi.updateUserStatus(userId, newStatus);
      toast.success(
        `User ${newStatus === "suspended" ? "suspended" : "activated"}`
      );
      loadUsers();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update user status");
    }
    setActiveMenu(null);
  };

  const handleUpdateTier = async (userId, tier) => {
    try {
      await adminApi.updateUserTier(userId, tier);
      toast.success(`User tier updated to ${tier}`);
      loadUsers();
    } catch (error) {
      console.error("Failed to update tier:", error);
      toast.error("Failed to update tier");
    }
    setActiveMenu(null);
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user roles, tiers, and quotas ({users.length} total users)
            </CardDescription>
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  Role
                </th>
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  Tier
                </th>
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  Usage
                </th>
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  Auth
                </th>
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  Last Login
                </th>
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="pb-3 px-2 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.uid}
                  className="border-b border-border hover:bg-secondary/50"
                >
                  <td className="py-3 px-2">
                    <div>
                      <div className="font-medium text-sm">
                        {user.displayName || "No name"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {user.role === "admin" ? (
                      <Badge variant="default" className="gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <select
                      value={user.tier}
                      onChange={(e) =>
                        handleUpdateTier(user.uid, e.target.value)
                      }
                      className="text-sm border border-border rounded px-2 py-1 bg-background"
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="agency">Agency</option>
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm">
                      <div className="font-medium">
                        {user.monthlyUsed}/
                        {user.monthlyQuota === -1 ? "∞" : user.monthlyQuota}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.totalGenerations} total
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="outline" className="text-xs">
                      {user.authProvider === "google"
                        ? "🔵 Google"
                        : "📧 Email"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="py-3 px-2">
                    {user.status === "active" ? (
                      <Badge
                        variant="outline"
                        className="gap-1 text-green-600 border-green-600"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 text-red-600 border-red-600"
                      >
                        <Ban className="w-3 h-3" />
                        Suspended
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setActiveMenu(
                            activeMenu === user.uid ? null : user.uid
                          )
                        }
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>

                      {activeMenu === user.uid && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenu(null)}
                          />
                          <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-20">
                            <div className="p-1">
                              <button
                                onClick={() =>
                                  handleToggleAdmin(user.uid, user.role)
                                }
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md"
                              >
                                {user.role === "admin" ? (
                                  <>
                                    <ShieldOff className="w-4 h-4" />
                                    Remove Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-4 h-4" />
                                    Make Admin
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleResetQuota(user.uid)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Reset Quota
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleStatus(user.uid, user.status)
                                }
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md text-destructive"
                              >
                                {user.status === "active" ? (
                                  <>
                                    <Ban className="w-4 h-4" />
                                    Suspend User
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Activate User
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
