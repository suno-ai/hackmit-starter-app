"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Download, Music, Sparkles, Play, Pause } from "lucide-react";
import { SunoService, SunoClip } from "@/lib/suno-service";

export default function MusicGenerator() {
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedClips, setGeneratedClips] = useState<SunoClip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [audioElements, setAudioElements] = useState<{
    [key: string]: HTMLAudioElement;
  }>({});
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const [duration, setDuration] = useState<{ [key: string]: number }>({});
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{
    [key: string]: number | undefined;
  }>({});
  const [isDownloading, setIsDownloading] = useState<{
    [key: string]: boolean;
  }>({});

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setIsComplete(false);
    setGeneratedClips([]);
    setError(null);

    try {
      const clips = await SunoService.generateAndWaitForCompletion(
        {
          prompt: prompt.trim(),
          tags: tags.trim() || undefined,
          makeInstrumental: false,
        },
        (clips, progressValue) => {
          if (clips && clips.length > 0) {
            setGeneratedClips(clips);
          }
        }
      );

      setGeneratedClips(clips);
      setIsComplete(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (clip: SunoClip) => {
    if (!clip.audio_url || isDownloading[clip.id]) return;

    setIsDownloading((prev) => ({ ...prev, [clip.id]: true }));

    try {
      const response = await fetch(clip.audio_url);
      if (!response.ok) throw new Error("Failed to fetch audio");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${clip.title || "generated-song"}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: try direct link (may open in new tab)
      const link = document.createElement("a");
      link.href = clip.audio_url;
      link.download = `${clip.title || "generated-song"}.mp3`;
      link.click();
    } finally {
      setIsDownloading((prev) => ({ ...prev, [clip.id]: false }));
    }
  };

  const refreshAudioMetadata = (clip: SunoClip) => {
    const clipId = clip.id;
    const audio = audioElements[clipId];
    if (audio) {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration((prev) => ({ ...prev, [clipId]: audio.duration }));
      }
      if (audio.currentTime !== undefined && isFinite(audio.currentTime)) {
        setCurrentTime((prev) => ({ ...prev, [clipId]: audio.currentTime }));
      }
    }
  };

  const togglePlayPause = (clip: SunoClip) => {
    if (!clip.audio_url) return;

    const clipId = clip.id;

    // Refresh metadata when status is complete but duration isn't set
    if (clip.status === "complete" && !duration[clipId]) {
      refreshAudioMetadata(clip);
    }

    if (audioElements[clipId]) {
      if (isPlaying[clipId]) {
        audioElements[clipId].pause();
        setIsPlaying((prev) => ({ ...prev, [clipId]: false }));
      } else {
        // Pause all other audio first
        Object.keys(audioElements).forEach((id) => {
          if (id !== clipId && isPlaying[id]) {
            audioElements[id].pause();
            setIsPlaying((prev) => ({ ...prev, [id]: false }));
          }
        });

        audioElements[clipId].play();
        setIsPlaying((prev) => ({ ...prev, [clipId]: true }));
      }
    } else {
      const audio = new Audio(clip.audio_url);
      audio.addEventListener("ended", () => {
        setIsPlaying((prev) => ({ ...prev, [clipId]: false }));
      });
      audio.addEventListener("error", (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying((prev) => ({ ...prev, [clipId]: false }));
      });
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration)) {
          setDuration((prev) => ({ ...prev, [clipId]: audio.duration }));
        }
      });
      audio.addEventListener("timeupdate", () => {
        // Don't update current time while dragging to prevent conflicts
        if (!isDragging || isDragging !== clipId) {
          if (audio.currentTime && isFinite(audio.currentTime)) {
            setCurrentTime((prev) => ({
              ...prev,
              [clipId]: audio.currentTime,
            }));
          }
        }
      });

      audio.addEventListener("timeupdate", () => {
        if (audio.duration && isFinite(audio.duration) && !duration[clipId]) {
          setDuration((prev) => ({ ...prev, [clipId]: audio.duration }));
        }
      });

      setAudioElements((prev) => ({ ...prev, [clipId]: audio }));

      // Pause all other audio first
      Object.keys(audioElements).forEach((id) => {
        if (isPlaying[id]) {
          audioElements[id].pause();
          setIsPlaying((prev) => ({ ...prev, [id]: false }));
        }
      });

      audio.play();
      setIsPlaying((prev) => ({ ...prev, [clipId]: true }));
    }
  };

  const handleSeek = (clip: SunoClip, seekTime: number) => {
    const clipId = clip.id;
    if (audioElements[clipId]) {
      audioElements[clipId].currentTime = seekTime;
      setCurrentTime((prev) => ({ ...prev, [clipId]: seekTime }));
    }
  };

  const handleMouseDown = (clip: SunoClip, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(clip.id);

    const progressBar = document.querySelector(
      `[data-clip-id="${clip.id}"]`
    ) as HTMLElement;

    if (!progressBar || !getClipDuration(clip)) return;

    let lastSeekTime = currentTime[clip.id] || 0;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const rect = progressBar.getBoundingClientRect();

      const rawClickPosition = (e.clientX - rect.left) / rect.width;
      const clickPosition = Math.max(0, Math.min(1, rawClickPosition));
      const clipDuration = getClipDuration(clip);
      const seekTime = clickPosition * clipDuration;
      lastSeekTime = seekTime;
      setDragPosition((prev) => ({ ...prev, [clip.id]: seekTime }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();

      if (lastSeekTime !== undefined && lastSeekTime >= 0) {
        handleSeek(clip, lastSeekTime);
        setCurrentTime((prev) => ({ ...prev, [clip.id]: lastSeekTime }));
      }

      setIsDragging(null);
      setDragPosition((prev) => {
        const newState = { ...prev };
        delete newState[clip.id];
        return newState;
      });
      document.removeEventListener("mousemove", handleMouseMove, {
        capture: true,
      });
      document.removeEventListener("mouseup", handleMouseUp, { capture: true });
    };
    document.addEventListener("mousemove", handleMouseMove, { capture: true });
    document.addEventListener("mouseup", handleMouseUp, { capture: true });
  };

  const handleTrackClick = (clip: SunoClip, e: React.MouseEvent) => {
    if (isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = clickPosition * getClipDuration(clip);
    handleSeek(clip, seekTime);
  };

  const formatTime = (time: number): string => {
    if (!time || isNaN(time) || !isFinite(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getDisplayPosition = (clipId: string): number => {
    if (isDragging === clipId && dragPosition[clipId] !== undefined) {
      return dragPosition[clipId]!;
    }
    return currentTime[clipId] || 0;
  };

  const getProgressPercentage = (clipId: string, clip?: SunoClip): number => {
    const position = getDisplayPosition(clipId);
    const clipDuration = clip ? getClipDuration(clip) : duration[clipId];
    if (!clipDuration || !isFinite(clipDuration) || clipDuration <= 0) return 0;
    return Math.min(100, Math.max(0, (position / clipDuration) * 100));
  };

  const getClipDuration = (clip: SunoClip): number => {
    return duration[clip.id] || clip.metadata.duration || 0;
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
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <label
                    htmlFor="tags"
                    className="text-md font-medium text-foreground"
                  >
                    Style tags (optional)
                  </label>
                  <Textarea
                    id="tags"
                    placeholder="pop, electronic, guitar, upbeat..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="min-h-[80px] resize-none text-base mt-2 border border-red-200 rounded-lg p-4"
                    disabled={isGenerating}
                  />
                  <p className="text-sm text-muted-foreground">
                    Specify genres, instruments, and moods (e.g., "rock,
                    electric guitar, energetic")
                  </p>
                </div>
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

              {/* Status Display */}
              {isGenerating && generatedClips.length > 0 && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Status:{" "}
                    {generatedClips.map((clip) => clip.status).join(", ")}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {error}...
                  </p>
                </div>
              )}

              {/* Generated Songs */}
              {generatedClips.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  {isComplete && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        🎉 Your song
                        {generatedClips.length > 1 ? "s are" : " is"} ready!
                      </p>
                    </div>
                  )}

                  {generatedClips
                    .filter(
                      (clip) =>
                        (clip.status === "streaming" ||
                          clip.status === "complete") &&
                        clip.audio_url
                    )
                    .map((clip) => {
                      if (
                        clip.status === "complete" &&
                        !duration[clip.id] &&
                        audioElements[clip.id]
                      ) {
                        setTimeout(() => refreshAudioMetadata(clip), 100);
                      }

                      return (
                        <Card
                          key={clip.id}
                          className={`p-4 ${
                            clip.status === "complete"
                              ? "bg-gradient-to-r from-green-50 to-blue-50"
                              : "bg-gradient-to-r from-yellow-50 to-orange-50"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {clip.title || "Untitled Song"}
                                </h3>
                                {clip.status === "streaming" && (
                                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                                    Streaming
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {clip.metadata.duration
                                  ? `${Math.round(clip.metadata.duration)}s`
                                  : ""}
                              </div>
                            </div>

                            {clip.metadata.tags && (
                              <p className="text-sm text-muted-foreground">
                                Style: {clip.metadata.tags}
                              </p>
                            )}

                            {clip.status === "streaming" && (
                              <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                🎵 This song is still generating! You can start
                                listening, but full features (like scrubbing)
                                will be available once complete.
                              </p>
                            )}

                            {/* Audio Controls */}
                            <div className="space-y-3">
                              {/* Progress Bar - Only show for completed songs */}
                              {clip.status === "complete" &&
                                (duration[clip.id] ||
                                  clip.metadata.duration) && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium text-orange-700/80">
                                      <span>
                                        {formatTime(
                                          getDisplayPosition(clip.id)
                                        )}
                                      </span>
                                      <span>
                                        {formatTime(getClipDuration(clip))}
                                      </span>
                                    </div>

                                    {/* Custom Progress Bar */}
                                    <div className="relative">
                                      <div
                                        className="h-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full cursor-pointer border border-orange-200/50"
                                        data-clip-id={clip.id}
                                        onClick={(e) =>
                                          handleTrackClick(clip, e)
                                        }
                                      >
                                        <div
                                          className="h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full pointer-events-none"
                                          style={{
                                            width: `${getProgressPercentage(
                                              clip.id,
                                              clip
                                            )}%`,
                                          }}
                                        />
                                        {/* Scrub handle */}
                                        <div
                                          className={`absolute top-1/2 w-4 h-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg cursor-grab hover:from-orange-600 hover:to-red-700 select-none ${
                                            isDragging === clip.id
                                              ? "cursor-grabbing scale-110"
                                              : ""
                                          }`}
                                          style={{
                                            left: `${getProgressPercentage(
                                              clip.id,
                                              clip
                                            )}%`,
                                          }}
                                          onMouseDown={(e) =>
                                            handleMouseDown(clip, e)
                                          }
                                          onTouchStart={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDragging(clip.id);

                                            const progressBar =
                                              document.querySelector(
                                                `[data-clip-id="${clip.id}"]`
                                              ) as HTMLElement;

                                            if (
                                              !progressBar ||
                                              !getClipDuration(clip)
                                            )
                                              return;

                                            const handleTouchMove = (
                                              e: TouchEvent
                                            ) => {
                                              e.preventDefault();
                                              if (e.touches[0]) {
                                                const rect =
                                                  progressBar.getBoundingClientRect();
                                                const clickPosition = Math.max(
                                                  0,
                                                  Math.min(
                                                    1,
                                                    (e.touches[0].clientX -
                                                      rect.left) /
                                                      rect.width
                                                  )
                                                );
                                                const seekTime =
                                                  clickPosition *
                                                  getClipDuration(clip);
                                                setDragPosition((prev) => ({
                                                  ...prev,
                                                  [clip.id]: seekTime,
                                                }));
                                              }
                                            };

                                            const handleTouchEnd = (
                                              e: TouchEvent
                                            ) => {
                                              e.preventDefault();
                                              let finalSeekTime =
                                                dragPosition[clip.id];

                                              if (e.changedTouches[0]) {
                                                const rect =
                                                  progressBar.getBoundingClientRect();
                                                const finalClickPosition =
                                                  Math.max(
                                                    0,
                                                    Math.min(
                                                      1,
                                                      (e.changedTouches[0]
                                                        .clientX -
                                                        rect.left) /
                                                        rect.width
                                                    )
                                                  );
                                                finalSeekTime =
                                                  finalClickPosition *
                                                  getClipDuration(clip);
                                              }

                                              if (finalSeekTime !== undefined) {
                                                handleSeek(clip, finalSeekTime);
                                                setCurrentTime((prev) => ({
                                                  ...prev,
                                                  [clip.id]: finalSeekTime,
                                                }));
                                              }

                                              setIsDragging(null);
                                              setDragPosition((prev) => {
                                                const newState = { ...prev };
                                                delete newState[clip.id];
                                                return newState;
                                              });

                                              document.removeEventListener(
                                                "touchmove",
                                                handleTouchMove,
                                                { capture: true }
                                              );
                                              document.removeEventListener(
                                                "touchend",
                                                handleTouchEnd,
                                                { capture: true }
                                              );
                                            };

                                            document.addEventListener(
                                              "touchmove",
                                              handleTouchMove,
                                              {
                                                passive: false,
                                                capture: true,
                                              }
                                            );
                                            document.addEventListener(
                                              "touchend",
                                              handleTouchEnd,
                                              {
                                                capture: true,
                                              }
                                            );
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Control Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => togglePlayPause(clip)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  {isPlaying[clip.id] ? (
                                    <>
                                      <Pause className="w-4 h-4 mr-2" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      Play
                                    </>
                                  )}
                                </Button>

                                <Button
                                  onClick={() => handleDownload(clip)}
                                  variant="secondary"
                                  size="sm"
                                  className="flex-1"
                                  disabled={
                                    isDownloading[clip.id] ||
                                    clip.status === "streaming"
                                  }
                                >
                                  {isDownloading[clip.id] ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin mr-2" />
                                      Downloading...
                                    </>
                                  ) : clip.status === "streaming" ? (
                                    <>
                                      <Download className="w-4 h-4 mr-2 opacity-50" />
                                      Available when complete
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
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
