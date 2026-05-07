import { useState } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "../lib/supabase";
import toast from "react-hot-toast";

const S = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#1E1B16", border: "1px solid rgba(212,168,75,0.2)", borderRadius: "20px", padding: "2rem", width: "90%", maxWidth: "420px" },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", color: "#D4A84B", marginBottom: "0.25rem" },
  sub: { fontSize: "0.85rem", color: "#A89880", marginBottom: "1.5rem" },
  label: { display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B5E4E", marginBottom: "0.35rem" },
  input: { width: "100%", background: "#272320", border: "1px solid rgba(212,168,75,0.15)", borderRadius: "8px", padding: "0.65rem 0.85rem", color: "#F0EBE1", fontFamily: "'Outfit', sans-serif", fontSize: "0.9rem", outline: "none", marginBottom: "1rem" },
  btn: { width: "100%", padding: "0.8rem", background: "#D4A84B", color: "#0D0B08", border: "none", borderRadius: "8px", fontFamily: "'Outfit', sans-serif", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", marginBottom: "0.75rem" },
  btnOutline: { width: "100%", padding: "0.75rem", background: "transparent", color: "#D4A84B", border: "1px solid rgba(212,168,75,0.3)", borderRadius: "8px", fontFamily: "'Outfit', sans-serif", fontSize: "0.88rem", cursor: "pointer", marginBottom: "0.75rem" },
  toggle: { textAlign: "center", fontSize: "0.83rem", color: "#A89880", marginTop: "1rem" },
  link: { color: "#D4A84B", cursor: "pointer", fontWeight: 500 },
  close: { float: "right", background: "none", border: "none", color: "#6B5E4E", fontSize: "1.2rem", cursor: "pointer", marginTop: "-4px" },
};

export default function AuthModal({ mode = "signin", onClose }) {
  const [tab, setTab] = useState(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      if (tab === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast.success("Welcome back!");
        onClose();
      } else {
        if (!name) return toast.error("Please enter your name");
        const { error } = await signUpWithEmail(email, password, name);
        if (error) throw error;
        toast.success("Account created! Check your email.");
        onClose();
      }
    } catch (err) {
      toast.error(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
  };

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <button style={S.close} onClick={onClose}>✕</button>
        <div style={S.title}>{tab === "signin" ? "Welcome back" : "Create account"}</div>
        <div style={S.sub}>{tab === "signin" ? "Sign in to save your designs" : "Start designing for free"}</div>

        <button style={S.btnOutline} onClick={handleGoogle}>
          🔑 Continue with Google
        </button>

        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#6B5E4E", margin: "0.5rem 0 1rem" }}>— or —</div>

        {tab === "signup" && (
          <div>
            <label style={S.label}>Full Name</label>
            <input style={S.input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}

        <label style={S.label}>Email</label>
        <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label style={S.label}>Password</label>
        <input style={S.input} type="password" placeholder="••••••••" value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />

        <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait…" : tab === "signin" ? "Sign In" : "Create Free Account"}
        </button>

        <div style={S.toggle}>
          {tab === "signin" ? (
            <>Don't have an account? <span style={S.link} onClick={() => setTab("signup")}>Sign up free</span></>
          ) : (
            <>Already have an account? <span style={S.link} onClick={() => setTab("signin")}>Sign in</span></>
          )}
        </div>
      </div>
    </div>
  );
}
