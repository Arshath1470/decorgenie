import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  // Scroll-triggered fade-in observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1E1B16",
            color: "#E8C97A",
            border: "1px solid rgba(212,168,75,0.3)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.875rem",
          },
        }}
      />
    </>
  );
}
