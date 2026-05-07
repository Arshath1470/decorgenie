import { useState, useRef } from "react";
import toast from "react-hot-toast";
import ResultsTabs from "./ResultsTabs";
import { generateDesign, generateRoomImage, saveDesign } from "../lib/api";

const STYLES = ["Modern", "Luxury", "Minimal", "Scandinavian", "Industrial", "Japandi", "Traditional Indian", "Contemporary", "Bohemian"];
const ROOMS = [
  { label: "Living Room", val: "Living Room" },
  { label: "Bedroom", val: "Bedroom" },
  { label: "Kitchen", val: "Kitchen" },
  { label: "Office", val: "Home Office" },
  { label: "Dining", val: "Dining Room" },
  { label: "Pooja Room", val: "Pooja Room" },
];
const BUDGETS = [
  { label: "Under ₹2L", val: "under ₹2 lakhs (budget-friendly)" },
  { label: "₹2–5L", val: "₹2–5 lakhs (mid-range)" },
  { label: "₹5–10L", val: "₹5–10 lakhs (premium)" },
  { label: "₹10L+", val: "above ₹10 lakhs (luxury)" },
];

export default function Designer({ user, token }) {
  const [imageFile, setImageFile] = useState(null);
  const [imageDataURL, setImageDataURL] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [style, setStyle] = useState("Modern");
  const [room, setRoom] = useState("Living Room");
  const [budget, setBudget] = useState("under ₹2 lakhs (budget-friendly)");
  const [roomSize, setRoomSize] = useState(250);
  const [notes, setNotes] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataURL(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const resetImage = (e) => {
    e.stopPropagation();
    setImageFile(null); setImageDataURL(null); setImageBase64(null);
    setGeneratedImageUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGenerate = async () => {
    setLoading(true);
    setDesign(null);
    setGeneratedImageUrl(null);
    try {
      const res = await generateDesign({
        style, room_type: room, budget, room_size: roomSize,
        notes, image_base64: imageBase64, theme_color: themeColor || null, token,
      });
      setDesign(res.data);
      toast.success("Design generated! ✦");
    } catch (err) {
      toast.error(err.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!design?.ai_image_prompt) return;
    setGeneratingImage(true);
    try {
      const res = await generateRoomImage({ prompt: design.ai_image_prompt, style, room_type: room, image_base64: imageBase64 || null, token });
      setGeneratedImageUrl(res.image_url);
      toast.success("Room render ready! 🖼️");
    } catch (err) {
      toast.error(err.message || "Image generation failed. Add Stability/Replicate API key.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    if (!design) return toast.error("Generate a design first");
    if (!token) return toast.error("Sign in to save designs");
    try {
      await saveDesign({ designData: design, style, room_type: room, budget, room_size: roomSize, notes, token });
      toast.success("Design saved to your account! ✦");
    } catch (err) {
      toast.error("Save failed. Please try again.");
    }
  };

  const Tag = ({ label, val, selected, onClick, green }) => (
    <button onClick={() => onClick(val)} style={{
      padding: "0.35rem 0.5rem", border: `1px solid ${selected ? (green ? "rgba(61,122,82,0.5)" : "rgba(212,168,75,0.4)") : "rgba(212,168,75,0.12)"}`,
      borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", textAlign: "center",
      color: selected ? (green ? "#7DCB97" : "#D4A84B") : "#6B5E4E",
      background: selected ? (green ? "rgba(61,122,82,0.12)" : "rgba(212,168,75,0.1)") : "#1E1B16",
      fontFamily: "'Outfit', sans-serif", transition: "all 0.15s",
    }}>{label}</button>
  );

  return (
    <div style={{ background: "#161410", border: "1px solid rgba(212,168,75,0.12)", borderRadius: "20px", overflow: "hidden" }}>
      {/* App window chrome */}
      <div style={{ background: "#1E1B16", borderBottom: "1px solid rgba(212,168,75,0.1)", padding: "0.85rem 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {["#E55", "#EA3", "#3A3"].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        <span style={{ fontSize: "0.85rem", color: "#6B5E4E", marginLeft: "0.5rem" }}>DecorGenie Designer — AI Room Transformer</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px" }}>
        {/* LEFT PANEL */}
        <div style={{ padding: "1.5rem", borderRight: "1px solid rgba(212,168,75,0.1)" }}>
          {/* Upload zone */}
          <div
            onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            onClick={() => !imageDataURL && fileRef.current?.click()}
            style={{
              border: `1.5px dashed ${imageDataURL ? "rgba(212,168,75,0.4)" : "rgba(212,168,75,0.25)"}`,
              borderStyle: imageDataURL ? "solid" : "dashed",
              borderRadius: "12px", minHeight: 220, position: "relative",
              cursor: imageDataURL ? "default" : "pointer", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", textAlign: "center", padding: imageDataURL ? 0 : "2rem",
              transition: "all 0.25s",
            }}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])} />
            {imageDataURL ? (
              <>
                <img src={imageDataURL} alt="Room" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(13,11,8,0.85), transparent)", padding: "1rem", display: "flex", alignItems: "flex-end" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>📷 Your room</span>
                  <button onClick={resetImage} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "0.25rem 0.65rem", borderRadius: "20px", fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Change</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "2.2rem", opacity: 0.35, marginBottom: "0.5rem" }}>🏠</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#F0EBE1", marginBottom: "0.25rem" }}>Drop your room photo</div>
                <div style={{ fontSize: "0.78rem", color: "#6B5E4E" }}>Bedroom · Living Room · Kitchen · Office · Pooja Room</div>
                <div style={{ fontSize: "0.72rem", color: "#6B5E4E", marginTop: "0.35rem" }}>or click to browse</div>
              </>
            )}
          </div>

          {/* Before/After */}
          {imageDataURL && generatedImageUrl && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
              {[["Before", imageDataURL], ["AI Redesign", generatedImageUrl]].map(([label, src]) => (
                <div key={label} style={{ background: "#1E1B16", border: "1px solid rgba(212,168,75,0.1)", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0.35rem 0.75rem", color: "#6B5E4E", background: "#272320" }}>{label}</div>
                  <img src={src} alt={label} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div style={{ marginTop: "1.25rem" }}>
              {[60, 90, 75, 85, 50].map((w, i) => (
                <div key={i} className="shimmer" style={{ height: 14, borderRadius: 4, marginBottom: "0.75rem", width: `${w}%` }} />
              ))}
            </div>
          ) : design ? (
            <ResultsTabs
              design={design} style={style} room={room} budget={budget}
              onGenerateImage={handleGenerateImage}
              generatedImageUrl={generatedImageUrl}
              generatingImage={generatingImage}
            />
          ) : (
            <div style={{ textAlign: "center", color: "#6B5E4E", padding: "2rem", fontSize: "0.9rem", lineHeight: 1.7 }}>
              <div style={{ fontSize: "2rem", opacity: 0.2, marginBottom: "0.5rem" }}>✦</div>
              <strong style={{ color: "#A89880" }}>Your redesign will appear here.</strong><br />
              <span style={{ fontSize: "0.82rem" }}>Upload a photo, choose style, then Generate.</span>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <CtrlGroup label="Design Style">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
              {STYLES.map((s) => <Tag key={s} label={s === "Scandinavian" ? "Scandi" : s === "Traditional Indian" ? "Indian" : s === "Contemporary" ? "Contemp." : s} val={s} selected={style === s} onClick={setStyle} />)}
            </div>
          </CtrlGroup>

          <CtrlGroup label="Room Type">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
              {ROOMS.map(({ label, val }) => <Tag key={val} label={label} val={val} selected={room === val} onClick={setRoom} />)}
            </div>
          </CtrlGroup>

          <CtrlGroup label="Budget Range">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
              {BUDGETS.map(({ label, val }) => <Tag key={val} label={label} val={val} selected={budget === val} onClick={setBudget} green />)}
            </div>
          </CtrlGroup>

          <CtrlGroup label={`Room Size — ${roomSize} sq ft`}>
            <input type="range" min={100} max={1000} step={25} value={roomSize}
              onChange={(e) => setRoomSize(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#D4A84B" }} />
          </CtrlGroup>

          <CtrlGroup label="Theme Color (Optional)">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <input
                  type="color"
                  value={themeColor || "#D4A84B"}
                  onChange={(e) => setThemeColor(e.target.value)}
                  style={{ width: 36, height: 36, borderRadius: "8px", border: "1px solid rgba(212,168,75,0.3)", cursor: "pointer", padding: 2, background: "#272320" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", color: "#F0EBE1", marginBottom: "0.2rem" }}>
                  {themeColor ? themeColor.toUpperCase() : "Pick a color"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#6B5E4E" }}>AI will build palette around this</div>
              </div>
              {themeColor && (
                <button onClick={() => setThemeColor("")} style={{ background: "none", border: "none", color: "#6B5E4E", cursor: "pointer", fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}>
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              {["#D4A84B","#2D6A4F","#1D3557","#C1121F","#6D4C41","#7B2D8B","#E76F51","#264653"].map((c) => (
                <button key={c} onClick={() => setThemeColor(c)} style={{
                  width: 22, height: 22, borderRadius: "50%", background: c, border: themeColor === c ? "2px solid #fff" : "2px solid transparent",
                  cursor: "pointer", padding: 0, flexShrink: 0,
                }} title={c} />
              ))}
            </div>
          </CtrlGroup>

          <CtrlGroup label="Special Preferences">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Vastu-compliant, dark wood, cat-friendly, compact space, marble flooring…"
              rows={3} style={{
                width: "100%", background: "#272320", border: "1px solid rgba(212,168,75,0.12)",
                borderRadius: "8px", padding: "0.55rem 0.75rem", color: "#F0EBE1",
                fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem", resize: "none",
                outline: "none", lineHeight: 1.5,
              }} />
          </CtrlGroup>

          <div style={{ marginTop: "auto" }}>
            <button onClick={handleGenerate} disabled={loading} style={{
              width: "100%", padding: "0.85rem", background: loading ? "rgba(212,168,75,0.4)" : "#D4A84B",
              color: "#0D0B08", border: "none", borderRadius: "8px",
              fontFamily: "'Outfit', sans-serif", fontSize: "0.95rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", marginBottom: "0.5rem",
            }}>
              {loading ? "⏳ Generating…" : "✦ Generate AI Design"}
            </button>
            {design && (
              <button onClick={handleSave} style={{
                width: "100%", padding: "0.6rem", background: "transparent",
                color: "#D4A84B", border: "1px solid rgba(212,168,75,0.3)", borderRadius: "8px",
                fontFamily: "'Outfit', sans-serif", fontSize: "0.83rem", cursor: "pointer",
              }}>
                💾 Save Design {!user && "(sign in required)"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlGroup({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B5E4E", marginBottom: "0.5rem" }}>{label}</div>
      {children}
    </div>
  );
}
