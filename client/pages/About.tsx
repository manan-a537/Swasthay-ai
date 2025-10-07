export default function About() {
  return (
    <section className="rounded-2xl border border-border bg-card backdrop-blur-xl p-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-card-foreground">About SwasthyaAI</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>SwasthyaAI is your personal AI health assistant designed specifically for Indian users. We provide quick medical guidance, help you find qualified doctors, and create personalized nutrition plans.</p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-card-foreground">Our Mission</h2>
            <p>To make healthcare accessible and understandable for everyone through AI-powered assistance, bridging the gap between patients and medical professionals.</p>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-card-foreground">Key Features</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>AI-powered symptom analysis</li>
              <li>Medical image analysis</li>
              <li>Doctor finder with location-based recommendations</li>
              <li>Personalized nutrition planning</li>
              <li>Emergency consultation services</li>
              <li>Voice-to-voice conversations</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm"><strong>Disclaimer:</strong> SwasthyaAI provides informational guidance only. Always consult qualified healthcare professionals for medical diagnosis and treatment.</p>
        </div>
      </div>
    </section>
  );
}
