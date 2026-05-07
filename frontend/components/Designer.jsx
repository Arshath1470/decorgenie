import { useState, useRef } from "react";
import toast from "react-hot-toast";
import ResultsTabs from "./ResultsTabs";
import { generateDesign, generateRoomImage, saveDesign } from "../lib/api";

const STYLES = [
  { label: "Modern", icon: "⬜" },
  { label: "Luxury", icon: "👑" },
  { label: "Minimal", icon: "◻️" },
  { label: "Scandinavian", icon: "🌿" },
  { label: "Industrial", icon: "⚙️" },
  { label: "Japandi", icon: "🎋" },
  { label: "Traditional Indian", icon: "🪔" },
  { label: "Contemporary", icon: "🔷" },
  { label: "Bohemian", icon: "🌸" },
];

const ROOMS = [
  { label: "Living Room", val: "Living Room", icon: "🛋️" },
  { label: "Bedroom", val: "Bedroom", icon: "🛏️" },
  { label: "Kitchen", val: "Kitchen", icon: "🍳" },
  { label: "Home Office", val: "Home Office", icon: "💼" },
  { label: "Dining Room", val: "Dining Room", icon: "🍽️" },
  { label: "Pooja Room", val: "Pooja Room", icon: "🪔" },
];

const BUDGETS = [
  { label: "Under ₹2L", sublabel: "Budget", val: "under ₹2 lakhs (budget-friendly)" },
  { label: "₹2–5L", sublabel: "Mid-range", val: "₹2–5 lakhs (mid-range)" },
  { label: "₹5–10L", sublabel: "Premium", val: "₹5–10 lakhs (premium)" },
  { label: "₹10L+", sublabel: "Luxury", val: "above ₹10 lakhs (luxury)" },
];

const THEME_COLORS = ["#D4A84B","#2D6A4F","#1D3557","#C1121F","#6D4C41","#7B2D8B","#E76F51","#264653"];

