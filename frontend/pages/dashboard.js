import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { getMyDesigns } from "../lib/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/"); return; }
      setUser(data.session.user);
      setToken(data.session.access_token);
      try {
        const res = await getMyDesigns(data.session.access_token);
        setDesigns(res.designs || []);
      } catch { toast.error("Failed to load designs"); }
      finally { setLoading(false); }
    });
  }, []);

  return (
    <>
      <Head><title>My Designs — DecorGenie AI</title></Head>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "#D4A84B" }}>My Designs</div>
          <div style={{ fontSize: "0.85rem", color: "#6B5E4E", marginTop: "0.25rem" }}>{user?.email}</div>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer" style={{ height: 200, borderRadius: 12 }} />
            ))}
          </div>
        ) : designs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#6B5E4E" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>🏠</div>
            <div style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#A89880" }}>No saved designs yet</div>
            <button onClick={() => router.push("/")} style={{
              marginTop: "1rem", background: "#D4A84B", color: "#0D0B08", border: "none",
              borderRadius: "8px", padding: "0.65rem 1.5rem", fontSize: "0.88rem",
              fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            }}>Start Designing →</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {designs.map((d) => (
              <div key={d.id} style={{ background: "#161410", border: "1px solid rgba(212,168,75,0.12)", borderRadius: "16px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(212,168,75,0.35)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(212,168,75,0.12)"}>
                {d.original_image_url ? (
                  <img src={d.original_image_url} alt={d.title} style={{ width: "100%", height: 150, objectFit: "cover" }} />
                ) : (
                  <div style={{ height: 150, background: "#1E1B16", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", opacity: 0.3 }}>🏠</div>
                )}
                <div style={{ padding: "1rem" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#D4A84B", marginBottom: "0.25rem" }}>{d.title || "Untitled Design"}</div>
                  <div style={{ fontSize: "0.78rem", color: "#6B5E4E" }}>{d.style} · {d.room_type} · {d.budget}</div>
                  <div style={{ fontSize: "0.72rem", color: "#6B5E4E", marginTop: "0.25rem" }}>
                    {new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
