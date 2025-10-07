import { useState } from "react";
import { toast } from "sonner";

export default function Nutritionist() {
  const [form, setForm] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    preference: "veg",
    goal: "general",
    allergies: "",
    conditions: "",
  });
  const [result, setResult] = useState<string | null>(null);

  const handleChange = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setResult(null);
    try {
      const nutritionQuery = `Create a detailed Indian meal plan for: Age ${form.age}, Gender ${form.gender}, Weight ${form.weight}kg, Height ${form.height}cm, Dietary preference: ${form.preference}, Goal: ${form.goal}, Allergies/Conditions: ${form.allergies || 'None'}. Include specific foods, portions, timing, and nutritional benefits for breakfast, lunch, dinner, and snacks.`;
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: nutritionQuery,
          isNutrition: true 
        }),
      });
      const data = await res.json();
      setResult(data.reply || "Unable to generate plan right now.");
    } catch (e) {
      toast.error("Unable to generate plan");
    }
  };

  const downloadPDF = () => {
    // simple text to blob download as placeholder
    if (!result) return toast.error("No plan to save");
    const blob = new Blob([result], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meal-plan.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 bg-gradient-to-r from-primary/10 to-secondary/8 border border-border">
        <h1 className="text-3xl font-bold text-foreground">AI Meal & Nutritionist</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">Personalized Indian meal plans and nutrition advice. Fill your details and get a plan.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-card border border-border">
          <label className="block text-sm text-card-foreground">Age</label>
          <input value={form.age} onChange={(e) => handleChange("age", e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-input ring-1 ring-border text-foreground" />

          <label className="block text-sm mt-3 text-card-foreground">Gender</label>
          <select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-input ring-1 ring-border text-foreground">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm text-card-foreground">Weight (kg)</label>
              <input value={form.weight} onChange={(e) => handleChange("weight", e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-input ring-1 ring-border text-foreground" />
            </div>
            <div>
              <label className="block text-sm text-card-foreground">Height (cm)</label>
              <input value={form.height} onChange={(e) => handleChange("height", e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-input ring-1 ring-border text-foreground" />
            </div>
          </div>

          <label className="block text-sm mt-3 text-card-foreground">Dietary Preference</label>
          <select value={form.preference} onChange={(e) => handleChange("preference", e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-input ring-1 ring-border text-foreground">
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>

          <label className="block text-sm mt-3 text-card-foreground">Health Goals</label>
          <select value={form.goal} onChange={(e) => handleChange("goal", e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-input ring-1 ring-border text-foreground">
            <option value="general">General fitness</option>
            <option value="weight-loss">Weight loss</option>
            <option value="muscle-gain">Muscle gain</option>
            <option value="disease-specific">Disease-specific</option>
          </select>

          <label className="block text-sm mt-3 text-card-foreground">Allergies / Conditions</label>
          <textarea value={form.allergies} onChange={(e) => handleChange("allergies", e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-input ring-1 ring-border text-foreground" rows={3} />

          <div className="mt-4 flex gap-3">
            <button onClick={submit} className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-300 to-fuchsia-500 text-slate-900 font-semibold">Generate Plan</button>
            <button onClick={downloadPDF} className="px-4 py-2 rounded-full ring-1 ring-border text-foreground hover:bg-accent transition-colors">Save as PDF</button>
          </div>
        </div>

        <div className="rounded-2xl p-6 bg-card border border-border">
          <h3 className="font-semibold text-card-foreground">Meal Plan</h3>
          {result ? (
            <pre className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{result}</pre>
          ) : (
            <p className="mt-3 text-muted-foreground">Fill the form and generate a personalized meal plan. Use Listen button on the generated plan to hear it aloud.</p>
          )}
        </div>
      </div>
    </div>
  );
}