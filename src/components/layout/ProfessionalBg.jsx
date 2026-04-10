import { useEffect, useRef } from "react";

const ProfessionalBg = ({ children }) => {
  // ------------------------------------------------------------------
  // 1. REFS
  // ------------------------------------------------------------------
  const canvasRef = useRef(null);
  const shapes = useRef([]);
  const points = useRef([]);
  const lastScrollY = useRef(0); // Tracks scroll for the Treadmill Effect

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });

    let frameId;
    lastScrollY.current = window.scrollY;

    const random = (min, max) => Math.random() * (max - min) + min;

    // ------------------------------------------------------------------
    // 2. FIXED OBJECT POOLING (Zero Garbage Collection)
    // ------------------------------------------------------------------
    // Instead of constantly pushing/splicing arrays, we create exactly 
    // what we need once. We recycle these objects infinitely.
    const initPools = (width, height) => {
      shapes.current = [];
      points.current = [];

      // 🔷 Create exactly 20 shapes
      for (let i = 0; i < 20; i++) {
        shapes.current.push({
          x: random(0, width),
          y: random(0, height),
          vx: random(-0.3, 0.3),
          vy: random(-0.3, 0.3),
          size: random(20, 50),
          shapeType: Math.floor(random(0, 3)),
        });
      }

      // 🔵 Create exactly 100 network points
      for (let i = 0; i < 100; i++) {
        points.current.push({
          x: random(0, width),
          y: random(0, height),
          vx: random(-0.4, 0.4),
          vy: random(-0.4, 0.4),
        });
      }
    };

    // Lock canvas strictly to the monitor viewport size
    const syncSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        initPools(width, height);
      }
    };

    syncSize();
    // Use ResizeObserver instead of window resize event for better performance
    const observer = new ResizeObserver(() => syncSize());
    observer.observe(document.body);

    // ------------------------------------------------------------------
    // 3. DRAWING FUNCTIONS
    // ------------------------------------------------------------------
    const drawShape = (s) => {
      ctx.globalAlpha = 0.2; // Constant subtle alpha
      ctx.fillStyle = "rgba(0,255,255,0.2)";

      ctx.beginPath();
      if (s.shapeType === 0) {
        // Rectangle
        ctx.rect(s.x, s.y, s.size, s.size);
      } else if (s.shapeType === 1) {
        // Right Triangle
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.size, s.y + s.size / 2);
        ctx.lineTo(s.x, s.y + s.size);
        ctx.closePath();
      } else {
        // Diamond
        ctx.moveTo(s.x, s.y + s.size / 2);
        ctx.lineTo(s.x + s.size / 2, s.y);
        ctx.lineTo(s.x + s.size, s.y + s.size / 2);
        ctx.lineTo(s.x + s.size / 2, s.y + s.size);
        ctx.closePath();
      }
      ctx.fill();
    };

    const drawNetwork = () => {
      ctx.save();

      // 🔵 Draw nodes
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,255,255,0.7)";
      for (let i = 0; i < points.current.length; i++) {
        const p = points.current[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 🔗 Draw connections (Optimized O(n^2) loop)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < points.current.length; i++) {
        const p1 = points.current[i];

        for (let j = i + 1; j < points.current.length; j++) {
          const p2 = points.current[j];

          // FAST FAIL: If they are too far apart vertically, skip math instantly. (Huge CPU saver)
          if (Math.abs(p1.y - p2.y) > 120) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          // Connect if distance is < 120px (120 * 120 = 14400)
          if (distSq < 14400) {
            ctx.globalAlpha = 1 - distSq / 14400; // Fade out as they get further apart
            ctx.strokeStyle = `rgba(0,255,255,${ctx.globalAlpha})`;
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    };

    // ------------------------------------------------------------------
    // 4. MAIN RENDER LOOP
    // ------------------------------------------------------------------
    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scroll delta for the Treadmill Effect
      const currentScroll = window.scrollY;
      const scrollDelta = currentScroll - lastScrollY.current;
      lastScrollY.current = currentScroll;

      // We add a 150px buffer outside the screen. 
      // This allows networks to connect *before* they slide onto the screen.
      const buffer = 150; 

      // Update Shapes
      shapes.current.forEach((s) => {
        s.y -= scrollDelta; // Treadmill
        s.x += s.vx;        // Natural float
        s.y += s.vy;

        // Infinite Wrap
        if (s.y < -buffer) {
          s.y += canvas.height + buffer * 2;
          s.x = random(0, canvas.width); // Shuffle X on wrap
        } else if (s.y > canvas.height + buffer) {
          s.y -= canvas.height + buffer * 2;
          s.x = random(0, canvas.width);
        }

        // Left/Right Bounce
        if (s.x < 0 || s.x > canvas.width) s.vx *= -1;

        drawShape(s);
      });

      // Update Points
      points.current.forEach((p) => {
        p.y -= scrollDelta; // Treadmill
        p.x += p.vx;        // Natural float
        p.y += p.vy;

        // Infinite Wrap
        if (p.y < -buffer) {
          p.y += canvas.height + buffer * 2;
          p.x = random(0, canvas.width);
        } else if (p.y > canvas.height + buffer) {
          p.y -= canvas.height + buffer * 2;
          p.x = random(0, canvas.width);
        }

        // Left/Right Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      });

      drawNetwork();

      frameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* We apply fixed positioning here so the canvas never moves, 
        and the JS handles the illusion of scrolling. 
      */}
      <style>
        {`
          .professional-bg {
            position: fixed; /* 🔥 CHANGED from absolute to fixed */
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 0;
            pointer-events: none;
          }
        `}
      </style>

      <canvas ref={canvasRef} className="professional-bg" />

      {/* 🚫 untouched */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

export default ProfessionalBg;