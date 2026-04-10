import { useEffect, useRef } from "react";

const MouseGlow = () => {
  const glowRef = useRef(null);
  const pos = useRef({ x: -500, y: -500 });
  const glowPos = useRef({ x: -500, y: -500 });
  const requestRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const updateGlow = () => {
      const lerp = 0.35;
      glowPos.current.x += (pos.current.x - glowPos.current.x) * lerp;
      glowPos.current.y += (pos.current.y - glowPos.current.y) * lerp;

      if (glowRef.current) {
        // We calculate the center based on the NEW smaller 300px core size
        const coreSize = 300; 
        glowRef.current.style.transform = `translate3d(${
          glowPos.current.x - coreSize / 2
        }px, ${glowPos.current.y - coreSize / 2}px, 0)`;
      }

      requestRef.current = requestAnimationFrame(updateGlow);
    };

    window.addEventListener("mousemove", handleMouseMove);
    requestRef.current = requestAnimationFrame(updateGlow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0, // Keeps it perfectly sandwiched behind your main content
        overflow: "hidden" 
      }}
    >
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 300,  // 🔥 Smaller core element
          height: 300, // 🔥 Smaller core element
          borderRadius: "50%",
          pointerEvents: "none",
          
          // 🔥 Solid color + Heavy Blur = Ultra-smooth, highly optimized glow
          backgroundColor: "rgba(0, 255, 255, 0.18)", 
          filter: "blur(50px)", 
          
          transform: "translate3d(-500px,-500px,0)",
          willChange: "transform", // Tells the browser to put this on the GPU
        }}
      />
    </div>
  );
};

export default MouseGlow;