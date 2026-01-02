import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mb-6">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-6xl font-bold mb-2">404</h1>
              <p className="text-xl text-muted-foreground mb-6">
                Oops! This page wandered off...
              </p>
              <p className="text-muted-foreground mb-8">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/")}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button variant="outline" onClick={() => navigate("/history")}>
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
