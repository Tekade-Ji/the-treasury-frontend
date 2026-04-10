import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "@studio-freight/lenis";

export default function LenisProvider({ children }) {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smooth: true,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const style = document.createElement("style");
    style.innerHTML = `
      html, body {
        height: auto;
      }
      body {
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(style);

    return () => {
      lenis.destroy();
      document.head.removeChild(style);
    };
  }, []);

  // 🔥 Scroll to top on route change (Lenis-native)
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [location.pathname]);

  return children;
}