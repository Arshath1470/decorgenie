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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <meta name="description" content="Upload a room photo and get instant AI redesigns, color palettes, Vastu tips, furniture layouts, and renovation budgets tailored for Indian homes." />
        <meta property="og:title" content="DecorGenie AI — Your Room, Reimagined" />
        <meta property="og:description" content="AI-powered interior design for Indian homes. Upload a photo, choose a style, get a redesign." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar onOpenAuth={setAuthModal} />

      {/* HERO */}
      <section style={{ minHeight: "88vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "3rem 1.25rem", position: "relative", overflow: "hidden" }}>
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
        <div className="hero-stats">
          {[["12K+", "Rooms Redesigned"], ["9", "Design Styles"], ["₹2L–10L", "Budget Range"], ["Vastu", "Compliant AI"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "#D4A84B", fontWeight: 600 }}>{n}</div>
              <div style={{ fontSize: "0.72rem", color: "#6B5E4E", letterSpacing: "0.05em", textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1000, margin: "0 auto" }} className="fade-in section-padding">
        <SectionLabel>Pipeline</SectionLabel>
        <SectionTitle>4-Step AI Pipeline</SectionTitle>
        <p style={{ color: "#A89880", fontSize: "0.95rem", marginBottom: "2.5rem" }}>Computer vision + generative AI + LLM reasoning — working together in seconds.</p>
        <div className="grid-4-col" style={{ background: "rgba(212,168,75,0.1)", border: "1px solid rgba(212,168,75,0.1)", borderRadius: "20px", overflow: "hidden" }}>
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
      <section id="features" style={{ padding: "4rem 2rem", maxWidth: 1000, margin: "0 auto" }} className="fade-in section-padding">
        <SectionLabel>Features</SectionLabel>
        <SectionTitle>Everything you need to redesign</SectionTitle>
        <div className="grid-4-col" style={{ background: "rgba(212,168,75,0.1)", border: "1px solid rgba(212,168,75,0.1)", borderRadius: "20px", overflow: "hidden", marginTop: "2.5rem" }}>
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
        <Designer user={user} token={token} onOpenAuth={setAuthModal} />
      </section>

      {/* PRICING */}
      <div style={{ padding: "0 2rem" }}>
        <PricingSection user={user} />
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#0F0D0A", borderTop: "1px solid rgba(212,168,75,0.1)", padding: "3.5rem 2rem 2rem", marginTop: "4rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#D4A84B", marginBottom: "0.75rem" }}>DecorGenie</div>
              <p style={{ fontSize: "0.85rem", color: "#6B5E4E", lineHeight: 1.7, maxWidth: 300 }}>
                AI-powered interior design tailored for Indian homes. Upload a photo, choose your style, and get a complete redesign in seconds.
              </p>
              <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3A8C54", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: "0.75rem", color: "#6B5E4E" }}>Service is live and running</span>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B5E4E", marginBottom: "1rem" }}>Quick Links</div>
              {[["Features", "#features"], ["Designer", "#designer"], ["Pricing", "#pricing"]].map(([label, href]) => (
                <a key={label} href={href} style={{ display: "block", fontSize: "0.85rem", color: "#A89880", marginBottom: "0.5rem", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#D4A84B"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#A89880"}
                >{label}</a>
              ))}
            </div>

            {/* Contact */}
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B5E4E", marginBottom: "1rem" }}>Contact Us</div>
              <a
                href="https://wa.me/917708607545"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.6rem",
                  background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)",
                  borderRadius: "10px", padding: "0.65rem 1rem",
                  textDecoration: "none", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,211,102,0.15)"; e.currentTarget.style.borderColor = "rgba(37,211,102,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,211,102,0.08)"; e.currentTarget.style.borderColor = "rgba(37,211,102,0.2)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#25D366" }}>WhatsApp Us</div>
                  <div style={{ fontSize: "0.72rem", color: "#6B5E4E" }}>+91 77086 07545</div>
                </div>
              </a>
              <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#6B5E4E", lineHeight: 1.6 }}>
                Mon–Sat · 10am–7pm IST<br />
                Madurai, Tamil Nadu
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(212,168,75,0.08)", paddingTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", color: "#4A4035", margin: 0 }}>© 2026 DecorGenie · All rights reserved</p>
            <p style={{ fontSize: "0.75rem", color: "#4A4035", margin: 0 }}>Built with ✦ and Claude AI</p>
          </div>
        </div>
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
