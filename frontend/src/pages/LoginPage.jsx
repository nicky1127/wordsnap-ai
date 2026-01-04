import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Mail,
  Lock,
  Sparkles,
  Upload,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/firebase";
import { toast } from "sonner";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://wordsnap-backend-763810149974.us-central1.run.app";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Demo feature state
  const [demoImage, setDemoImage] = useState(null);
  const [demoAnalyzing, setDemoAnalyzing] = useState(false);
  const [demoResult, setDemoResult] = useState(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { user, error } = await signInWithGoogle();

    if (error) {
      toast.error(error);
      setLoading(false);
    } else if (user) {
      toast.success(`Welcome, ${user.displayName || "there"}! 🎉`);
      navigate("/");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.error("Please enter both email and password");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { user, error } = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);

    if (error) {
      let errorMsg = error;
      if (error.includes("email-already-in-use")) {
        errorMsg = "Email already in use. Try signing in instead.";
      } else if (
        error.includes("wrong-password") ||
        error.includes("user-not-found")
      ) {
        errorMsg = "Invalid email or password";
      } else if (error.includes("invalid-email")) {
        errorMsg = "Invalid email address";
      }

      toast.error(errorMsg);
      setLoading(false);
    } else if (user) {
      toast.success(
        isSignUp ? "Account created! Welcome! 🎉" : "Signed in successfully! 👋"
      );
      navigate("/");
    }
  };

  const handleDemoImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setDemoImage(file);
      setDemoResult(null);
    }
  };

  const handleDemoAnalyze = async () => {
    if (!demoImage) {
      toast.error("Please upload an image first!");
      return;
    }

    setDemoAnalyzing(true);
    setDemoResult(null);

    try {
      // Actually call the public API endpoint
      const formData = new FormData();
      formData.append("image", demoImage);

      const response = await axios.post(
        `${API_BASE_URL}/api/generate/analyze`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setDemoResult(response.data.data);
        toast.success("Analysis complete! 🔍");
      }
    } catch (error) {
      console.error("Demo analysis failed:", error);

      // If API fails, show a helpful message
      if (error.response?.status === 401) {
        toast.error("Sign in required for image analysis");
      } else {
        toast.error("Analysis unavailable. Sign in to access full features!");
      }
    } finally {
      setDemoAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Custom SVG Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent/5 to-background p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="bg-gradient-to-br from-primary to-accent rounded-lg p-2">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">WordSnap AI</h2>
            <p className="text-xs text-muted-foreground">
              Snap a pic. Get pro copy.
            </p>
          </div>
        </div>

        {/* Custom SVG Illustration */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <svg
              viewBox="0 0 800 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-2xl"
            >
              {/* Person with laptop */}
              <g>
                {/* Laptop */}
                <rect
                  x="200"
                  y="400"
                  width="400"
                  height="20"
                  rx="2"
                  fill="currentColor"
                  className="text-primary opacity-20"
                />
                <path
                  d="M250 250 L250 400 L550 400 L550 250 Z"
                  fill="currentColor"
                  className="text-primary opacity-80"
                />
                <rect
                  x="260"
                  y="260"
                  width="280"
                  height="130"
                  rx="4"
                  fill="currentColor"
                  className="text-background"
                />

                {/* Screen content - Code lines */}
                <line
                  x1="280"
                  y1="280"
                  x2="380"
                  y2="280"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary"
                />
                <line
                  x1="280"
                  y1="300"
                  x2="450"
                  y2="300"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-accent"
                />
                <line
                  x1="280"
                  y1="320"
                  x2="420"
                  y2="320"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary opacity-60"
                />
                <line
                  x1="280"
                  y1="340"
                  x2="500"
                  y2="340"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-accent opacity-60"
                />
                <line
                  x1="280"
                  y1="360"
                  x2="360"
                  y2="360"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary opacity-40"
                />
              </g>

              {/* AI Icon - Top Left */}
              <g>
                <circle
                  cx="150"
                  cy="150"
                  r="60"
                  fill="currentColor"
                  className="text-primary opacity-10"
                />
                <rect
                  x="120"
                  y="120"
                  width="60"
                  height="60"
                  rx="12"
                  fill="currentColor"
                  className="text-primary"
                />
                <text
                  x="150"
                  y="160"
                  textAnchor="middle"
                  fill="white"
                  fontSize="24"
                  fontWeight="bold"
                >
                  AI
                </text>
                {/* Sparkles */}
                <circle
                  cx="110"
                  cy="110"
                  r="4"
                  fill="currentColor"
                  className="text-accent animate-pulse"
                />
                <circle
                  cx="190"
                  cy="120"
                  r="3"
                  fill="currentColor"
                  className="text-primary animate-pulse delay-300"
                />
                <circle
                  cx="130"
                  cy="190"
                  r="3"
                  fill="currentColor"
                  className="text-accent animate-pulse delay-700"
                />
              </g>

              {/* Document/Text Output - Top Right */}
              <g>
                <rect
                  x="600"
                  y="100"
                  width="160"
                  height="200"
                  rx="8"
                  fill="currentColor"
                  className="text-card"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-border"
                />
                {/* Text lines */}
                <line
                  x1="620"
                  y1="130"
                  x2="740"
                  y2="130"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary"
                />
                <line
                  x1="620"
                  y1="150"
                  x2="720"
                  y2="150"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted-foreground"
                />
                <line
                  x1="620"
                  y1="165"
                  x2="730"
                  y2="165"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted-foreground"
                />
                <line
                  x1="620"
                  y1="180"
                  x2="700"
                  y2="180"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted-foreground"
                />

                <line
                  x1="620"
                  y1="210"
                  x2="740"
                  y2="210"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-accent"
                />
                <line
                  x1="620"
                  y1="230"
                  x2="710"
                  y2="230"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted-foreground"
                />
                <line
                  x1="620"
                  y1="245"
                  x2="735"
                  y2="245"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted-foreground"
                />
                <line
                  x1="620"
                  y1="260"
                  x2="690"
                  y2="260"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted-foreground"
                />
              </g>

              {/* Settings/Controls - Bottom Left */}
              <g>
                <rect
                  x="50"
                  y="350"
                  width="120"
                  height="120"
                  rx="12"
                  fill="currentColor"
                  className="text-secondary"
                />
                {/* Toggle */}
                <circle
                  cx="80"
                  cy="390"
                  r="15"
                  fill="currentColor"
                  className="text-primary"
                />
                <rect
                  x="100"
                  y="380"
                  width="50"
                  height="20"
                  rx="4"
                  fill="currentColor"
                  className="text-muted"
                />

                {/* Slider */}
                <line
                  x1="70"
                  y1="430"
                  x2="150"
                  y2="430"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-muted"
                />
                <circle
                  cx="120"
                  cy="430"
                  r="8"
                  fill="currentColor"
                  className="text-accent"
                />
              </g>

              {/* Arrows connecting elements */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="currentColor"
                    className="text-primary opacity-40"
                  />
                </marker>
              </defs>

              {/* AI to Laptop */}
              <path
                d="M 180 180 Q 200 300 250 350"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                markerEnd="url(#arrowhead)"
                className="text-primary opacity-40"
                strokeDasharray="5,5"
              />

              {/* Laptop to Document */}
              <path
                d="M 550 300 Q 570 200 600 180"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                markerEnd="url(#arrowhead)"
                className="text-accent opacity-40"
                strokeDasharray="5,5"
              />

              {/* Controls to AI */}
              <path
                d="M 120 350 Q 130 250 140 180"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                markerEnd="url(#arrowhead)"
                className="text-primary opacity-30"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-3">
          <h3 className="text-sm font-semibold text-primary mb-4">
            What you get with WordSnap AI:
          </h3>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">AI Image Analysis</p>
              <p className="text-xs text-muted-foreground">
                Extract features, colors, and details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="font-medium">3 Description Lengths</p>
              <p className="text-xs text-muted-foreground">
                Short, medium, long + bullets + keywords
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Multi-Image Support</p>
              <p className="text-xs text-muted-foreground">
                Upload 2-5 images for better results
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Demo & Auth */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="bg-gradient-to-br from-primary to-accent rounded-lg p-3">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">WordSnap AI</h1>
              <p className="text-sm text-muted-foreground">
                Snap a pic. Get pro copy.
              </p>
            </div>
          </div>

          {/* Preview Badge */}
          {!demoResult && (
            <div className="text-center">
              <Badge variant="secondary" className="mb-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Try a Quick Preview
              </Badge>
              <p className="text-sm text-muted-foreground">
                Test our AI image analysis (just a small taste of what's
                inside!)
              </p>
            </div>
          )}

          {/* Try It Out - Demo Section */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Quick AI Analysis Preview
              </CardTitle>
              <CardDescription>
                Upload a product image to see real AI feature detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image upload */}
              <div>
                <input
                  type="file"
                  id="demo-image"
                  accept="image/*"
                  onChange={handleDemoImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="demo-image"
                  className="flex items-center justify-center w-full p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                >
                  {demoImage ? (
                    <div className="text-center">
                      <img
                        src={URL.createObjectURL(demoImage)}
                        alt="Demo"
                        className="w-20 h-20 object-cover rounded-lg mx-auto mb-2"
                      />
                      <p className="text-sm text-primary font-medium">
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload product image
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, or WebP (max 5MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Analyze button */}
              <Button
                onClick={handleDemoAnalyze}
                disabled={!demoImage || demoAnalyzing}
                className="w-full"
                variant="outline"
              >
                {demoAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze with Real AI
                  </>
                )}
              </Button>

              {/* Demo results */}
              {demoResult && (
                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Analysis Results
                    </Badge>
                  </div>

                  {demoResult.category && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Detected Category
                      </p>
                      <Badge variant="secondary" className="text-sm">
                        {demoResult.category}
                      </Badge>
                    </div>
                  )}

                  {demoResult.colors && demoResult.colors.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Main Colors
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {demoResult.colors.map((color, idx) => (
                          <Badge key={idx} variant="outline">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {demoResult.features && demoResult.features.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Detected Features
                      </p>
                      <ul className="space-y-1">
                        {demoResult.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {demoResult.material && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Material
                      </p>
                      <p className="text-sm">{demoResult.material}</p>
                    </div>
                  )}

                  {/* Compelling CTA */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold text-center flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        This is just the beginning!
                      </p>
                      <p className="text-xs text-center text-muted-foreground">
                        Sign in to unlock the full power:
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>
                            Generate 3 professional descriptions
                            (short/medium/long)
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>SEO-optimized keywords + feature bullets</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>Upload 2-5 images for better results</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>
                            Choose writing tone (professional/casual/luxury)
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>Save & export your generation history</span>
                        </li>
                      </ul>
                    </div>

                    <Button
                      onClick={() => {
                        const authSection =
                          document.getElementById("auth-section");
                        authSection?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full"
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Sign Up to Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auth Card */}
          <Card id="auth-section">
            <CardHeader>
              <CardTitle>
                {isSignUp ? "Create Your Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? "Get started with 10 free generations per month"
                  : "Sign in to continue creating amazing product copy"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Sign-In */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {isSignUp ? "Creating account..." : "Signing in..."}
                    </>
                  ) : isSignUp ? (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Toggle Sign Up / Sign In */}
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
