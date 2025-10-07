import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export interface Doctor {
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  email: string;
  phone: string;
  lat?: number;
  long?: number;
}

export function loadDoctors(): Doctor[] {
  const dataDir = path.resolve(process.cwd(), "data");
  const xlsxPath = path.join(dataDir, "doctors.xlsx");
  const samplePath = path.join(dataDir, "doctors.sample.json");

  try {
    if (fs.existsSync(xlsxPath)) {
      const wb = XLSX.read(fs.readFileSync(xlsxPath));
      const sheetName = wb.SheetNames[0];
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      return rows.map((r) => ({
        name: String(r.Name ?? r.name ?? ""),
        specialization: String(r.Specialization ?? r.specialization ?? ""),
        experience: Number(r.Experience ?? r.experience ?? 0),
        rating: Number(r.Rating ?? r.rating ?? 0),
        email: String(r.Email ?? r.email ?? ""),
        phone: String(r.Phone ?? r.phone ?? ""),
        lat: r.Lat ?? r.lat ? Number(r.Lat ?? r.lat) : undefined,
        long: r.Long ?? r.long ? Number(r.Long ?? r.long) : undefined,
      }));
    }
  } catch (e) {
    // Fall through to sample
  }

  if (fs.existsSync(samplePath)) {
    const raw = fs.readFileSync(samplePath, "utf-8");
    return JSON.parse(raw);
  }

  return [];
}
