import toast from "react-hot-toast";
import { createPaymentOrder } from "../lib/api";

const PLANS = [
  {
    name: "Starter", price: "Free", period: "", featured: false,
    desc: "Perfect for exploring AI interior design.",
    features: ["3 AI designs per month", "All 9 design styles", "Color palette generation", "Budget estimation", "Standard resolution"],
    cta: "Get Started Free", action: "free",
  },
  {
    name: "Pro", price: "₹999", period: "/month", featured: true,
    desc: "For homeowners actively redesigning.",
    features: ["25 AI designs per month", "HD renders + Before/After", "Shopping recommendations", "Vastu analysis", "Export renovation plan PDF", "AR room preview"],
    cta: "Start Pro Trial", action: "pro",
  },
  {
    name: "Business", price: "₹4,999", period: "/month", featured: false,
    desc: "For interior designers & firms.",
    features: ["Unlimited designs", "White-label exports", "Client-shareable links", "API access", "Priority support", "Team seats (5 users)"],
    cta: "Contact Sales", action: "business",
  },
];

export default function PricingSection({ user }) {
  const handlePlan = async (plan) => {
    if (plan === "free") {
      document.getElementById("designer")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!user) {
      toast.error("Please sign in to upgrade your plan");
      return;
    }
    try {
      const order = await createPaymentOrder({ plan, userId: user.id });
      // Open Razorpay
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "DecorGenie AI",
        description: `${plan === "pro" ? "Pro" : "Business"} Plan`,
        order_id: order.order_id,
        handler: () => toast.success("Payment successful! Plan upgraded 🎉"),
        prefill: { email: user.email },
        theme: { color: "#D4A84B" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Payment setup failed. Please try again.");
    }
  };

  return (
    <section id="pricing" style={{ padding: "4rem 0", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: "0.5rem" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#D4A84B", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span style={{ display: "inline-block", width: 20, height: 1, background: "#D4A84B" }} />
          Pricing
        </span>
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 600, marginBottom: "0.5rem" }}>
        Simple, transparent pricing
      </div>
      <p style={{ color: "#A89880", fontSize: "0.95rem", marginBottom: "2.5rem" }}>Start free. Upgrade when you need more.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {PLANS.map((plan) => (
          <div key={plan.name} style={{
            background: plan.featured ? "#1E1B16" : "#161410",
            border: `1px solid ${plan.featured ? "rgba(212,168,75,0.4)" : "rgba(212,168,75,0.12)"}`,
            borderRadius: "20px", padding: "1.5rem", position: "relative",
          }}>
            {plan.featured && (
              <div style={{
                position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                background: "#D4A84B", color: "#0D0B08", fontSize: "0.68rem", fontWeight: 700,
                padding: "0.2rem 0.85rem", borderRadius: "20px", letterSpacing: "0.05em",
                textTransform: "uppercase", whiteSpace: "nowrap",
              }}>MOST POPULAR</div>
            )}
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B5E4E", marginBottom: "0.5rem" }}>{plan.name}</div>
            <div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", color: "#D4A84B", lineHeight: 1 }}>{plan.price}</span>
              <span style={{ fontSize: "0.8rem", color: "#6B5E4E" }}>{plan.period}</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#A89880", margin: "0.75rem 0 1rem", lineHeight: 1.5 }}>{plan.desc}</p>
            <ul style={{ listStyle: "none", marginBottom: "1.25rem" }}>
              {plan.features.map((f) => (
                <li key={f} style={{ fontSize: "0.8rem", color: "#A89880", padding: "0.3rem 0", display: "flex", gap: "0.4rem" }}>
                  <span style={{ color: "#3D7A52", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button onClick={() => handlePlan(plan.action)} style={{
              width: "100%", padding: "0.65rem",
              background: plan.featured ? "#D4A84B" : "transparent",
              color: plan.featured ? "#0D0B08" : "#D4A84B",
              border: `1px solid ${plan.featured ? "#D4A84B" : "rgba(212,168,75,0.3)"}`,
              borderRadius: "8px", fontFamily: "'Outfit', sans-serif",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            }}>{plan.cta}</button>
          </div>
        ))}
      </div>

      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" />
    </section>
  );
}
