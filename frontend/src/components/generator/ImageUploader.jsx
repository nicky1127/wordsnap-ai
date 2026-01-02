import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function ImageUploader({ onImagesSelect, currentImages = [] }) {
  const [previews, setPreviews] = useState(currentImages);

  const onDrop = useCallback(
    (acceptedFiles) => {
      // Limit to 5 images total
      const remainingSlots = 5 - previews.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      if (filesToAdd.length === 0) {
        return;
      }

      // Create previews
      const newPreviews = [];
      const fileReaders = filesToAdd.map((file, index) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push({
              file,
              preview: reader.result,
              id: Date.now() + index,
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(fileReaders).then(() => {
        const updatedPreviews = [...previews, ...newPreviews];
        setPreviews(updatedPreviews);
        onImagesSelect(updatedPreviews.map((p) => p.file));
      });
    },
    [previews, onImagesSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    maxFiles: 5,
    maxSize: 5242880, // 5MB per file
    disabled: previews.length >= 5,
  });

  const removeImage = (id) => {
    const updatedPreviews = previews.filter((p) => p.id !== id);
    setPreviews(updatedPreviews);
    onImagesSelect(updatedPreviews.map((p) => p.file));
  };

  const clearAll = () => {
    setPreviews([]);
    onImagesSelect([]);
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone */}
      {previews.length < 5 && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary/5",
            isDragActive && "border-primary bg-primary/10",
            previews.length >= 5 && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-medium mb-1">
                {isDragActive ? "Drop it here! 📸" : "Drop product images"}
              </p>
              <p className="text-sm text-muted-foreground">
                Upload 2-5 images from different angles (max 5MB each)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {previews.length}/5 images added
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {previews.length} image{previews.length > 1 ? "s" : ""} selected
            </p>
            {previews.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className="relative rounded-lg overflow-hidden border-2 border-border group"
              >
                <img
                  src={preview.preview}
                  alt="Product preview"
                  className="w-full h-32 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(preview.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
                {preview === previews[0] && (
                  <div className="absolute bottom-1 left-1">
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Main
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            💡 First image is the main product photo. Add more angles for better
            descriptions!
          </p>
        </div>
      )}
    </div>
  );
}
