import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { clipIds } = await request.json();

    if (!clipIds || !Array.isArray(clipIds) || clipIds.length === 0) {
      return NextResponse.json(
        { error: "Clip IDs are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      console.error("SUNO_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Check status using Suno HackMIT API
    const statusResponse = await fetch(
      `https://studio-api.prod.suno.com/api/v2/external/hackmit/clips?ids=${clipIds.join(
        ","
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error("Suno API status check error:", errorText);
      return NextResponse.json(
        { error: "Failed to check generation status" },
        { status: statusResponse.status }
      );
    }

    const clips = await statusResponse.json();

    return NextResponse.json({
      success: true,
      clips: clips.map((clip: any) => ({
        id: clip.id,
        status: clip.status,
        title: clip.title,
        audio_url: clip.audio_url,
        video_url: clip.video_url,
        image_url: clip.image_url,
        created_at: clip.created_at,
        metadata: {
          duration: clip.metadata?.duration,
          tags: clip.metadata?.tags,
          prompt: clip.metadata?.prompt,
          error_type: clip.metadata?.error_type,
          error_message: clip.metadata?.error_message,
        },
      })),
    });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
