import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Sparkles } from "lucide-react";

export default function ProductForm({ onSubmit, isLoading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productName: "",
      category: "",
      specs: "",
      tone: "professional",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="productName">
          Product Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="productName"
          placeholder="e.g., Wireless Bluetooth Headphones"
          {...register("productName", {
            required: "Product name is required",
          })}
          disabled={isLoading}
        />
        {errors.productName && (
          <p className="text-sm text-destructive">
            {errors.productName.message}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          placeholder="e.g., Electronics, Fashion, Home & Garden"
          {...register("category")}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Helps the AI understand your product better
        </p>
      </div>

      {/* Specifications */}
      <div className="space-y-2">
        <Label htmlFor="specs">Key Specifications</Label>
        <Textarea
          id="specs"
          placeholder="e.g., Battery life: 30 hours, Noise cancellation, Bluetooth 5.0"
          rows={3}
          {...register("specs")}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Include important features, dimensions, materials, etc.
        </p>
      </div>

      {/* Tone Selector */}
      <div className="space-y-2">
        <Label htmlFor="tone">Writing Tone</Label>
        <select
          id="tone"
          {...register("tone")}
          disabled={isLoading}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="professional">
            Professional - Clear & informative
          </option>
          <option value="casual">Casual - Friendly & conversational</option>
          <option value="luxury">Luxury - Sophisticated & aspirational</option>
        </select>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Generating magic...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Descriptions
          </>
        )}
      </Button>
    </form>
  );
}
