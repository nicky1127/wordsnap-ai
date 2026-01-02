import React, { useState } from "react";
import ImageUploader from "@/components/generator/ImageUploader";
import ImageAnalysis from "@/components/generator/ImageAnalysis";
import ProductForm from "@/components/generator/ProductForm";
import DescriptionResults from "@/components/generator/DescriptionResults";
import UsageCard from "@/components/dashboard/UsageCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { apiService } from "@/lib/api";
import useAppStore from "@/store/useAppStore";
import { toast } from "sonner";

export default function GeneratorPage() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [lastFormData, setLastFormData] = useState(null);
  const {
    isGenerating,
    setIsGenerating,
    currentGeneration,
    setCurrentGeneration,
    addToHistory,
  } = useAppStore();

  const handleGenerate = async (formData) => {
    if (selectedImages.length === 0) {
      toast.error("Please upload at least one product image! 📸");
      return;
    }

    setIsGenerating(true);
    setLastFormData(formData);

    try {
      const data = new FormData();

      selectedImages.forEach((image) => {
        data.append(`images`, image);
      });

      data.append("productName", formData.productName);
      data.append("category", formData.category || "");
      data.append("specs", formData.specs || "");
      data.append("tone", formData.tone);

      const response = await apiService.generateDescription(data);

      setCurrentGeneration(response.data);
      addToHistory(response.data);

      toast.success(response.message || "Boom. Fresh copy ready! 🔥");

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      console.error("Generation failed:", error);

      const errorMessage =
        error.response?.data?.error?.message ||
        "Oops! Something went wrong. Try again?";

      toast.error(errorMessage);

      if (error.response?.status === 429) {
        toast.error(
          "You've hit your limit! Upgrade for unlimited generations. ⚡",
          {
            duration: 5000,
          }
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (lastFormData) {
      toast.info("Regenerating with same settings... 🔄");
      handleGenerate(lastFormData);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            Generate Product Descriptions
          </h1>
          <p className="text-lg text-muted-foreground">
            Drop your product. We'll handle the words. ⚡
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>1. Upload Product Images</CardTitle>
                <CardDescription>
                  2-5 photos from different angles work best. JPG, PNG, or WebP.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onImagesSelect={setSelectedImages}
                  currentImages={[]}
                />
              </CardContent>
            </Card>

            {/* Image Analysis */}
            {selectedImages.length > 0 && (
              <ImageAnalysis images={selectedImages} />
            )}

            {/* Product Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>2. Add Product Details</CardTitle>
                <CardDescription>
                  Help the AI understand your product better
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductForm
                  onSubmit={handleGenerate}
                  isLoading={isGenerating}
                />
              </CardContent>
            </Card>

            {/* Results Section */}
            {currentGeneration && (
              <div id="results">
                <DescriptionResults
                  data={currentGeneration}
                  onRegenerate={handleRegenerate}
                />
              </div>
            )}
          </div>

          {/* Right Column - Usage Stats */}
          <div className="space-y-6">
            <UsageCard />

            {/* Quick Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pro Tips 💡</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">
                    📸 Multiple angles = better copy
                  </p>
                  <p className="text-muted-foreground">
                    Upload 2-5 images from different perspectives
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">✨ Clear images work best</p>
                  <p className="text-muted-foreground">
                    Well-lit photos on clean backgrounds
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">
                    🔍 Try image analysis first
                  </p>
                  <p className="text-muted-foreground">
                    See what AI detects before generating
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">📝 Be specific with specs</p>
                  <p className="text-muted-foreground">
                    More details = better descriptions
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">🎯 Choose the right tone</p>
                  <p className="text-muted-foreground">
                    Match your brand voice and audience
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">🔄 Not happy? Regenerate!</p>
                  <p className="text-muted-foreground">
                    AI gives different results each time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
