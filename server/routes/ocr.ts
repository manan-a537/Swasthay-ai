import type { RequestHandler } from "express";
import { createWorker, Worker } from "tesseract.js";
import path from "path";

// Use `any` here to avoid fragile tesseract.js type mismatches across versions
let _worker: any | null = null;
let _initPromise: Promise<any> | null = null;

async function getWorker() {
  if (_worker) return _worker;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    // Point langPath to the public tessdata folder so tesseract can load traineddata
  const langPath = path.resolve(__dirname, "../../public/tessdata");
  // In some environments tesseract.js reads TESSDATA_PREFIX to locate traineddata
  process.env.TESSDATA_PREFIX = langPath + path.sep;
  const w: any = createWorker();
  await w.load();
  await w.loadLanguage("eng");
  await w.initialize("eng");
  _worker = w;
    _initPromise = null;
    return w;
  })();
  return _initPromise;
}

export const handleOCR: RequestHandler = async (req, res) => {
  try {
    const { image } = req.body as { image?: string };
    if (!image) return res.status(400).json({ error: "image_required" });

    // image expected as data URL: data:image/png;base64,...
    const match = /^data:(image\/\w+);base64,(.+)$/.exec(image);
    if (!match) return res.status(400).json({ error: "invalid_image_data" });
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");

    const worker = await getWorker();
    const { data } = await worker.recognize(buffer);

    const text = data?.text?.trim() ?? "";
    res.json({ text });
  } catch (e: any) {
    console.error("[OCR] error", e);
    res.status(500).json({ error: "ocr_failed", detail: e?.message });
  }
};
