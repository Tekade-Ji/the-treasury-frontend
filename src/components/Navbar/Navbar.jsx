import React, { useState, useRef, useEffect } from "react";
import LogoNav from "./LogoNav";
import NavLastBtn from "./NavLastBtn";
import { useNavigate } from "react-router-dom";

// ============================================================================
// 1. MARQUEE DATA ARCHITECTURE
// ============================================================================
const menuItems = [
  { 
    name: "HOME", 
    path: "/", 
    phrases: ["SYSTEM OVERRIDE", "INITIATE VAULT ACCESS"] 
  },
  { 
    name: "THE LEDGER", 
    path: "/dashboard", 
    phrases: ["DECRYPT LEDGER", "VERIFY ASSETS"] 
  },
  { 
    name: "ABOUT", 
    path: "/about", 
    phrases: ["IMPERIAL EDICT", "BEYOND STORAGE"] 
  },
  { 
    name: "THE CODEX", 
    path: "/codex", 
    phrases: ["CORE ARCHITECTURE", "SYSTEM LORE"] 
  },
];

// ============================================================================
// 2. THE CYBER-STAR SEPARATOR
// ============================================================================
const CyberStar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
       className="mx-24 md:mx-40 shrink-0 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="currentColor"/>
    <circle cx="12" cy="12" r="3" fill="#050505"/>
  </svg>
);

// ============================================================================
// 3. INDIVIDUAL NAV ITEM
// ============================================================================
const NavItem = ({ item, navigate, setIsOpen }) => {
  const [showMarquee, setShowMarquee] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setShowMarquee(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setShowMarquee(false);
  };

  return (
    <div
      className="relative w-full flex justify-center items-center h-16 md:h-20 overflow-hidden cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        navigate(item.path);
        setIsOpen(false);
        setShowMarquee(false);
      }}
    >
      {/* BASE TEXT */}
      <div className={`text transition-opacity duration-500 ${showMarquee ? "opacity-0" : "opacity-100"}`}>
        <h3 className="text-4xl md:text-5xl font-bold">
          {item.name.split("").map((letter, i) => (
            <span key={i} style={{ "--i": i }}>
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </h3>
      </div>

      {/* RISING SPOTLIGHT MARQUEE */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-[#020202] to-transparent flex items-center transition-transform duration-500 ease-[cubic-bezier(0.625,0.05,0,1)] ${
          showMarquee ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center whitespace-nowrap animate-cyber-scroll">
          {[1, 2, 3, 4].map((loopIndex) => (
            <React.Fragment key={loopIndex}>
              {item.phrases.map((phrase, phraseIndex) => (
                <React.Fragment key={phraseIndex}>
                  <span className="text-2xl md:text-4xl font-black tracking-[0.3em] uppercase text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                    {phrase}
                  </span>
                  <CyberStar />
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. MAIN NAVBAR COMPONENT
// ============================================================================
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  return (
    <>
      <style>
        {`
          @keyframes cyberScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-25%); } 
          }
          .animate-cyber-scroll {
            animation: cyberScroll 12s linear infinite;
            will-change: transform;
          }
        `}
      </style>

      <div className="fixed top-0 left-0 w-full z-[9999999] pointer-events-auto">
        
        {/* INVISIBLE CLICK CATCHER */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* THE TRAY */}
        <div 
          className={`navMorph ${
            isOpen 
              ? "open bg-[#050505]/60 backdrop-blur-2xl [-webkit-mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]" 
              : ""
          }`}
        >
          
          <div className="navTop relative flex justify-between items-center px-10 md:px-30 py-3 text-white">
            
            {/* 🔥 FIX: Added onClick to close tray when Logo is clicked */}
            <div className="relative z-10 cursor-pointer" onClick={() => setIsOpen(false)}>
              <LogoNav />
            </div>

            {/* Menu Button - Already toggles correctly */}
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="menu absolute left-1/2 -translate-x-1/2 cursor-pointer flex flex-col items-center z-10"
            >
              <div className="menuBar h-1.5 w-24 md:w-40 bg-white rounded-full transition-all duration-300"></div>
              <span className="mt-2 text-sm tracking-widest font-semibold uppercase">
                {isOpen ? "CLOSE" : "MENU"}
              </span>
            </div>

            {/* 🔥 FIX: Added onClick to close tray when NavLastBtn is clicked */}
            <div className="relative z-10 cursor-pointer" onClick={() => setIsOpen(false)}>
              <NavLastBtn />
            </div>
            
          </div>

          <div className="navMenu w-full pb-12">
            {menuItems.map((item, index) => (
              <NavItem 
                key={index} 
                item={item} 
                navigate={navigate} 
                setIsOpen={setIsOpen} 
              />
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

export default Navbar;