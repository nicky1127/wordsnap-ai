import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Zap } from "lucide-react";
import { apiService } from "@/lib/api";

export default function UsageCard() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsageStats();
      setUsage(response.data);
    } catch (error) {
      console.error("Failed to load usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Usage This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { monthlyUsed = 0, monthlyQuota = 10, tier = "free" } = usage || {};
  const percentage =
    monthlyQuota === -1 ? 0 : (monthlyUsed / monthlyQuota) * 100;
  const isUnlimited = monthlyQuota === -1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Usage This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">{monthlyUsed}</span>
            <span className="text-sm text-muted-foreground">
              {isUnlimited ? "Unlimited" : `/ ${monthlyQuota} generations`}
            </span>
          </div>
          {!isUnlimited && <Progress value={percentage} className="h-2" />}
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="capitalize">{tier} Plan</p>
          {!isUnlimited && monthlyQuota - monthlyUsed > 0 && (
            <p className="text-primary font-medium mt-1">
              {monthlyQuota - monthlyUsed} generations remaining
            </p>
          )}
          {!isUnlimited && monthlyUsed >= monthlyQuota && (
            <p className="text-destructive font-medium mt-1">
              Quota reached - Upgrade to continue
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
