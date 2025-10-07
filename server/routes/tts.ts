import type { RequestHandler } from "express";

export const handleTTS: RequestHandler = async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    console.log('[TTS] request text length', text?.length);
    if (!text) return res.status(400).json({ error: "text_required" });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    console.log('[TTS] env voiceId present?', !!voiceId, 'apiKey present?', !!apiKey);
    if (!apiKey || !voiceId) return res.json({ audioBase64: null, debug: 'no-credentials' });

    const endpoints = [
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    ];
    let lastErr: string | null = null;
    for (const url of endpoints) {
      try {
        console.log('[TTS] trying endpoint', url);
        const r = await fetch(url, {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.5 } }),
        });
        console.log('[TTS] response status', r.status);
        if (!r.ok) {
          lastErr = await r.text();
          console.warn('[TTS] non-ok response', lastErr);
          continue;
        }
        const arrayBuffer = await r.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        console.log('[TTS] received audio bytes', buf.length);
        return res.json({ audioBase64: buf.toString("base64") });
      } catch (err: any) {
        lastErr = String(err?.message ?? err);
        console.error('[TTS] fetch error', lastErr);
      }
    }
    console.error('[TTS] all endpoints failed', lastErr);
    return res.status(500).json({ error: "tts_failed", detail: lastErr });
  } catch (e: any) {
    console.error('[TTS] unexpected', e);
    res.status(500).json({ error: "tts_failed", detail: e?.message });
  }
};
