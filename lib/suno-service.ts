// Types for Suno HackMIT API responses
export interface SunoClip {
  id: string;
  status: "submitted" | "queued" | "streaming" | "complete" | "error";
  title: string;
  audio_url: string | null;
  video_url: string | null;
  image_url: string | null;
  created_at: string;
  metadata: {
    duration?: number;
    tags?: string;
    prompt?: string;
    error_type?: string;
    error_message?: string;
  };
}

export interface GenerationRequest {
  prompt: string;
  tags?: string;
  makeInstrumental?: boolean;
}

export interface GenerationResponse {
  success: boolean;
  clips?: { id: string; status: string; created_at: string }[];
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  clips?: SunoClip[];
  error?: string;
}

// Service functions for interacting with our API routes
export class SunoService {
  private static baseUrl =
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : "";

  /**
   * Start generating a song with the given prompt
   */
  static async generateSong(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate-music`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate song");
      }

      return await response.json();
    } catch (error) {
      console.error("Generate song error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Check the status of ongoing generation(s)
   */
  static async checkStatus(clipIds: string[]): Promise<StatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/check-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clipIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check status");
      }

      return await response.json();
    } catch (error) {
      console.error("Check status error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Poll for completion with automatic retry logic
   * Returns a promise that resolves when at least one clip is complete
   */
  static async pollForCompletion(
    clipIds: string[],
    maxAttempts: number = 60, // 5 minutes with 5-second intervals
    interval: number = 5000 // 5 seconds
  ): Promise<SunoClip[]> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;

          const statusResponse = await this.checkStatus(clipIds);

          if (!statusResponse.success || !statusResponse.clips) {
            if (attempts >= maxAttempts) {
              reject(new Error("Max polling attempts reached"));
              return;
            }

            setTimeout(poll, interval);
            return;
          }

          const clips = statusResponse.clips;
          const completedClips = clips.filter(
            (clip) => clip.status === "complete" && clip.audio_url
          );
          const errorClips = clips.filter((clip) => clip.status === "error");

          // If we have errors on all clips, reject
          if (errorClips.length === clips.length) {
            reject(
              new Error(
                `All clips failed: ${errorClips
                  .map((c) => c.metadata.error_message)
                  .join(", ")}`
              )
            );
            return;
          }

          // If at least one clip is complete, resolve with all clips
          if (completedClips.length > 0) {
            resolve(clips);
            return;
          }

          // If we've exceeded max attempts, reject
          if (attempts >= maxAttempts) {
            reject(new Error("Generation timed out - no clips completed"));
            return;
          }

          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
            return;
          }

          // Retry on error
          setTimeout(poll, interval);
        }
      };

      poll();
    });
  }

  /**
   * Complete end-to-end generation flow
   */
  static async generateAndWaitForCompletion(
    request: GenerationRequest,
    onProgress?: (clips: SunoClip[], progress: number) => void
  ): Promise<SunoClip[]> {
    // Step 1: Start generation
    const generationResponse = await this.generateSong(request);

    if (!generationResponse.success || !generationResponse.clips) {
      throw new Error(generationResponse.error || "Failed to start generation");
    }

    const clipIds = generationResponse.clips.map((clip) => clip.id);

    // Step 2: Poll for completion with progress updates
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    const interval = 5000; // 5 seconds

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const progress = Math.min((attempts / maxAttempts) * 100, 95); // Cap at 95% until complete

          const statusResponse = await this.checkStatus(clipIds);

          if (!statusResponse.success || !statusResponse.clips) {
            if (attempts >= maxAttempts) {
              reject(new Error("Max polling attempts reached"));
              return;
            }

            setTimeout(poll, interval);
            return;
          }

          const clips = statusResponse.clips;

          // Call progress callback if provided
          if (onProgress) {
            onProgress(clips, progress);
          }

          const completedClips = clips.filter(
            (clip) => clip.status === "complete" && clip.audio_url
          );
          const errorClips = clips.filter((clip) => clip.status === "error");

          // If we have errors on all clips, reject
          if (errorClips.length === clips.length) {
            reject(
              new Error(
                `All clips failed: ${errorClips
                  .map((c) => c.metadata.error_message)
                  .join(", ")}`
              )
            );
            return;
          }

          // If at least one clip is complete, resolve with all clips
          if (completedClips.length > 0) {
            if (onProgress) {
              onProgress(clips, 100);
            }
            resolve(clips);
            return;
          }

          // If we've exceeded max attempts, reject
          if (attempts >= maxAttempts) {
            reject(new Error("Generation timed out - no clips completed"));
            return;
          }

          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
            return;
          }

          // Retry on error
          setTimeout(poll, interval);
        }
      };

      poll();
    });
  }
}
