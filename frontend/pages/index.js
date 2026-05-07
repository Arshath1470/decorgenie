import { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Designer from "../components/Designer";
import PricingSection from "../components/PricingSection";
import AuthModal from "../components/AuthModal";
import { supabase } from "../lib/supabase";

const PIPELINE = [
  { n: "01", title: "Room Understanding", desc: "GPT-4o Vision + SAM2 analyzes walls, floors, furniture & natural light from your photo" },
  { n: "02", title: "Style Transformation", desc: "SDXL + ControlNet generates photorealistic redesigns preserving your room's actual geometry" },
  { n: "03", title: "Design Reasoning", desc: "Claude creates color palettes, material specs, lighting plans & Vastu recommendations" },
  { n: "04", title: "Budget & Shopping", desc: "Itemized renovation cost estimates + curated product links for every design element" },
];

const FEATURES = [
  { ico: "🎨", t: "9 Design Styles", d: "Modern, Luxury, Japandi, Scandinavian, Industrial, Bohemian, Traditional Indian & more" },
  { ico: "🪄", t: "AI Room Renders", d: "SDXL + ControlNet generates photorealistic redesigns while preserving your room geometry" },
  { ico: "🧿", t: "Vastu Intelligence", d: "Every design includes specific Vastu Shastra recommendations for Indian homes" },
  { ico: "💰", t: "Budget Estimator", d: "Itemized renovation costs for painting, flooring, furniture & lighting — ₹2L to ₹10L+" },
  { ico: "🛋️", t: "Furniture Planner", d: "AI suggests optimal placement and specific pieces for your room type and dimensions" },
  { ico: "🛍️", t: "Shop the Look", d: "Curated product picks from Pepperfry, Amazon India, IKEA and Urban Ladder" },
  { ico: "📊", t: "Before / After", d: "Side-by-side slider comparing your original room vs the AI redesign" },
  { ico: "📱", t: "AR Preview", d: "View your redesigned room in augmented reality through the DecorGenie mobile app" },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authModal, setAuthModal] = useState(null); // "signin" | "signup" | null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setToken(data.session?.access_token ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <Head>
        <title>DecorGenie AI — AI Interior Designer for Indian Homes</title>
        <meta name="description" content="Upload a room photo and get instant AI redesigns, color palettes, Vastu tips, furniture layouts, and renovation budgets tailored for Indian homes." />
        <meta property="og:title" content="DecorGenie AI — Your Room, Reimagined" />
        <meta property="og:description" content="AI-powered interior design for Indian homes. Upload a photo, choose a style, get a redesign." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar onOpenAuth={setAuthModal} />

      {/* HERO */}
      <section style={{ minHeight: "88vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "3rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(212,168,75,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(212,168,75,0.1)", border: "1px solid rgba(212,168,75,0.3)", borderRadius: "20px", padding: "0.3rem 0.9rem", fontSize: "0.75rem", color: "#D4A84B", marginBottom: "1.5rem", letterSpacing: "0.05em" }}>
          ✦ AI-Powered Interior Design for Indian Homes
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.8rem, 6vw, 5rem)", fontWeight: 600, lineHeight: 1.05, marginBottom: "1.25rem", maxWidth: 800 }}>
          Your room.<br /><em style={{ color: "#D4A84B" }}>Reimagined</em> by AI.
        </h1>
        <p style={{ color: "#A89880", fontSize: "1.05rem", maxWidth: 540, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
          Upload any room photo. Choose your style. Get instant redesigns, color themes, furniture layouts, and renovation budgets — tailored for Indian homes.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => scrollTo("designer")} style={{ background: "#D4A84B", color: "#0D0B08", padding: "0.85rem 2rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", border: "none", fontFamily: "'Outfit', sans-serif" }}>
            ✦ Start Designing Free
          </button>
          <button onClick={() => scrollTo("features")} style={{ background: "transparent", color: "#D4A84B", padding: "0.85rem 2rem", borderRadius: "8px", fontWeight: 500, fontSize: "0.95rem", cursor: "pointer", border: "1px solid rgba(212,168,75,0.3)", fontFamily: "'Outfit', sans-serif" }}>
            See features →
          </button>
        </div>
        <div style={{ display: "flex", gap: "3rem", justifyContent: "center", marginTop: "3rem", paddingTop: "2.5rem", borderTop: "1px solid rgba(212,168,75,0.1)" }}>
          {[["12K+", "Rooms Redesigned"], ["9", "Design Styles"], ["₹2L–10L", "Budget Range"], ["Vastu", "Compliant AI"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "#D4A84B", fontWeight: 600 }}>{n}</div>
              <div style={{ fontSize: "0.72rem", color: "#6B5E4E", letterSpacing: "0.05em", textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1000, margin: "0 auto" }} className="fade-in">
        <SectionLabel>Pipeline</SectionLabel>
        <SectionTitle>4-Step AI Pipeline</SectionTitle>
        <p style={{ color: "#A89880", fontSize: "0.95rem", marginBottom: "2.5rem" }}>Computer vision + generative AI + LLM reasoning — working together in seconds.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "rgba(212,168,75,0.1)", border: "1px solid rgba(212,168,75,0.1)", borderRadius: "20px", overflow: "hidden" }}>
          {PIPELINE.map((p) => (
            <div key={p.n} style={{ background: "#161410", padding: "1.5rem", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1E1B16"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#161410"}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", color: "rgba(212,168,75,0.2)", fontWeight: 600, lineHeight: 1, marginBottom: "0.5rem" }}>{p.n}</div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#D4A84B", marginBottom: "0.35rem" }}>{p.title}</div>
              <div style={{ fontSize: "0.8rem", color: "#A89880", lineHeight: 1.55 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "4rem 2rem", maxWidth: 1000, margin: "0 auto" }} className="fade-in">
        <SectionLabel>Features</SectionLabel>
        <SectionTitle>Everything you need to redesign</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "rgba(212,168,75,0.1)", border: "1px solid rgba(212,168,75,0.1)", borderRadius: "20px", overflow: "hidden", marginTop: "2.5rem" }}>
          {FEATURES.map((f) => (
            <div key={f.t} style={{ background: "#161410", padding: "1.5rem", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1E1B16"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#161410"}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>{f.ico}</div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#F0EBE1", marginBottom: "0.35rem" }}>{f.t}</div>
              <div style={{ fontSize: "0.78rem", color: "#A89880", lineHeight: 1.55 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DESIGNER */}
      <section id="designer" style={{ padding: "4rem 2rem", maxWidth: 1000, margin: "0 auto" }} className="fade-in">
        <SectionLabel>Designer</SectionLabel>
        <SectionTitle>AI Interior Designer</SectionTitle>
        <p style={{ color: "#A89880", fontSize: "0.95rem", marginBottom: "2.5rem" }}>Upload your room photo and get a complete redesign in under 30 seconds.</p>
        <Designer user={user} token={token} />
      </section>

      {/* PRICING */}
      <div style={{ padding: "0 2rem" }}>
        <PricingSection user={user} />
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#161410", borderTop: "1px solid rgba(212,168,75,0.1)", padding: "2rem", textAlign: "center", marginTop: "4rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#D4A84B", marginBottom: "0.5rem" }}>DecorGenie</div>
        <p style={{ fontSize: "0.8rem", color: "#6B5E4E" }}>AI-powered interior design for Indian homes · Built with ✦ and Claude AI</p>
        <p style={{ fontSize: "0.78rem", color: "#6B5E4E", marginTop: "0.25rem" }}>© 2026 DecorGenie · Madurai, Tamil Nadu</p>
      </footer>

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#D4A84B", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
      <span style={{ display: "inline-block", width: 20, height: 1, background: "#D4A84B" }} />
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 600, marginBottom: "0.5rem", lineHeight: 1.15 }}>{children}</div>;
}