export default function Designer({ user, token }) {
  const [inputMode, setInputMode] = useState("photo"); // "photo" | "dimensions"
  const [imageFile, setImageFile] = useState(null);
  const [imageDataURL, setImageDataURL] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [dimLength, setDimLength] = useState("");
  const [dimWidth, setDimWidth] = useState("");
  const [dimHeight, setDimHeight] = useState("9");
  const [style, setStyle] = useState("Modern");
  const [room, setRoom] = useState("Living Room");
  const [budget, setBudget] = useState("under ₹2 lakhs (budget-friendly)");
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

  const roomSizeValue = inputMode === "dimensions" && dimLength && dimWidth
    ? Math.round(parseFloat(dimLength) * parseFloat(dimWidth))
    : 250;

  const handleGenerate = async () => {
    if (inputMode === "photo" && !imageDataURL) {
      toast.error("Please upload a room photo first");
      return;
    }
    if (inputMode === "dimensions" && (!dimLength || !dimWidth)) {
      toast.error("Please enter room length and width");
      return;
    }
    setLoading(true);
    setDesign(null);
    setGeneratedImageUrl(null);
    try {
      const dimNote = inputMode === "dimensions"
        ? `Room dimensions: ${dimLength}ft (L) × ${dimWidth}ft (W) × ${dimHeight}ft (H). `
        : "";
      const res = await generateDesign({
        style, room_type: room, budget, room_size: roomSizeValue,
        notes: dimNote + notes,
        image_base64: imageBase64,
        theme_color: themeColor || null,
        token,
      });
      setDesign(res.data);
      toast.success("Design generated!");
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
      toast.success("Room render ready!");
    } catch (err) {
      toast.error(err.message || "Image generation failed.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    if (!design) return toast.error("Generate a design first");
    if (!token) return toast.error("Sign in to save designs");
    try {
      await saveDesign({ designData: design, style, room_type: room, budget, room_size: roomSizeValue, notes, token });
      toast.success("Design saved!");
    } catch (err) {
      toast.error("Save failed. Please try again.");
    }
  };

  return (
    <div style={{ background: "#161410", border: "1px solid rgba(212,168,75,0.15)", borderRadius: "24px", overflow: "hidden", boxShadow: "0 0 60px rgba(212,168,75,0.04)" }}>
      {/* Window chrome */}
      <div style={{ background: "#1A1712", borderBottom: "1px solid rgba(212,168,75,0.1)", padding: "0.9rem 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {["#FF5F57","#FEBC2E","#28C840"].map((c) => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.85 }} />
        ))}
        <span style={{ fontSize: "0.82rem", color: "#6B5E4E", marginLeft: "0.75rem", letterSpacing: "0.03em" }}>
          DecorGenie — AI Room Designer
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", minHeight: 580 }}>
        {/* LEFT — preview & results */}
        <div style={{ padding: "1.75rem", borderRight: "1px solid rgba(212,168,75,0.08)" }}>

          {/* Input mode toggle */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", background: "#1A1712", padding: "0.3rem", borderRadius: "10px", border: "1px solid rgba(212,168,75,0.1)" }}>
            {[
              { id: "photo", label: "📷  Upload Photo", hint: "Best results" },
              { id: "dimensions", label: "📐  Enter Dimensions", hint: "" },
            ].map(({ id, label, hint }) => (
              <button key={id} onClick={() => setInputMode(id)} style={{
                flex: 1, padding: "0.6rem 1rem", borderRadius: "7px", fontSize: "0.83rem", fontWeight: 600,
                cursor: "pointer", border: "none", fontFamily: "'Outfit', sans-serif",
                background: inputMode === id ? "#D4A84B" : "transparent",
                color: inputMode === id ? "#0D0B08" : "#6B5E4E",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              }}>
                {label}
                {hint && inputMode === id && (
                  <span style={{ fontSize: "0.65rem", background: "rgba(13,11,8,0.2)", padding: "0.1rem 0.4rem", borderRadius: "10px" }}>{hint}</span>
                )}
              </button>
            ))}
          </div>

          {/* Photo upload */}
          {inputMode === "photo" && (
            <div
              onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              onClick={() => !imageDataURL && fileRef.current?.click()}
              style={{
                border: `1.5px ${imageDataURL ? "solid rgba(212,168,75,0.35)" : "dashed rgba(212,168,75,0.2)"}`,
                borderRadius: "14px", minHeight: 220, position: "relative",
                cursor: imageDataURL ? "default" : "pointer", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", textAlign: "center",
                padding: imageDataURL ? 0 : "2rem",
                background: imageDataURL ? "transparent" : "rgba(212,168,75,0.02)",
                transition: "all 0.25s",
              }}
            >
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])} />
              {imageDataURL ? (
                <>
                  <img src={imageDataURL} alt="Room" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(13,11,8,0.9), transparent)", padding: "1rem 1.25rem", display: "flex", alignItems: "flex-end" }}>
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem" }}>📷 Your room photo</span>
                    <button onClick={resetImage} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                      Change
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: 56, height: 56, borderRadius: "14px", background: "rgba(212,168,75,0.08)", border: "1px solid rgba(212,168,75,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "1rem" }}>🏠</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#F0EBE1", marginBottom: "0.3rem" }}>Drop your room photo here</div>
                  <div style={{ fontSize: "0.78rem", color: "#6B5E4E", marginBottom: "0.5rem" }}>Bedroom · Living Room · Kitchen · Office · Pooja Room</div>
                  <div style={{ fontSize: "0.72rem", color: "#D4A84B", opacity: 0.7 }}>or click to browse files</div>
                </>
              )}
            </div>
          )}

          {/* Dimensions input */}
          {inputMode === "dimensions" && (
            <div style={{ background: "rgba(212,168,75,0.03)", border: "1px solid rgba(212,168,75,0.12)", borderRadius: "14px", padding: "1.5rem" }}>
              <div style={{ fontSize: "0.82rem", color: "#A89880", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                Enter your room measurements and we'll generate a design tailored to your exact space.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                {[
                  { label: "Length (ft)", val: dimLength, set: setDimLength, placeholder: "e.g. 14" },
                  { label: "Width (ft)", val: dimWidth, set: setDimWidth, placeholder: "e.g. 12" },
                  { label: "Height (ft)", val: dimHeight, set: setDimHeight, placeholder: "e.g. 9" },
                ].map(({ label, val, set, placeholder }) => (
                  <div key={label}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B5E4E", marginBottom: "0.4rem" }}>{label}</div>
                    <input
                      type="number" value={val} onChange={(e) => set(e.target.value)}
                      placeholder={placeholder} min="1" max="200"
                      style={{ width: "100%", background: "#1A1712", border: "1px solid rgba(212,168,75,0.15)", borderRadius: "8px", padding: "0.6rem 0.75rem", color: "#F0EBE1", fontFamily: "'Outfit', sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
              </div>
              {dimLength && dimWidth && (
                <div style={{ marginTop: "1rem", padding: "0.6rem 0.9rem", background: "rgba(212,168,75,0.08)", borderRadius: "8px", fontSize: "0.8rem", color: "#D4A84B" }}>
                  ✦ Room area: ~{Math.round(parseFloat(dimLength || 0) * parseFloat(dimWidth || 0))} sq ft
                </div>
              )}
            </div>
          )}

          {/* Before / After */}
          {imageDataURL && generatedImageUrl && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
              {[["Before", imageDataURL], ["AI Redesign", generatedImageUrl]].map(([label, src]) => (
                <div key={label} style={{ background: "#1A1712", border: "1px solid rgba(212,168,75,0.1)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.07em", padding: "0.4rem 0.85rem", color: label === "AI Redesign" ? "#D4A84B" : "#6B5E4E", background: "#1E1B16", fontWeight: 600 }}>{label}</div>
                  <img src={src} alt={label} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          {/* Results area */}
          {loading ? (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#6B5E4E", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#D4A84B", animation: "pulse 1s infinite" }} />
                AI is designing your room…
              </div>
              {[65, 85, 55, 75, 90, 60].map((w, i) => (
                <div key={i} className="shimmer" style={{ height: 13, borderRadius: 4, marginBottom: "0.65rem", width: `${w}%` }} />
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
            <div style={{ textAlign: "center", color: "#6B5E4E", padding: "2.5rem 1rem", fontSize: "0.88rem", lineHeight: 1.7, marginTop: "0.5rem" }}>
              <div style={{ fontSize: "2.5rem", opacity: 0.12, marginBottom: "0.75rem" }}>✦</div>
              <div style={{ color: "#A89880", fontWeight: 500, marginBottom: "0.25rem" }}>Your AI redesign will appear here</div>
              <div style={{ fontSize: "0.78rem" }}>
                {inputMode === "photo" ? "Upload a photo" : "Enter dimensions"}, choose your preferences, then Generate
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — controls */}
        <div style={{ padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto" }}>

          {/* Room Type */}
          <CtrlGroup label="Room Type">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              {ROOMS.map(({ label, val, icon }) => (
                <button key={val} onClick={() => setRoom(val)} style={{
                  padding: "0.5rem 0.4rem", border: `1px solid ${room === val ? "rgba(212,168,75,0.4)" : "rgba(212,168,75,0.1)"}`,
                  borderRadius: "8px", fontSize: "0.76rem", cursor: "pointer", textAlign: "center",
                  color: room === val ? "#D4A84B" : "#6B5E4E",
                  background: room === val ? "rgba(212,168,75,0.08)" : "#1A1712",
                  fontFamily: "'Outfit', sans-serif", transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                }}>
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>
          </CtrlGroup>

          {/* Design Style */}
          <CtrlGroup label="Design Style">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
              {STYLES.map(({ label, icon }) => {
                const shortLabel = label === "Scandinavian" ? "Scandi" : label === "Traditional Indian" ? "Indian" : label === "Contemporary" ? "Contemp." : label;
                return (
                  <button key={label} onClick={() => setStyle(label)} style={{
                    padding: "0.45rem 0.3rem", border: `1px solid ${style === label ? "rgba(212,168,75,0.4)" : "rgba(212,168,75,0.1)"}`,
                    borderRadius: "8px", fontSize: "0.72rem", cursor: "pointer", textAlign: "center",
                    color: style === label ? "#D4A84B" : "#6B5E4E",
                    background: style === label ? "rgba(212,168,75,0.08)" : "#1A1712",
                    fontFamily: "'Outfit', sans-serif", transition: "all 0.15s",
                  }}>
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </CtrlGroup>

          {/* Budget */}
          <CtrlGroup label="Budget Range">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              {BUDGETS.map(({ label, sublabel, val }) => (
                <button key={val} onClick={() => setBudget(val)} style={{
                  padding: "0.5rem 0.4rem", border: `1px solid ${budget === val ? "rgba(61,122,82,0.5)" : "rgba(212,168,75,0.1)"}`,
                  borderRadius: "8px", fontSize: "0.76rem", cursor: "pointer", textAlign: "center",
                  color: budget === val ? "#7DCB97" : "#6B5E4E",
                  background: budget === val ? "rgba(61,122,82,0.1)" : "#1A1712",
                  fontFamily: "'Outfit', sans-serif", transition: "all 0.15s",
                  lineHeight: 1.3,
                }}>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>{sublabel}</div>
                </button>
              ))}
            </div>
          </CtrlGroup>

          {/* Theme Color */}
          <CtrlGroup label="Theme Color (Optional)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
              {THEME_COLORS.map((c) => (
                <button key={c} onClick={() => setThemeColor(themeColor === c ? "" : c)} style={{
                  width: 26, height: 26, borderRadius: "50%", background: c, padding: 0, cursor: "pointer",
                  border: themeColor === c ? "2px solid #fff" : "2px solid transparent",
                  boxShadow: themeColor === c ? `0 0 0 2px ${c}` : "none",
                  transition: "all 0.15s",
                }} title={c} />
              ))}
              <div style={{ position: "relative" }}>
                <input type="color" value={themeColor || "#D4A84B"} onChange={(e) => setThemeColor(e.target.value)}
                  title="Custom color"
                  style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid rgba(212,168,75,0.3)", cursor: "pointer", padding: 1, background: "#272320" }} />
              </div>
            </div>
            {themeColor && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.73rem", color: "#A89880" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: themeColor, flexShrink: 0 }} />
                {themeColor.toUpperCase()} · AI will build palette around this
                <button onClick={() => setThemeColor("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#6B5E4E", cursor: "pointer", fontSize: "0.72rem", padding: 0 }}>✕</button>
              </div>
            )}
          </CtrlGroup>

          {/* Special Preferences */}
          <CtrlGroup label={
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              Special Preferences
              <span style={{ background: "rgba(212,168,75,0.15)", color: "#D4A84B", fontSize: "0.58rem", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700, letterSpacing: "0.05em" }}>RECOMMENDED</span>
            </span>
          }>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us more for better results — e.g. Vastu-compliant, dark wood furniture, cat-friendly, marble flooring, compact space, north-facing room, elderly-friendly…"
              rows={4} style={{
                width: "100%", background: "#1A1712", border: "1px solid rgba(212,168,75,0.12)",
                borderRadius: "8px", padding: "0.65rem 0.85rem", color: "#F0EBE1",
                fontFamily: "'Outfit', sans-serif", fontSize: "0.8rem", resize: "none",
                outline: "none", lineHeight: 1.6, boxSizing: "border-box",
              }} />
            <div style={{ fontSize: "0.7rem", color: "#6B5E4E", marginTop: "0.35rem", lineHeight: 1.5 }}>
              💡 The more details you provide, the more personalized and realistic your design will be.
            </div>
          </CtrlGroup>

          {/* Generate button */}
          <div style={{ marginTop: "auto" }}>
            <button onClick={handleGenerate} disabled={loading} style={{
              width: "100%", padding: "0.9rem", borderRadius: "10px", border: "none",
              background: loading ? "rgba(212,168,75,0.35)" : "linear-gradient(135deg, #D4A84B, #C49238)",
              color: "#0D0B08", fontFamily: "'Outfit', sans-serif", fontSize: "0.95rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 4px 20px rgba(212,168,75,0.25)",
              letterSpacing: "0.02em",
            }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {loading ? "⏳ Generating your design…" : "✦ Generate AI Design"}
            </button>
            {design && (
              <button onClick={handleSave} style={{
                width: "100%", padding: "0.65rem", marginTop: "0.5rem",
                background: "transparent", color: "#D4A84B",
                border: "1px solid rgba(212,168,75,0.25)", borderRadius: "10px",
                fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem", cursor: "pointer",
                transition: "all 0.2s",
              }}>
                💾 Save Design {!user && <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>(sign in required)</span>}
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
      <div style={{ fontSize: "0.67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#6B5E4E", marginBottom: "0.55rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {label}
      </div>
      {children}
    </div>
  );
}
