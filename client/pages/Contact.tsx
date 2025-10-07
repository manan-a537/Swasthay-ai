export default function Contact() {
  return (
    <section className="rounded-2xl border border-border bg-card backdrop-blur-xl p-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-card-foreground">Contact Us</h1>

      <div className="mt-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground">Get in Touch</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We're here to help you with any questions or concerns about SwasthyaAI.</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <a href="mailto:mananarora537@gmail.com" className="text-primary hover:underline">
                    mananarora537@gmail.com
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Emergency:</span>
                  <span>Use the Emergency button on the main page</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/doctors"
                className="block p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
              >
                <div className="font-medium text-card-foreground">Find a Doctor</div>
                <div className="text-sm text-muted-foreground">Get connected with qualified medical professionals</div>
              </a>

              <a
                href="/nutrition"
                className="block p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
              >
                <div className="font-medium text-card-foreground">Nutrition Planning</div>
                <div className="text-sm text-muted-foreground">Get personalized meal plans and dietary advice</div>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-card-foreground mb-2">Support Hours</h3>
          <p className="text-sm text-muted-foreground">Our AI assistant is available 24/7. For human support, we typically respond within 24 hours.</p>
        </div>
      </div>
    </section>
  );
}
