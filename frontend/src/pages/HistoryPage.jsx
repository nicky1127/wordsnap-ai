import React, { useEffect, useState } from "react";
import { Clock, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await apiService.getHistory(20);
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";

    try {
      let date;

      // Handle Firestore Timestamp object
      if (timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
      }
      // Handle Firestore Timestamp with seconds property
      else if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle ISO string
      else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      }
      // Handle regular Date object or milliseconds
      else {
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", timestamp);
        return "Unknown";
      }

      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error, timestamp);
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Generation History</h1>
          <p className="text-lg text-muted-foreground">
            Your previously generated product descriptions
          </p>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No history yet</h3>
              <p className="text-muted-foreground mb-4">
                Start generating product descriptions to see them here!
              </p>
              <Button onClick={() => (window.location.href = "/")}>
                Create First Description
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Image Thumbnail */}
                    {(item.imageUrl ||
                      (item.imageUrls && item.imageUrls[0])) && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.imageUrl || item.imageUrls[0]}
                          alt={item.productName}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold truncate">
                            {item.productName}
                          </h3>
                          {item.productInfo?.category && (
                            <p className="text-sm text-muted-foreground">
                              {item.productInfo.category}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {item.tone || "professional"}
                        </Badge>
                      </div>

                      {/* Short Description Preview */}
                      {item.descriptions?.short && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {item.descriptions.short}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.createdAt)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // For now, just show a toast
                            // In the future, we can add a modal to view full details
                            toast.info(
                              "Full view coming soon! For now, check your exports."
                            );
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
