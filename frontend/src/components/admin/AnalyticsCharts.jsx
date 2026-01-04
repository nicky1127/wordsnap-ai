import React, { useEffect, useState } from "react";
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalytics(days);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalGenerations = analytics.reduce(
    (sum, day) => sum + day.generations,
    0
  );
  const totalCost = analytics.reduce((sum, day) => sum + day.cost, 0);
  const avgDaily = totalGenerations / analytics.length;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>API usage and cost trends</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={days === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(7)}
              >
                7 Days
              </Button>
              <Button
                variant={days === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(30)}
              >
                30 Days
              </Button>
              <Button
                variant={days === 90 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(90)}
              >
                90 Days
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border border-border rounded-lg">
              <div className="text-sm text-muted-foreground">
                Total Generations
              </div>
              <div className="text-2xl font-bold mt-1">
                {totalGenerations.toLocaleString()}
              </div>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Cost</div>
              <div className="text-2xl font-bold mt-1">
                ${totalCost.toFixed(2)}
              </div>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Daily</div>
              <div className="text-2xl font-bold mt-1">
                {avgDaily.toFixed(1)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generations Chart */}
      <Card>
        <CardHeader>
          <CardTitle>API Requests Over Time</CardTitle>
          <CardDescription>Daily generation count</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="generations"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
                name="Generations"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Chart */}
      <Card>
        <CardHeader>
          <CardTitle>API Costs Over Time</CardTitle>
          <CardDescription>
            Daily estimated costs (Vertex AI + infrastructure)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
                formatter={(value) => [`$${value.toFixed(3)}`, "Cost"]}
              />
              <Legend />
              <Bar
                dataKey="cost"
                fill="hsl(var(--primary))"
                name="Daily Cost"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Usage Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Insights</CardTitle>
          <CardDescription>Key metrics and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium">Peak Day</div>
                <div className="text-sm text-muted-foreground">
                  Highest generation count
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {Math.max(...analytics.map((d) => d.generations))} generations
                </div>
                <div className="text-xs text-muted-foreground">
                  {
                    analytics.find(
                      (d) =>
                        d.generations ===
                        Math.max(...analytics.map((x) => x.generations))
                    )?.date
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium">Cost Per Generation</div>
                <div className="text-sm text-muted-foreground">
                  Average API cost
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  $
                  {totalGenerations > 0
                    ? (totalCost / totalGenerations).toFixed(4)
                    : "0.0000"}
                </div>
                <div className="text-xs text-muted-foreground">
                  per generation
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium">Projected Monthly Cost</div>
                <div className="text-sm text-muted-foreground">
                  Based on current usage
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  ${((totalCost / days) * 30).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">estimated</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
