import { useEffect, useRef, useState } from "react";

export default function AnimatedBackground({ children, showHero = true }) {
  // ------------------------------------------------------------------
  // 1. REFS & STATE
  // ------------------------------------------------------------------
  // We use refs for things that update constantly (like mouse pos or scroll)
  // because updating React state 60 times a second will cause major lag.
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const lastScrollY = useRef(0);

  // Tracks exactly where the mouse is on the screen, and if it's currently on the page.
  const mouse = useRef({ x: 0, y: 0, active: false });

  // React state is fine for things that only render once or change rarely.
  const [hoveredWord, setHoveredWord] = useState(null);
  const [randomBlobs, setRandomBlobs] = useState([]);

  const headingWords = ["Welcome", "to", "The Treasury"];

  // Detect mobile to drop the particle count and save phone batteries.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 80 : 200;

  // Our core cyberpunk/neon color palette
  const colors = [
    "255,255,255", // White
    "168,85,247", // Purple
    "59,130,246", // Blue
    "34,211,238", // Cyan
    "252,50,28", // Red
    "250,204,21", // Yellow
    "219,39,119", // Pink
  ];

  // ------------------------------------------------------------------
  // 2. SCATTERED BACKGROUND BLOBS
  // ------------------------------------------------------------------
  // This runs once on mount. It creates 25 static glowing blobs and maps
  // them down the ENTIRE absolute height of the page using percentages.
  useEffect(() => {
    const blobColors = [
      "bg-cyan-500/10", // Electric Cyan
      "bg-blue-600/15", // Deep Electric Blue
      "bg-cyan-400/10", // Soft Cyan Glow
      "bg-blue-400/10", // Sky Blue Neon
      "bg-indigo-500/10", // Deep Cold Blue
    ];

    const blobs = Array.from({ length: 25 }).map((_, i) => ({
      size: Math.random() * 30 + 20,
      top: Math.random() * 100,
      left: Math.random() * 100,
      color: blobColors[Math.floor(Math.random() * blobColors.length)],
      id: i,
    }));

    setRandomBlobs(blobs);
  }, []);

  // ------------------------------------------------------------------
  // 3. MOUSE TRACKING
  // ------------------------------------------------------------------
  // We track `clientX` and `clientY`. This is the exact coordinate on your
  // physical monitor screen, completely ignoring how far down the page you scrolled.
  // We need this because our canvas is `position: fixed` to the monitor viewport.
  useEffect(() => {
    const move = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      mouse.current.active = true;
    };
    const leave = () => {
      mouse.current.active = false;
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);

  // ------------------------------------------------------------------
  // 4. THE GOD-TIER CANVAS ENGINE
  // ------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    let particles = [];
    let frameId;
    lastScrollY.current = window.scrollY; // Capture initial scroll position

    const getRandomColor = () =>
      colors[Math.floor(Math.random() * colors.length)];

    // Generates the initial layout of the particles inside the viewport
    const initEntities = (width, height) => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;

        // 20% of particles become large "nodes", 80% become smaller "dust"
        const isLarge = Math.random() > 0.8;
        const baseRadius = isLarge
          ? Math.random() * 3 + 2.5
          : Math.random() * 1.5 + 1.0;

        particles.push({
          x,
          y, // Current actual position
          homeX: x,
          homeY: y, // The target position they always want to return to
          vx: (Math.random() - 0.5) * 0.2, // X Velocity
          vy: (Math.random() - 0.5) * 0.2, // Y Velocity
          baseRadius,
          seed: Math.random() * 1000, // Random seed so they pulse at different times
          color: getRandomColor(),
        });
      }
    };

    // Locks the canvas size strictly to the user's browser window size (viewport).
    // It recalculates ONLY if they resize their browser window.
    const syncSize = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        initEntities(width, height);
      }
    };

    syncSize();
    const observer = new ResizeObserver(() => syncSize());
    observer.observe(document.body);

    // -- PHYSICS CONSTANTS --
    const repelRadius = 250; // Blast radius. Mouse affects anything within 250px.
    const repelRadiusSq = repelRadius * repelRadius; // Pre-squared radius for CPU optimization.
    const returnSpeed = 0.04; // How fast they snap back to 'homeX/Y' after moving.
    const friction = 0.85; // How quickly they lose momentum (simulated air resistance).

    // -- THE MAIN RENDER LOOP (Runs 60 times a second) --
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Wipe the previous frame
      const now = Date.now();

      // Calculate how far the user scrolled since the exact last frame.
      const currentScroll = window.scrollY;
      const scrollDelta = currentScroll - lastScrollY.current;
      lastScrollY.current = currentScroll;

      particles.forEach((p) => {
        // 🔥 THE TREADMILL EFFECT 🔥
        // Instead of moving the canvas, we move the particles in the opposite
        // direction of the scroll. This makes it look like you are scrolling past them.
        p.y -= scrollDelta;
        p.homeY -= scrollDelta;

        // 🔥 INFINITE WRAP AROUND 🔥
        // If a particle scrolls off the top of the screen, we instantly teleport
        // it to the bottom. This prevents us from ever running out of particles.
        if (p.homeY < -100) {
          p.homeY += canvas.height + 200;
          p.y += canvas.height + 200;
          p.x = Math.random() * canvas.width; // Shuffle its horizontal position so it feels random
        } else if (p.homeY > canvas.height + 100) {
          p.homeY -= canvas.height + 200;
          p.y -= canvas.height + 200;
          p.x = Math.random() * canvas.width;
        }

        // Calculate distance between the mouse and the particle
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;

        // We use Squared Distance (a^2 + b^2 = c^2).
        // CPU's hate calculating true square roots (Math.sqrt), so we skip it
        // entirely unless the particle is actually inside the blast radius.
        const distSq = dx * dx + dy * dy;

        // 🔥 THE MOUSE REPEL LOGIC 🔥
        if (mouse.current.active && distSq < repelRadiusSq) {
          // It's inside the blast radius! Now we do the heavy math.
          const dist = Math.sqrt(distSq) || 1;

          // Force gets stronger the closer the mouse is to the particle
          const force = (repelRadius - dist) / repelRadius;

          // Blast them in the opposite direction of the mouse.
          // The '5.0' is the aggression multiplier. Crank it up for more chaos.
          p.vx += (dx / dist) * force * 5.0;
          p.vy += (dy / dist) * force * 5.0;
        } else {
          // Mouse is gone. Gently pull the particle back toward its designated home.
          p.vx += (p.homeX - p.x) * returnSpeed;
          p.vy += (p.homeY - p.y) * returnSpeed;
        }

        // Apply friction to slow down the velocity over time
        p.vx *= friction;
        p.vy *= friction;

        // Actually move the particle by applying the velocity to its coordinates
        p.x += p.vx;
        p.y += p.vy;

        // Gentle bounce if they hit the left/right edges of the screen
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;

        // 🔥 RENDERING THE NEON EFFECT 🔥
        // We use Math.sin combined with the unique seed so they pulse smoothly at random intervals.
        const opacity = 0.5 + Math.sin(now * 0.002 + p.seed) * 0.5;
        const scale = 0.8 + Math.sin(now * 0.003 + p.seed) * 0.2;
        const radius = p.baseRadius * scale;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${opacity})`;

        // Apply heavier blur/glow to the big nodes, light blur to the dust
        ctx.shadowBlur = p.baseRadius > 2.5 ? 12 : 4;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.fill();
      });

      // Loop to the next frame
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [PARTICLE_COUNT]);

  // ------------------------------------------------------------------
  // 5. BULLETPROOF CLICK RIPPLE
  // ------------------------------------------------------------------
  // We append this directly to `document.body` instead of the container.
  // This ensures that no matter where you click, or what z-index traps you have,
  // the ripple will ALWAYS spawn above the entire UI on your exact cursor pixel.
  const handleClick = (e) => {
    if (document.querySelectorAll(".click-ripple").length > 5) return;

    const ripple = document.createElement("div");
    ripple.className =
      "click-ripple fixed z-[9999] rounded-full border-2 border-white/50 pointer-events-none";

    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    ripple.style.width = "20px";
    ripple.style.height = "20px";
    ripple.style.transform = "translate(-50%, -50%) scale(0)";
    ripple.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"; // Snappy start, smooth fade
    ripple.style.opacity = "1";
    ripple.style.boxShadow = "0 0 15px rgba(255,255,255,0.4)";

    document.body.appendChild(ripple);

    // Forces the browser to render the initial scale(0) before starting the animation
    requestAnimationFrame(() => {
      ripple.style.transform = "translate(-50%, -50%) scale(6)";
      ripple.style.opacity = "0";
    });

    // Garbage collection: Remove the DOM node after the animation finishes
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative w-full min-h-screen bg-black text-white"
    >
      {/* LAYER 1: The Blobs & Grid.
        This container uses 'absolute inset-0'. Because the parent is 'relative', 
        this layer naturally stretches all the way down to the bottom of whatever 
        children content you pass into this component. It scrolls naturally. 
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* CSS Grid (Linear Gradients) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Scattered Blobs */}
        {randomBlobs.map((b) => (
          <div
            key={b.id}
            className={`absolute rounded-full blur-3xl ${b.color}`}
            style={{
              width: `${b.size}vw`,
              height: `${b.size}vw`,
              top: `${b.top}%`,
              left: `${b.left}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* LAYER 2: The Particle Canvas.
        This is 'fixed'. It sits on top of the blobs but exactly covers your monitor. 
        It never scrolls, but the JavaScript logic tricks your eye into thinking it does.
      */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full z-[1] pointer-events-none"
      />

      {/* LAYER 3: The Hero Text (Optional)
        Sits above the background layers (z-10).
      */}
      {showHero && (
        <div className="relative z-10 text-center p-20 pt-32">
          <h1 className="text-5xl md:text-6xl font-extrabold flex flex-wrap justify-center">
            {headingWords.map((word, idx) => {
              // Split word into characters, but we'll also add a space AFTER the word
              // unless it's the last word in the array.
              const letters = word.split("");
              const isHovered = hoveredWord === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredWord(idx)}
                  onMouseLeave={() => setHoveredWord(null)}
                  className="inline-flex mr-[0.3em]" // Control the space between words here
                >
                  {letters.map((letter, lidx) => (
                    <span
                      key={lidx}
                      className="relative overflow-hidden cursor-default"
                    >
                      {/* Top Letter */}
                      <span
                        className="inline-block"
                        style={{
                          transition: `all 0.5s ease ${lidx * 0.05}s`,
                          transform: isHovered
                            ? "translateY(-100%)"
                            : "translateY(0)",
                          opacity: isHovered ? 0 : 1,
                          background:
                            "linear-gradient(to right, #3b82f6, #4338ca)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {letter}
                      </span>

                      {/* Bottom Letter */}
                      <span
                        className="absolute left-0 top-0"
                        style={{
                          transition: `all 0.5s ease ${lidx * 0.05}s`,
                          transform: isHovered
                            ? "translateY(0)"
                            : "translateY(100%)",
                          color: "#FD321C",
                        }}
                      >
                        {letter}
                      </span>
                    </span>
                  ))}
                </div>
              );
            })}
          </h1>

          <p className="mt-4 text-gray-300 text-lg md:text-xl max-w-xl mx-auto">
            A place for all your digital assets — fast, secure, and beautiful.
          </p>
        </div>
      )}

      {/* LAYER 4: Your Actual App Content
        Everything you wrap inside <AnimatedBackground> goes here.
      */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
