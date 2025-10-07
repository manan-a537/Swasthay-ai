import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Image as ImageIcon, Send, Volume2 } from "lucide-react";
import { toast } from "sonner";
import Lottie from "lottie-react";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  image?: string; // base64
}

const EMERGENCY_TERMS = [
  "chest pain",
  "severe bleeding",
  "unconscious",
  "can't breathe",
  "cant breathe",
  "heart attack",
  "stroke",
];

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [imageB64, setImageB64] = useState<string | undefined>();
  const [wasVoiceInput, setWasVoiceInput] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const voiceInputRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Better scroll management
  useEffect(() => {
    if (shouldAutoScroll && endRef.current) {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, shouldAutoScroll]);

  // Check if user is near bottom to determine auto-scroll behavior
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  const emergencyMentioned = useMemo(
    () => EMERGENCY_TERMS.some((t) => input.toLowerCase().includes(t)),
    [input],
  );

  const startStopRecording = () => {
    const SR: any = (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    // Don't start recording while AI is speaking
    if (isSpeaking && !recording) {
      toast.info("Please wait for AI to finish speaking");
      return;
    }

    if (recording) {
      (window as any).__rec?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    (window as any).__rec = rec;
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      const newText = (input ? input + " " : "") + text;
      setInput(newText);
      setWasVoiceInput(true);
      voiceInputRef.current = true;
      console.log('Voice input detected, will auto-play response');
      toast.success('Voice input detected - response will be spoken');

      // Auto-submit after speech recognition completes
      setTimeout(() => {
        if (newText.trim()) {
          send({ message: newText });
        }
      }, 1000); // Small delay to ensure speech is complete
    };
    rec.onerror = () => {
      setRecording(false);
      setIsListening(false);
    };
    rec.onend = () => {
      setRecording(false);
      setIsListening(false);
    };
    rec.start();
    setRecording(true);
    setIsListening(true);
  };

  const [ocrText, setOcrText] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<any | null>(null);

  useEffect(() => {
    // load Alden hero Lottie animation
    (async () => {
      try {
        const url = "https://cdn.prod.website-files.com/689d3e623c72de3de55d3877/68a11176a2a187c96b0333c1_animation.json";
        const r = await fetch(url);
        const json = await r.json();
        setAnimationData(json);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Please select an image under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImageB64(dataUrl);
      setOcrText(null);

      // Suggest medical image analysis prompts if input is empty
      if (!input.trim()) {
        setInput("What medical condition does this image show? Please analyze the symptoms visible.");
      }

      toast.success('Medical image uploaded. Please describe what you want to know about it.');

      // Optional: Still run OCR for any text in the image
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.text && data.text.trim()) {
            setOcrText(data.text);
            // Don't auto-append OCR text for medical images - let user decide
          }
        }
      } catch (err) {
        // OCR failure is not critical for medical image analysis
        console.warn('OCR processing failed:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const playTTS = async (text: string) => {
    setIsSpeaking(true);

    // Try server-side TTS (ElevenLabs) first, with explicit feedback
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        const audioBase64 = data?.audioBase64;
        if (audioBase64) {
          const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          await audio.play();
          return;
        } else {
          // server responded but no audio
          console.warn("ElevenLabs returned no audio, using browser voice");
        }
      } else {
        const detail = await res.text();
        console.warn("TTS server error:", detail);
      }
    } catch (e) {
      console.warn("TTS request failed:", e);
    }

    // Fallback using Web Speech API
    try {
      if ((window as any).speechSynthesis) {
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = "en-IN";
        ut.onend = () => setIsSpeaking(false);
        ut.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(ut);
      } else {
        setIsSpeaking(false);
        toast.error("No voice available");
      }
    } catch (e) {
      setIsSpeaking(false);
      toast.error("Unable to play voice");
    }
  };

  const triggerEmergency = async () => {
    const phone = window.prompt("This is an emergency. Enter your mobile number to connect with a doctor:");
    if (!phone) return;
    try {
      const res = await fetch('/api/emergency-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, description: input }),
      });
      const data = await res.json();
      toast.success('Emergency request sent. Help is on the way.');
      // Optionally show which doctor is being contacted
      if (data?.doctor?.name) {
        setMessages(m => [
          ...m,
          { id: crypto.randomUUID(), role: 'bot', content: `Connecting you to ${data.doctor.name}.` },
        ]);
      }
    } catch (e) {
      toast.error('Unable to initiate emergency contact');
    }
  };

  const send = async (payload?: { message?: string }) => {
    const trimmed = (payload?.message ?? input).trim();
    if (!trimmed && !imageB64) return;

    // Require text prompt when sending images
    if (imageB64 && !trimmed) {
      toast.error('Please describe what you want to know about the image');
      return;
    }

    const shouldAutoPlay = wasVoiceInput || voiceInputRef.current;

    // Ensure we're at bottom when sending a message
    setShouldAutoScroll(true);

    const newMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      image: imageB64,
    };
    setMessages((m) => [...m, newMsg]);
    setInput("");
    setImageB64(undefined);
    // Don't reset wasVoiceInput here - wait until after we handle the response

    if (
      EMERGENCY_TERMS.some((t) =>
        `${trimmed}`.toLowerCase().includes(t.toLowerCase()),
      )
    ) {
      const phone = window.prompt(
        "This seems urgent. Enter your mobile number to connect with a doctor:",
      );
      if (phone) {
        try {
          await fetch("/api/emergency-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, description: trimmed }),
          });
          toast.success("Connecting you to a doctor shortly");
        } catch (e) {
          toast.error("Unable to initiate call");
        }
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, image: newMsg.image }),
      });
      const data = await res.json();
      const replyText: string = data.reply ?? "";
      const bot: Message = {
        id: crypto.randomUUID(),
        role: "bot",
        content: replyText,
      };
      setMessages((m) => [...m, bot]);

      // Auto-play TTS if user used voice input
      if (shouldAutoPlay && replyText) {
        // console.log('Auto-playing TTS for voice input:', replyText.substring(0, 50));
        setTimeout(() => playTTS(replyText), 500); // Small delay to let UI update
      }

      // Reset voice input flag after handling response
      setWasVoiceInput(false);
      voiceInputRef.current = false;
    } catch (e) {
      // Use client-side fallback short reply
      const fallback = "Sorry, I'm unable to connect right now; rest, hydrate, and seek care if worsening.";
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: fallback,
        },
      ]);

      // Auto-play TTS if user used voice input
      if (shouldAutoPlay) {
        setTimeout(() => playTTS(fallback), 500);
      }

      // Reset voice input flag after handling response
      setWasVoiceInput(false);
      voiceInputRef.current = false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This is manual text input, not voice
    setWasVoiceInput(false);
    voiceInputRef.current = false;
    // console.log('Manual text submit - voice flags reset');
    send();
  };

  return (
    <div>
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
            >
              SwasthyaAI — Your personal AI health assistant
            </motion.h1>
            <p className="mt-4 text-foreground/70 max-w-2xl text-lg">
              Fast triage, photo-assisted assessments, doctor recommendations and personalized nutrition — designed for India.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="/doctors" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-300 to-fuchsia-500 text-slate-900 font-semibold shadow-lg">
                Find a Doctor
              </a>
              <a href="/nutrition" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-transparent ring-1 ring-border text-foreground">
                Nutrition Plans
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            {/* Lottie animation container */}
            <div id="lottie-root" className="rounded-3xl overflow-hidden bg-card border border-border p-4">
              {animationData ? (
                <Lottie animationData={animationData} loop={true} className="h-64" />
              ) : (
                <div className="h-64 w-full" />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="rounded-2xl border border-border bg-card backdrop-blur-xl p-4 h-[60vh] overflow-y-auto"
          >
            {messages.length === 0 ? (
              <div className="h-full grid place-items-center text-muted-foreground text-sm">
                Start by typing a symptom or tap the mic for voice chat.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[85%] rounded-2xl p-3 shadow-md ring-1 ring-border ${m.role === "user"
                      ? "ml-auto bg-primary/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {m.image && (
                      <img
                        src={m.image}
                        alt="uploaded"
                        className="mb-2 max-h-48 rounded-lg object-cover"
                      />)
                    }
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                    {m.role === "bot" && (
                      <button
                        onClick={() => playTTS(m.content)}
                        className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Volume2 size={14} /> Listen
                      </button>
                    )}
                  </motion.div>
                ))}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-[85%] ml-auto rounded-2xl p-3 shadow-md ring-1 ring-border bg-primary/20"
                  >
                    <div className="flex items-center gap-2 text-sm text-primary-foreground">
                      <Mic size={16} className="animate-pulse" />
                      Listening...
                    </div>
                  </motion.div>
                )}
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-[85%] rounded-2xl p-3 shadow-md ring-1 ring-border bg-secondary/20"
                  >
                    <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <Volume2 size={16} className="animate-pulse" />
                      AI is speaking...
                    </div>
                  </motion.div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {imageB64 && (
            <div className="mt-4 p-3 rounded-2xl bg-card backdrop-blur-xl border border-border">
              <div className="flex items-start gap-3">
                <img
                  src={imageB64}
                  alt="Medical image for analysis"
                  className="w-20 h-20 object-cover rounded-lg border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Medical Image Ready</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a text prompt describing what you want to know about this image, then send.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-2 items-center">
              <div className="flex-1 flex items-center gap-2 rounded-2xl bg-input backdrop-blur-xl p-2 ring-1 ring-border">
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // If user is manually typing, reset voice flags
                    if (!recording && !isListening) {
                      setWasVoiceInput(false);
                      voiceInputRef.current = false;
                    }
                  }}
                  placeholder={imageB64 ? "Describe what you want to know about this image..." : "Describe your symptom..."}
                  className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                />
                <div className="flex items-center gap-1">
                  <label className="cursor-pointer px-2 py-1 rounded-md bg-muted ring-1 ring-border text-muted-foreground hover:text-foreground">
                    <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                    <ImageIcon size={18} />
                  </label>
                  {imageB64 && (
                    <button
                      onClick={() => {
                        setImageB64(undefined);
                        setOcrText(null);
                        toast.success('Image cleared');
                      }}
                      className="px-2 py-1 rounded-md bg-red-500/20 ring-1 ring-red-500/30 text-red-300 hover:text-red-200 text-xs"
                      title="Clear image"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={startStopRecording}
                  className={`px-2 py-1 rounded-md ring-1 ring-border transition-all ${recording
                    ? "bg-destructive/30 animate-pulse text-destructive-foreground"
                    : isSpeaking
                      ? "bg-secondary/30 animate-pulse text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}
                  aria-pressed={recording}
                  title={recording ? "Stop recording" : isSpeaking ? "AI is speaking" : "Start voice chat"}
                >
                  {recording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-900 font-semibold flex items-center gap-2"
                >
                  <Send size={16} /> Send
                </button>
              </div>
            </div>
          </form>

          {emergencyMentioned && (
            <div className="mt-2 text-xs text-destructive">
              Emergency keywords detected. You can send to connect with a doctor now.
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-4">
            <h3 className="font-semibold text-card-foreground">Medical Image Analysis</h3>
            <p className="mt-2 text-sm text-muted-foreground">Upload medical images (rashes, wounds, skin conditions) with a text prompt describing what you want to know. AI will analyze and provide insights.</p>
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="font-medium">Example prompts:</p>
              <ul className="mt-1 space-y-1">
                <li>• "What skin condition does this show?"</li>
                <li>• "Is this rash concerning?"</li>
                <li>• "What might cause this wound?"</li>
              </ul>
            </div>
            {imageB64 && (
              <div className="mt-2">
                <div className="text-xs text-primary mb-2">
                  ✓ Image uploaded - ready for analysis
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setInput("What medical condition does this image show?")}
                    className="block w-full text-left text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground"
                  >
                    Identify condition
                  </button>
                  <button
                    onClick={() => setInput("Is this rash or skin condition concerning? Should I see a doctor?")}
                    className="block w-full text-left text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground"
                  >
                    Assess severity
                  </button>
                  <button
                    onClick={() => setInput("What might have caused this skin condition or wound?")}
                    className="block w-full text-left text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground"
                  >
                    Possible causes
                  </button>
                </div>
              </div>
            )}
            {ocrText && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">Text detected in image:</p>
                <pre className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded">{ocrText}</pre>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-4">
            <h3 className="font-semibold text-card-foreground">Tips</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Upload clear, well-lit photos of skin conditions, wounds, or rashes.</li>
              <li>Always include a text prompt describing what you want to know.</li>
              <li>AI provides observations only - consult doctors for diagnosis.</li>
              <li>For severe issues, call emergency services immediately.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-4">
            <h3 className="font-semibold text-card-foreground">Privacy</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your data is processed securely. Medical advice here is informational; consult doctors when in doubt.
            </p>
          </div>
        </aside>
      </div>

      {/* Extra informative sections */}
      <section className="mt-12 space-y-8">
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold text-card-foreground">AI-Powered Coordination</h3>
            <p className="mt-2 text-sm text-muted-foreground">Automate scheduling, reminders, and care coordination to reduce manual work.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold text-card-foreground">Medical Image Analysis</h3>
            <p className="mt-2 text-sm text-muted-foreground">Upload photos of skin conditions, wounds, or rashes. AI analyzes images and provides medical insights with recommendations.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold text-card-foreground">Nutrition & Care Plans</h3>
            <p className="mt-2 text-sm text-muted-foreground">Personalized meal plans and reminders tailored to patient needs.</p>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-r from-primary/10 to-secondary/8 p-8 backdrop-blur-xl border border-border">
          <h2 className="text-2xl font-bold text-foreground">How AI Helps Healthcare</h2>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            SwasthyaAI uses large language and vision models to provide quick triage, symptom explanation, and personalized guidance. We assist with preliminary assessments, medication reminders, nutrition planning, and help connect you with nearby specialists.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold text-card-foreground">Triage & Advice</h3>
            <p className="mt-2 text-sm text-muted-foreground">Fast, evidence-aligned suggestions for common symptoms and next steps.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold text-card-foreground">Doctor Finder</h3>
            <p className="mt-2 text-sm text-muted-foreground">Find rated local doctors matched to your problem and location.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold text-card-foreground">Nutrition & Plans</h3>
            <p className="mt-2 text-sm text-muted-foreground">Personalized Indian meal plans and nutrition advice for health goals.</p>
          </div>
        </div>

        <div className="rounded-2xl p-8 bg-card border border-border">
          <h3 className="text-xl font-bold text-card-foreground">What our AI can do</h3>
          <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-1">
            <li>Analyze medical images using advanced vision AI to identify skin conditions, wounds, and symptoms.</li>
            <li>Provide concise actionable advice and safety guidance.</li>
            <li>Recommend specialists and contact details nearby.</li>
            <li>Generate meal plans and nutritional summaries tailored to Indian diets.</li>
          </ul>
        </div>
      </section>

      {/* Floating emergency button */}
      <button
        onClick={triggerEmergency}
        className="fixed left-5 bottom-5 z-50 rounded-full bg-destructive text-destructive-foreground px-4 py-3 shadow-lg hover:scale-105 transition"
        aria-label="Contact emergency doctor"
      >
        Emergency
      </button>
    </div>
  );
}
