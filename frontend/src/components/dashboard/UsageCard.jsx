import React, { useEffect } from "react";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import useAppStore from "@/store/useAppStore";
import { apiService } from "@/lib/api";

export default function UsageCard() {
  const { usageStats, setUsageStats } = useAppStore();

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const response = await apiService.getUsageStats();
      setUsageStats(response.data);
    } catch (error) {
      console.error("Failed to load usage stats:", error);
    }
  };

  if (!usageStats) {
    return null;
  }

  const { currentUsage, limit, remaining, tier } = usageStats;
  const percentUsed = limit === "unlimited" ? 0 : (currentUsage / limit) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>Your generation stats</CardDescription>
          </div>
          <Badge variant={tier === "free" ? "secondary" : "default"}>
            {tier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Usage Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{currentUsage}</span>
              <span className="text-sm text-muted-foreground">
                {limit === "unlimited" ? "∞" : `/ ${limit}`}
              </span>
            </div>
            {limit !== "unlimited" && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Remaining */}
          {remaining !== "unlimited" && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">
                {remaining} generations remaining
              </span>
            </div>
          )}

          {/* Upgrade CTA */}
          {tier === "free" && percentUsed > 70 && (
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="text-sm font-medium text-accent">
                Running low? Upgrade for unlimited! ⚡
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
