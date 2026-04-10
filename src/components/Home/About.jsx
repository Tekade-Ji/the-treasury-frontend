import { useEffect, useState } from "react";

export default function About() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Slower, more majestic fade-in
  const fadeUp = (delay) =>
    `transition-all duration-1000 ease-out transform ${
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
    } ${delay}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-32 relative z-10">
      
      {/* THE IMPERIAL SLAB (The "King's Page")
        - Sharp corners (rounded-none)
        - Deep obsidian background with heavy blur
        - Inner golden glow (box-shadow)
      */}
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
          
          {/* Subtle glowing accent line above the title */}
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-8" />
          
          <h2 className={`font-serif italic text-amber-500/70 text-xl md:text-2xl mb-4 ${fadeUp("delay-200")}`}>
            Welcome to
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
              The Treasury
            </span>
          </h1>
          
          <p className={`text-amber-100/60 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed tracking-wide ${fadeUp("delay-[400ms]")}`}>
            We are engineering the ultimate nexus for digital assets. A highly curated, 
            visually immaculate ecosystem designed to make acquiring premium resources 
            entirely frictionless.
          </p>
        </div>

        {/* CORE PILLARS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-20">
          
          {/* Pillar I: The Catalog */}
          <div className={`relative space-y-5 group ${fadeUp("delay-[500ms]")}`}>
            {/* The Royal Diamond Crest */}
            <div className="w-14 h-14 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 transform rotate-45 group-hover:bg-amber-500/20 transition-all duration-500" />
              <span className="relative font-serif text-amber-400 text-xl font-bold tracking-widest">I</span>
            </div>
            <h3 className="text-2xl font-serif text-amber-100 tracking-wider">The Expanding Nexus</h3>
            <p className="text-amber-100/50 font-light leading-relaxed text-lg">
              Our vision is absolute coverage. We are systematically expanding to house every 
              major digital asset you could require. From your first login to your final download, 
              accessing elite resources has never been this effortless.
            </p>
          </div>

          {/* Pillar II: The Wallet System */}
          <div className={`relative space-y-5 group ${fadeUp("delay-[600ms]")}`}>
            <div className="w-14 h-14 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 transform rotate-45 group-hover:bg-amber-500/20 transition-all duration-500" />
              <span className="relative font-serif text-amber-400 text-xl font-bold tracking-widest">II</span>
            </div>
            <h3 className="text-2xl font-serif text-amber-100 tracking-wider">Ecosystem Economy</h3>
            <p className="text-amber-100/50 font-light leading-relaxed text-lg">
              We operate on a proprietary internal wallet system. Currently fueled by exclusive 
              redeem codes, our architecture is laying the groundwork for a seamless, real-time 
              fiat payment gateway. Load your wallet, command your assets.
            </p>
          </div>

          {/* Pillar III: Absolute Ownership */}
          <div className={`relative space-y-5 group ${fadeUp("delay-[700ms]")}`}>
            <div className="w-14 h-14 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 transform rotate-45 group-hover:bg-amber-500/20 transition-all duration-500" />
              <span className="relative font-serif text-amber-400 text-xl font-bold tracking-widest">III</span>
            </div>
            <h3 className="text-2xl font-serif text-amber-100 tracking-wider">Sovereign Ownership</h3>
            <p className="text-amber-100/50 font-light leading-relaxed text-lg">
              No endless subscriptions. No rental traps. Our philosophy is absolute ownership. 
              A single, one-time transaction grants you permanent rights and instantaneous 
              download access to your acquired assets. 
            </p>
          </div>

          {/* Pillar IV: The Experience */}
          <div className={`relative space-y-5 group ${fadeUp("delay-[800ms]")}`}>
            <div className="w-14 h-14 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 transform rotate-45 group-hover:bg-amber-500/20 transition-all duration-500" />
              <span className="relative font-serif text-amber-400 text-xl font-bold tracking-widest">IV</span>
            </div>
            <h3 className="text-2xl font-serif text-amber-100 tracking-wider">Immaculate Design</h3>
            <p className="text-amber-100/50 font-light leading-relaxed text-lg">
              Form follows function, but aesthetics reign supreme. We’ve eliminated the friction 
              of traditional marketplaces, offering a hyper-optimized, visually stunning interface 
              that makes navigation and purchasing a flawless experience.
            </p>
          </div>

        </div>

        {/* ELEGANT SIGN OFF */}
        <div className={`pt-12 relative flex flex-col items-center justify-center ${fadeUp("delay-[900ms]")}`}>
          {/* Subtle glowing accent line below */}
          <div className="w-full max-w-[200px] h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-8" />
          
          <p className="font-serif text-amber-500/70 italic tracking-widest text-lg md:text-xl">
            Acquire with ease.
          </p>
          <p className="text-amber-400 tracking-[0.3em] uppercase text-sm mt-2 font-bold">
            Own with authority.
          </p>
        </div>

      </div>
    </div>
  );
}