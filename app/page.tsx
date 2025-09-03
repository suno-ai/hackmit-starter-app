"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Music, Sparkles } from "lucide-react";

export default function MusicGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedSong, setGeneratedSong] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setIsComplete(false);
    setGeneratedSong(null);

    // Simulate API call and progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setIsComplete(true);
          setGeneratedSong(`generated-song-${Date.now()}.mp3`);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    // TODO: Replace with actual Suno API call
    // const response = await fetch('/api/generate-music', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ prompt })
    // })
  };

  const handleDownload = () => {
    // TODO: Implement actual download functionality
    const link = document.createElement("a");
    link.href = "#"; // Replace with actual audio file URL
    link.download = generatedSong || "generated-song.mp3";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 relative overflow-hidden">
      {/* Floating cloud decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-20 bg-gradient-to-r from-orange-200/40 to-red-200/40 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-40 h-24 bg-gradient-to-r from-red-200/40 to-yellow-200/40 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-32 left-1/4 w-36 h-22 bg-gradient-to-r from-yellow-200/40 to-orange-200/40 rounded-full blur-xl animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-1/3 w-28 h-18 bg-gradient-to-r from-orange-300/30 to-red-300/30 rounded-full blur-xl animate-pulse delay-500" />
        <div className="absolute top-60 left-1/2 w-24 h-16 bg-gradient-to-r from-red-300/25 to-orange-300/25 rounded-full blur-2xl animate-pulse delay-3000" />
        <div className="absolute bottom-60 right-10 w-30 h-20 bg-gradient-to-r from-yellow-300/35 to-red-300/35 rounded-full blur-xl animate-pulse delay-1500" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Music className="w-8 h-8" />
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Music Generator
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Transform your ideas into beautiful music with the power of AI!
            </p>
          </div>

          {/* Main Interface */}
          <Card className="p-8 backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
            <div className="space-y-6">
              {/* Text Input */}
              <div className="space-y-2">
                <label
                  htmlFor="prompt"
                  className="text-md font-medium text-foreground"
                >
                  Describe your song!
                </label>
                <Textarea
                  id="prompt"
                  placeholder="An upbeat pop song about summer adventures with electric guitar and synths..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none text-base mt-4 border border-red-200 rounded-lg p-4"
                  disabled={isGenerating}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                size="lg"
                className="w-full h-12 text-base font-semibold btn-primary-darker-hover"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Generating Music...
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5 mr-2" />
                    Generate Song
                  </>
                )}
              </Button>

              {/* Progress Indicator */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Creating your masterpiece...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Download Button */}
              {isComplete && generatedSong && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      🎉 Your song is ready!
                    </p>
                    <Button
                      onClick={handleDownload}
                      variant="secondary"
                      size="lg"
                      className="w-full h-12 text-base font-semibold text-white"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Song
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Footer */}
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <a
              href="https://suno.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Suno API
            </a>{" "}
            • Create any song, any time!
          </p>
        </div>
      </div>
    </div>
  );
}
