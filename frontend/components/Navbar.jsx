import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export default function Navbar({ onOpenAuth }) {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => { listener.subscription.unsubscribe(); window.removeEventListener("scroll", handleScroll); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    setMenuOpen(false);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: scrolled ? "rgba(13,11,8,0.97)" : "rgba(13,11,8,0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(212,168,75,0.12)",
      padding: "0.85rem 1.5rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "background 0.3s",
      position: "sticky",
    }}>
      {/* Logo */}
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#D4A84B", cursor: "pointer", flexShrink: 0 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        Decor<span style={{ color: "#F0EBE1", fontStyle: "italic" }}>Genie</span>
      </div>

      {/* Desktop nav links */}
      <div className={`nav-links${menuOpen ? " open" : ""}`}>
        {["features", "designer", "pricing"].map((id) => (
          <button key={id} onClick={() => scrollTo(id)} style={{
            background: "none", border: "none", color: "#A89880", fontSize: "0.85rem",
            cursor: "pointer", fontFamily: "'Outfit', sans-serif", textTransform: "capitalize",
            transition: "color 0.2s", padding: "0.25rem 0",
          }}
            onMouseEnter={(e) => e.target.style.color = "#D4A84B"}
            onMouseLeave={(e) => e.target.style.color = "#A89880"}
          >{id}</button>
        ))}

        {user ? (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", color: "#6B5E4E" }}>{user.email?.split("@")[0]}</span>
            <button onClick={handleSignOut} style={{
              background: "transparent", border: "1px solid rgba(212,168,75,0.3)",
              color: "#D4A84B", padding: "0.35rem 0.85rem", borderRadius: "20px",
              fontSize: "0.78rem", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            }}>Sign out</button>
          </div>
        ) : (
          <button onClick={() => { onOpenAuth?.("signin"); setMenuOpen(false); }} style={{
            background: "#D4A84B", color: "#0D0B08", padding: "0.4rem 1.1rem",
            borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600,
            cursor: "pointer", border: "none", fontFamily: "'Outfit', sans-serif",
          }}>Sign in</button>
        )}
      </div>

      {/* Hamburger button (mobile only) */}
      <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}
        style={{ color: "#D4A84B" }}>
        {menuOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>
    </nav>
  );
}
