import React, { useEffect, useState } from "react";
import {
  Shield,
  RotateCcw,
  Ban,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAuditLogs();
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "UPDATE_ROLE":
        return <Shield className="w-4 h-4" />;
      case "RESET_QUOTA":
        return <RotateCcw className="w-4 h-4" />;
      case "UPDATE_STATUS":
        return <AlertCircle className="w-4 h-4" />;
      case "UPDATE_TIER":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "UPDATE_ROLE":
        return "default";
      case "RESET_QUOTA":
        return "secondary";
      case "UPDATE_STATUS":
        return "destructive";
      case "UPDATE_TIER":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case "UPDATE_ROLE":
        return "Role Updated";
      case "RESET_QUOTA":
        return "Quota Reset";
      case "UPDATE_STATUS":
        return "Status Changed";
      case "UPDATE_TIER":
        return "Tier Updated";
      default:
        return action;
    }
  };

  const getActionDetails = (action, details) => {
    switch (action) {
      case "UPDATE_ROLE":
        return `Changed to ${details.newRole}`;
      case "RESET_QUOTA":
        return `Removed ${details.deletedCount} generations`;
      case "UPDATE_STATUS":
        return `Changed to ${details.newStatus}`;
      case "UPDATE_TIER":
        return `Changed to ${details.newTier}`;
      default:
        return JSON.stringify(details);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading audit logs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>
          Track all admin actions and system changes ({logs.length} recent
          entries)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs yet
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getActionIcon(log.action)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={getActionColor(log.action)}
                      className="gap-1"
                    >
                      {getActionLabel(log.action)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">
                      Admin {log.adminId.slice(0, 8)}...
                    </span>
                    {" performed action on "}
                    <span className="font-medium">
                      User {log.targetUserId.slice(0, 8)}...
                    </span>
                  </div>

                  {log.details && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {getActionDetails(log.action, log.details)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
