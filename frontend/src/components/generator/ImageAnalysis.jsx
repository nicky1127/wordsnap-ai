import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function ImageAnalysis({ images }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!images || images.length === 0) {
      toast.error("Please upload at least one image first!");
      return;
    }

    setAnalyzing(true);

    try {
      // Use first image for analysis
      const formData = new FormData();
      formData.append("image", images[0]);

      const response = await apiService.analyzeImage(formData);
      setAnalysis(response.data);
      toast.success("Analysis complete! 🔍");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Analysis failed. Try again?");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Product Insights</CardTitle>
            <CardDescription>
              Get AI analysis of your product before generating descriptions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Images
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {analysis && (
        <CardContent className="space-y-4">
          {/* Category */}
          {analysis.category && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Detected Category
              </p>
              <Badge variant="secondary" className="text-base">
                {analysis.category}
              </Badge>
            </div>
          )}

          {/* Colors */}
          {analysis.colors && analysis.colors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Main Colors
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.colors.map((color, idx) => (
                  <Badge key={idx} variant="outline">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {analysis.features && analysis.features.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Visible Features
              </p>
              <ul className="space-y-1">
                {analysis.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Material */}
          {analysis.material && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Material
              </p>
              <p className="text-sm">{analysis.material}</p>
            </div>
          )}

          {/* Use Case */}
          {analysis.useCase && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Suggested Use Case
              </p>
              <p className="text-sm">{analysis.useCase}</p>
            </div>
          )}

          {/* Raw output fallback */}
          {analysis.raw && !analysis.category && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Analysis
              </p>
              <p className="text-sm whitespace-pre-line">{analysis.raw}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
