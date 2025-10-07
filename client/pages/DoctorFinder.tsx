import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Doctor {
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  email: string;
  phone: string;
  lat?: number;
  long?: number;
}

export default function DoctorFinder() {
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; long: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Doctor[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, long: pos.coords.longitude }),
      () => setCoords(null),
    );
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/find-doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, coords }),
      });
      const data = await res.json();
      setResults(data.doctors ?? []);
    } catch (e) {
      toast.error("Unable to search doctors");
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = async (doctor: Doctor) => {
    if (!query.trim()) {
      toast.error("Please describe your symptoms first");
      return;
    }

    toast.info("Generating personalized email...");
    
    try {
      const emailPrompt = `Write a professional medical consultation email to Dr. ${doctor.name}, a ${doctor.specialization} with ${doctor.experience} years of experience.

Patient Information:
- Health concern: ${query}
- Patient location: Latitude ${coords?.lat || 'Not available'}, Longitude ${coords?.long || 'Not available'}

Create a complete professional email with:
1. Appropriate subject line
2. Formal greeting
3. Brief introduction of the patient
4. Clear description of symptoms/concerns
5. Location information for reference
6. Request for consultation/appointment
7. Professional closing

Write the complete email ready to send, including subject line at the top.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: emailPrompt,
          isNutrition: false // This ensures we get a complete response but not nutrition-length
        }),
      });
      
      const data = await res.json();
      let emailContent = data.reply || "";
      
      // If the response doesn't contain a clear subject line, create a structured email
      let subject = "Medical Consultation Request";
      let body = emailContent;
      
      // Try to extract subject if it exists
      const subjectMatch = emailContent.match(/Subject:\s*(.+?)(?:\n|$)/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        body = emailContent.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();
      }
      
      // If no proper email structure, create a professional template
      if (!body.includes("Dear Dr.") && !body.includes("Hello Dr.")) {
        subject = `Medical Consultation Request - ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`;
        body = `Dear Dr. ${doctor.name},

I hope this email finds you well. I am writing to request a medical consultation regarding some health concerns I have been experiencing.

Symptoms/Health Concern:
${query}

Patient Location Information:
Latitude: ${coords?.lat || 'Not available'}
Longitude: ${coords?.long || 'Not available'}

Given your expertise in ${doctor.specialization} and your ${doctor.experience} years of experience, I believe you would be the right professional to help me with this matter.

I would greatly appreciate the opportunity to schedule a consultation at your earliest convenience. Please let me know your availability and any additional information you might need from me prior to the appointment.

Thank you for your time and consideration. I look forward to hearing from you soon.

Best regards,
[Your Name]
[Your Phone Number]`;
      }
      
      // Create mailto link with generated content
      const mailtoLink = `mailto:${encodeURIComponent(doctor.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      toast.success("Professional email generated! Your email client should open now.");
      
    } catch (e) {
      console.error("Email generation failed:", e);
      // Fallback to professional template
      const fallbackSubject = `Medical Consultation Request - ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`;
      const fallbackBody = `Dear Dr. ${doctor.name},

I hope this email finds you well. I am writing to request a medical consultation regarding some health concerns I have been experiencing.

Symptoms/Health Concern:
${query}

Patient Location Information:
Latitude: ${coords?.lat || 'Not available'}
Longitude: ${coords?.long || 'Not available'}

Given your expertise in ${doctor.specialization} and your ${doctor.experience} years of experience, I believe you would be the right professional to help me with this matter.

I would greatly appreciate the opportunity to schedule a consultation at your earliest convenience. Please let me know your availability and any additional information you might need from me prior to the appointment.

Thank you for your time and consideration. I look forward to hearing from you soon.

Best regards,
[Your Name]
[Your Phone Number]`;

      const mailtoLink = `mailto:${encodeURIComponent(doctor.email)}?subject=${encodeURIComponent(fallbackSubject)}&body=${encodeURIComponent(fallbackBody)}`;
      window.location.href = mailtoLink;
      
      toast.success("Professional email template ready! Your email client should open now.");
    }
  };

  const top = results[0];

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Find a Doctor</h1>
        <p className="mt-2 text-muted-foreground">Groq-powered recommendations ranked by relevance, proximity, rating and experience.</p>
      </header>

      <div className="rounded-2xl p-6 bg-card border border-border">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your symptom (e.g., chest discomfort, fever)"
            className="flex-1 rounded-full bg-input px-4 py-3 outline-none placeholder:text-muted-foreground text-foreground"
          />
          <button
            onClick={search}
            disabled={loading}
            className="ml-3 rounded-full bg-gradient-to-r from-emerald-300 to-fuchsia-500 px-6 py-3 font-semibold text-slate-900 disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {coords && (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={14} /> Using your location for proximity ranking
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((d, i) => (
              <motion.div
                key={d.email}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-2xl p-4 bg-card border border-border hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">{d.name}</h3>
                    <p className="text-sm text-muted-foreground">{d.specialization} • {d.experience} yrs</p>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-500 text-lg">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>{idx < Math.round(d.rating) ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">{d.rating.toFixed(1)}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 text-sm">
                  <button 
                    onClick={() => generateEmail(d)}
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 hover:underline"
                  >
                    <Mail size={14} /> Email
                  </button>
                  <a href={`tel:${d.phone}`} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 hover:underline"><Phone size={14} /> {d.phone}</a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl p-4 bg-card border border-border">
          <h3 className="font-semibold text-card-foreground">Top Result</h3>
          {top ? (
            <div className="mt-3">
              <h4 className="font-semibold text-card-foreground">{top.name}</h4>
              <p className="text-sm text-muted-foreground">{top.specialization} • {top.experience} yrs</p>
              <div className="mt-3 flex gap-3">
                <button 
                  onClick={() => generateEmail(top)}
                  className="px-3 py-2 rounded-full bg-emerald-300/80 text-slate-900 hover:bg-emerald-400/80 transition-colors"
                >
                  Email
                </button>
                <a href={`tel:${top.phone}`} className="px-3 py-2 rounded-full ring-1 ring-border text-foreground hover:bg-accent transition-colors">Call</a>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-muted-foreground">No results yet. Try searching for symptoms or conditions.</p>
          )}
        </aside>
      </div>

      {top && (
        <div className="mt-6">
          <button 
            onClick={() => generateEmail(top)}
            className="inline-flex items-center gap-2 rounded-full bg-muted px-5 py-3 ring-1 ring-border hover:bg-accent text-foreground transition-colors"
          >
            <Mail size={16} /> Contact Doctor Now
          </button>
        </div>
      )}
    </div>
  );
}
