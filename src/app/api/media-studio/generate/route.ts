import { NextRequest, NextResponse } from 'next/server';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

interface GenerateRequestBody {
  prompt: string;
  style?: string;
  size?: '1:1' | '16:9' | '9:16' | '4:3';
  quality?: 'standard' | 'hd';
}

interface DalleResponse {
  data: { url: string }[];
}

/* ================================================================= */
/*  Size mapping                                                       */
/* ================================================================= */

const SIZE_MAP: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
  '4:3': '1024x1024', // DALL-E 3 does not support 4:3 natively; fall back to square
};

/* ================================================================= */
/*  Style → prompt modifier                                            */
/* ================================================================= */

const STYLE_MODIFIER: Record<string, string> = {
  photorealistic: 'photorealistic, ultra-detailed photography, 8K resolution, natural lighting',
  'digital-art': 'vibrant digital painting, digital art, concept art, sharp details',
  illustration: 'hand-crafted illustration, illustrative style, clean linework',
  minimalist: 'minimalist design, clean composition, negative space, simple forms',
  cinematic: 'cinematic, film grain, anamorphic lens, dramatic lighting, movie still',
  '3d-render': 'photorealistic 3D render, ray tracing, octane render, studio lighting',
  watercolor: 'watercolor painting, soft wet-on-wet pigment, artistic brushstrokes',
  abstract: 'abstract expressionism, non-representational, bold shapes and colors',
};

/* ================================================================= */
/*  Placeholder fallback                                               */
/* ================================================================= */

const PLACEHOLDER_URLS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&q=80',
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1024&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1024&q=80',
  'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=1024&q=80',
];

function placeholderResponse() {
  const url = PLACEHOLDER_URLS[Math.floor(Math.random() * PLACEHOLDER_URLS.length)];
  return NextResponse.json(
    {
      images: [{ url, id: crypto.randomUUID() }],
      fallback: true,
      message: 'OPENAI_API_KEY is not configured. Returning placeholder image.',
    },
    { status: 200 },
  );
}

/* ================================================================= */
/*  Route handler                                                      */
/* ================================================================= */

export async function POST(request: NextRequest) {
  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, style, size = '1:1', quality = 'hd' } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Graceful fallback when key is not configured
  if (!apiKey) {
    return placeholderResponse();
  }

  // Build the enriched prompt
  const styleModifier = style ? (STYLE_MODIFIER[style] ?? '') : '';
  const enrichedPrompt = styleModifier
    ? `${prompt.trim()}. Style: ${styleModifier}`
    : prompt.trim();

  const dalleSize = SIZE_MAP[size] ?? '1024x1024';
  const dalleQuality: 'standard' | 'hd' = quality === 'hd' ? 'hd' : 'standard';

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enrichedPrompt,
        n: 1,
        size: dalleSize,
        quality: dalleQuality,
        response_format: 'url',
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error('[media-studio/generate] OpenAI error:', openaiRes.status, errorText);

      // Surface a safe error message without leaking the raw API error
      return NextResponse.json(
        { error: 'Image generation failed. Check your API key and quota.', status: openaiRes.status },
        { status: 502 },
      );
    }

    const dalleData = (await openaiRes.json()) as DalleResponse;
    const images = (dalleData.data ?? []).map((item) => ({
      url: item.url,
      id: crypto.randomUUID(),
    }));

    return NextResponse.json({ images }, { status: 200 });
  } catch (err) {
    console.error('[media-studio/generate] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
