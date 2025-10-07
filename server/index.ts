import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleChat } from "./routes/chat";
import { handleFindDoctors } from "./routes/doctor-finder";
import { handleEmergencyCall } from "./routes/emergency";
import { handleTTS } from "./routes/tts";
import { handleOCR } from "./routes/ocr";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // AI routes
  app.post("/api/chat", handleChat);
  app.post("/api/find-doctors", handleFindDoctors);
  app.post("/api/emergency-call", handleEmergencyCall);
  app.post("/api/tts", handleTTS);
  app.post("/api/ocr", handleOCR);

  // Log which credentials are present (do NOT print secrets)
  try {
    const tessPath = path.resolve(__dirname, "../public/tessdata/eng.traineddata");
    console.log("[ENV] GROQ_API_KEY:", !!process.env.GROQ_API_KEY);
    console.log("[ENV] ELEVENLABS_API_KEY:", !!process.env.ELEVENLABS_API_KEY, "ELEVENLABS_VOICE_ID:", !!process.env.ELEVENLABS_VOICE_ID);
    console.log(
      "[ENV] TWILIO:",
      !!process.env.TWILIO_ACCOUNT_SID,
      !!process.env.TWILIO_AUTH_TOKEN,
      !!process.env.TWILIO_FROM_NUMBER,
    );
    console.log("[ENV] PING_MESSAGE:", !!process.env.PING_MESSAGE);
    console.log("[ENV] tessdata eng.traineddata exists:", fs.existsSync(tessPath), tessPath);
  } catch (e) {
    console.warn("[ENV] failed to check env or tessdata", e);
  }

  return app;
}
