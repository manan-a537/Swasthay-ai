import type { RequestHandler } from "express";
import { loadDoctors, Doctor } from "../services/excel";

function distanceKm(a: { lat?: number; long?: number }, b: { lat?: number; long?: number }) {
  if (!a.lat || !a.long || !b.lat || !b.long) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.long - a.long) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function heuristicScore(query: string, d: Doctor, user?: { lat?: number; long?: number }) {
  const q = query.toLowerCase();
  const spec = d.specialization.toLowerCase();
  let score = 0;
  // specialization relevance
  if (q.includes("heart") || q.includes("chest")) if (spec.includes("cardio")) score += 5;
  if (q.includes("skin") || q.includes("rash")) if (spec.includes("derma")) score += 5;
  if (q.includes("fever") || q.includes("cold") || q.includes("cough")) if (spec.includes("general") || spec.includes("physician")) score += 4;
  if (q.includes("diabet")) if (spec.includes("endocr")) score += 5;
  if (q.includes("pregnan") || q.includes("gyn")) if (spec.includes("gyn")) score += 5;

  // rating and experience
  score += d.rating * 1.5 + d.experience * 0.2;

  // proximity
  if (user) {
    const dist = distanceKm({ lat: user.lat, long: user.long }, d);
    if (isFinite(dist)) score += Math.max(0, 10 - Math.min(dist, 10));
  }
  return score;
}

export const handleFindDoctors: RequestHandler = async (req, res) => {
  try {
    const { query, coords } = req.body as { query: string; coords?: { lat: number; long: number } };
    const doctors = loadDoctors();

    const ranked = doctors
      .map((d) => ({ d, score: heuristicScore(query ?? "", d, coords) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.d);

    res.json({ doctors: ranked });
  } catch (e: any) {
    res.status(500).json({ error: "finder_failed", detail: e?.message });
  }
};
