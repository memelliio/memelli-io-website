import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    let audioBody: ArrayBuffer;
    let contentType = "audio/webm";

    // useVoice sends FormData with an 'audio' field; handle both FormData and raw body
    const reqContentType = request.headers.get("content-type") || "";
    if (reqContentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audioFile = formData.get("audio");
      if (!audioFile || !(audioFile instanceof Blob)) {
        return NextResponse.json(
          { error: "Audio file is required in 'audio' field" },
          { status: 400 }
        );
      }
      audioBody = await audioFile.arrayBuffer();
      contentType = audioFile.type || "audio/webm";
    } else {
      audioBody = await request.arrayBuffer();
      contentType = reqContentType || "audio/webm";
    }

    if (!audioBody || audioBody.byteLength === 0) {
      return NextResponse.json(
        { error: "Audio body is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": contentType,
        },
        body: audioBody,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Deepgram STT request failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    const alternative =
      data?.results?.channels?.[0]?.alternatives?.[0];
    const text = alternative?.transcript ?? "";
    const confidence = alternative?.confidence ?? 0;

    return NextResponse.json({ text, confidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "STT proxy error", details: message },
      { status: 500 }
    );
  }
}
