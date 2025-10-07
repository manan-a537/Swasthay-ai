import type { RequestHandler } from "express";

const SYSTEM_PROMPT =
  "You are a helpful medical assistant with image analysis capabilities. When analyzing medical images, provide concise, actionable guidance. Identify visible conditions, symptoms, or concerns. Always recommend consulting healthcare professionals for proper diagnosis. For voice chat, provide complete but concise responses (20-30 words). For text-only queries, give complete helpful answers in 25-35 words. Do NOT provide definitive diagnoses - only observations and recommendations.";

const NUTRITION_SYSTEM_PROMPT =
  "You are a nutrition expert specializing in Indian diets and meal planning. Provide comprehensive, detailed meal plans with specific foods, portions, timing, and nutritional benefits. Include breakfast, lunch, dinner, and snacks. Consider Indian dietary preferences, regional foods, and health goals. Provide complete detailed responses with explanations.";

function fallbackReply(message: string, isNutrition = false) {
  const m = (message || "").toLowerCase();

  if (isNutrition) {
    return "I'm unable to generate a detailed nutrition plan right now. Please try again later or consult with a registered dietitian for personalized meal planning based on your specific health needs and dietary preferences.";
  }

  // Create complete but concise replies for medical queries
  if (m.includes("fever") || m.includes("temperature")) {
    return "Rest well, stay hydrated, and monitor your temperature. If fever persists over 48 hours or worsens, please consult a doctor immediately.";
  } else if (m.includes("pain") || m.includes("ache") || m.includes("chest")) {
    return "Chest pain can be serious. Stop any physical activity immediately and seek emergency medical care if pain is severe or persistent.";
  } else if (m.includes("rash") || m.includes("skin") || m.includes("itch")) {
    return "Keep the affected area clean and dry. Avoid scratching or irritants. See a dermatologist if the rash spreads or shows signs of infection.";
  } else {
    return "I need more specific details about your symptoms. Meanwhile, rest well, stay hydrated, and consult a healthcare provider if symptoms persist or worsen.";
  }
}

export const handleChat: RequestHandler = async (req, res) => {
  try {
    const { message, image, isNutrition } = req.body as { message: string; image?: string; isNutrition?: boolean };
    console.log('[CHAT] Request - message:', !!message, 'image:', !!image, 'isNutrition:', !!isNutrition);

    if (!message && !image) {
      return res.status(400).json({ error: "message or image required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Graceful fallback
      return res.json({ reply: fallbackReply(message, isNutrition) });
    }

    const systemPrompt = isNutrition ? NUTRITION_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (image && message) {
      // For image analysis, create a proper vision message
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Please analyze this medical image and respond to: ${message}`
          },
          {
            type: "image_url",
            image_url: {
              url: image
            }
          }
        ]
      });
    } else if (message) {
      // Text-only message
      messages.push({ role: "user", content: message });
    } else {
      return res.status(400).json({ error: "message required when sending image" });
    }

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: image ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.2,
        max_tokens: isNutrition ? 800 : (image ? 250 : 200), // More tokens for nutrition, moderate for images, reasonable for voice chat
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('[CHAT] API Error:', r.status, text);
      // fallback to local reply rather than an error
      return res.json({ reply: fallbackReply(message, isNutrition) });
    }
    const data: any = await r.json();
    let reply = data.choices?.[0]?.message?.content ?? fallbackReply(message, isNutrition);

    // For nutrition, return full response. For voice chat, ensure complete but concise responses
    if (!isNutrition) {
      // For voice chat, ensure responses are complete but not too long (30-40 words max)
      const words = reply.split(/\s+/).filter(Boolean);
      if (words.length > 40) {
        // Find a good stopping point (sentence end) within reasonable length
        const sentences = reply.split(/[.!?]+/).filter(Boolean);
        let result = sentences[0];
        for (let i = 1; i < sentences.length; i++) {
          const candidate = result + '. ' + sentences[i];
          if (candidate.split(/\s+/).length <= 40) {
            result = candidate;
          } else {
            break;
          }
        }
        reply = result + (result.endsWith('.') ? '' : '.');
      }
    }

    res.json({ reply });
  } catch (e: any) {
    res.status(500).json({ reply: fallbackReply(req.body?.message || "", req.body?.isNutrition) });
  }
};
