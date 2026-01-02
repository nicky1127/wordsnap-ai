import React, { useState } from "react";
import { Copy, Check, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

export default function DescriptionResults({ data, onRegenerate }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!data) return null;

  const { descriptions, imageUrl, imageUrls, metadata } = data;

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard! 📋");

    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const exportAsJSON = () => {
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wordsnap-${Date.now()}.json`;
    a.click();

    toast.success("Downloaded! 💾");
  };

  const CopyButton = ({ text, field }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <>
          <Check className="w-3 h-3 mr-1" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </>
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Header with Export & Regenerate */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Fresh Copy 🔥</h2>
          <p className="text-muted-foreground">
            Generated with {metadata?.tone || "professional"} tone
            {metadata?.imageCount > 1 &&
              ` • ${metadata.imageCount} images analyzed`}
          </p>
        </div>
        <div className="flex gap-2">
          {onRegenerate && (
            <Button variant="outline" onClick={onRegenerate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          )}
          <Button variant="outline" onClick={exportAsJSON}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Product Images Gallery */}
      {imageUrls && imageUrls.length > 1 ? (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={url}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {idx === 0 && (
                    <Badge className="absolute top-1 left-1" variant="default">
                      Main
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        imageUrl && (
          <Card>
            <CardContent className="p-4">
              <img
                src={imageUrl}
                alt="Product"
                className="w-full h-48 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        )
      )}

      {/* Short Description */}
      {descriptions.short && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Short Description</CardTitle>
                <CardDescription>
                  Perfect for product cards (50-80 words)
                </CardDescription>
              </div>
              <CopyButton text={descriptions.short} field="short" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{descriptions.short}</p>
          </CardContent>
        </Card>
      )}

      {/* Medium Description */}
      {descriptions.medium && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Medium Description</CardTitle>
                <CardDescription>
                  Great for listing pages (150-200 words)
                </CardDescription>
              </div>
              <CopyButton text={descriptions.medium} field="medium" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{descriptions.medium}</p>
          </CardContent>
        </Card>
      )}

      {/* Long Description */}
      {descriptions.long && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Long Description</CardTitle>
                <CardDescription>
                  Comprehensive & SEO-optimized (300-400 words)
                </CardDescription>
              </div>
              <CopyButton text={descriptions.long} field="long" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed whitespace-pre-line">
              {descriptions.long}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feature Bullets */}
      {descriptions.bullets && descriptions.bullets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Feature Highlights</CardTitle>
                <CardDescription>Key selling points</CardDescription>
              </div>
              <CopyButton
                text={descriptions.bullets.map((b) => `• ${b}`).join("\n")}
                field="bullets"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {descriptions.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* SEO Keywords */}
      {descriptions.keywords && descriptions.keywords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>SEO Keywords</CardTitle>
                <CardDescription>
                  Optimize your product discoverability
                </CardDescription>
              </div>
              <CopyButton
                text={descriptions.keywords.join(", ")}
                field="keywords"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {descriptions.keywords.map((keyword, idx) => (
                <Badge key={idx} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
