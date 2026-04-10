import { useEffect, useState } from "react";

export default function Codex() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fadeUp = (delay) =>
    `transition-all duration-1000 ease-out transform ${
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
    } ${delay}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-32 relative z-10">
      
      {/* THE IMPERIAL SLAB */}
      <div 
        className={`relative max-w-5xl w-full bg-[#050505]/80 backdrop-blur-3xl border border-amber-500/20 p-10 md:p-20 shadow-[0_0_80px_rgba(245,158,11,0.08),inset_0_0_60px_rgba(245,158,11,0.03)] ${fadeUp("delay-100")}`}
      >
        
        {/* ROYAL CORNER GUARDS */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-amber-500/50" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-amber-500/50" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-amber-500/50" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-amber-500/50" />

        {/* HEADER SECTION */}
        <div className="text-center mb-20 relative">
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-8" />
          
          <h2 className={`font-serif italic text-amber-500/70 text-xl md:text-2xl mb-4 ${fadeUp("delay-200")}`}>
            System Architecture
          </h2>
          
          <h1 className={`text-4xl md:text-7xl font-extrabold uppercase tracking-[0.2em] mb-8 ${fadeUp("delay-300")}`}>
            <span 
              className="text-transparent bg-clip-text"
              style={{ 
                background: "linear-gradient(to bottom right, #fef3c7, #f59e0b, #b45309)", 
                WebkitBackgroundClip: "text",
                textShadow: "0 0 40px rgba(245,158,11,0.2)"
              }}
            >
              The Codex
            </span>
          </h1>
          
          <p className={`text-amber-100/60 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed tracking-wide ${fadeUp("delay-[400ms]")}`}>
            An exposition of the underlying machinery. This document outlines the duality of our ecosystem, 
            the technology that powers it, and the philosophy behind its construction.
          </p>
        </div>

        {/* CORE PILLARS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-20">
          
          {/* Pillar I: User Interface */}
          <div className={`relative space-y-5 group ${fadeUp("delay-[500ms]")}`}>
            <div className="w-14 h-14 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 transform rotate-45 group-hover:bg-amber-500/20 transition-all duration-500" />
              <span className="relative font-serif text-amber-400 text-xl font-bold tracking-widest">I</span>
            </div>
            <h3 className="text-2xl font-serif text-amber-100 tracking-wider">The Citizen Interface</h3>
            <p className="text-amber-100/50 font-light leading-relaxed text-lg">
              A frictionless frontend designed for pure acquisition. Users navigate a high-performance marketplace, 
              manage their encrypted ledger, and instantly claim digital assets via a proprietary, code-redeemable wallet system.
            </p>
          </div>

          {/* Pillar II: Admin Command */}
          <div className={`relative space-y-5 group ${fadeUp("delay-[600ms]")}`}>
            <div className="w-14 h-14 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 transform rotate-45 group-hover:bg-amber-500/20 transition-all duration-500" />
              <span className="relative font-serif text-amber-400 text-xl font-bold tracking-widest">II</span>
            </div>
            <h3 className="text-2xl font-serif text-amber-100 tracking-wider">The Overseer Protocol</h3>
            <p className="text-amber-100/50 font-light leading-relaxed text-lg">
              A hidden command center built for absolute ecosystem control. Administrators wield the power to mint 
              wallet currency, deploy new assets into the vault, and oversee the treasury's ledger in real-time.
            </p>
          </div>

          {/* Pillar III: Tech Stack (UPDATED WITH YOUR ACTUAL STACK) */}
          <div className={`relative space-y-5 group ${fadeUp("delay-[700ms]")}`}>
            <div className="w-14 h-14 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 transform rotate-45 group-hover:bg-amber-500/20 transition-all duration-500" />
              <span className="relative font-serif text-amber-400 text-xl font-bold tracking-widest">III</span>
            </div>
            <h3 className="text-2xl font-serif text-amber-100 tracking-wider">The Infrastructure</h3>
            <p className="text-amber-100/50 font-light leading-relaxed text-lg">
              The visual layer is forged in React 19 and Tailwind CSS, driven by hardware-accelerated WebGL (Three.js) 
              and kinetic GSAP/Framer motion. The backend infrastructure relies on a high-velocity Express.js architecture, 
              immutable MongoDB ledgers, JWT cryptography, and secure Cloudinary storage vaults.
            </p>
          </div>

          {/* Pillar IV: Inspiration */}
          <div className={`relative space-y-5 group ${fadeUp("delay-[800ms]")}`}>
            <div className="w-14 h-14 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 transform rotate-45 group-hover:bg-amber-500/20 transition-all duration-500" />
              <span className="relative font-serif text-amber-400 text-xl font-bold tracking-widest">IV</span>
            </div>
            <h3 className="text-2xl font-serif text-amber-100 tracking-wider">The Aesthetic Genesis</h3>
            <p className="text-amber-100/50 font-light leading-relaxed text-lg">
              Inspired by a fusion of cyberpunk utility and imperial royalty. We rejected sterile corporate minimalism 
              to build a digital monolith—a platform that feels less like a generic store and more like an exclusive, high-stakes vault.
            </p>
          </div>

        </div>

        {/* ELEGANT DISCLAIMER BLOCK */}
        <div className={`pt-12 mt-12 border-t border-amber-500/20 relative flex flex-col items-center justify-center text-center ${fadeUp("delay-[900ms]")}`}>
          
          <h4 className="text-amber-500 tracking-[0.3em] uppercase text-sm font-bold mb-6">
            Developer Edict & Sovereign Disclaimer
          </h4>
          
          <p className="font-serif text-amber-100/40 italic tracking-wide text-base md:text-lg max-w-4xl leading-relaxed">
            This platform is a masterclass prototype engineered strictly to demonstrate full-stack architectural dominance and UI/UX capability. 
            All digital assets displayed within the vault are placeholders operating under fair use for portfolio showcase purposes. 
            All intellectual property remains sovereign to its original creators. Zero fiat currency is extracted, and no monetary gain is derived from this ecosystem. 
            It is a pure proof of concept, executed flawlessly.
          </p>

        </div>

      </div>
    </div>
  );
}