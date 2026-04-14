// React tools: useState (memory), useEffect (triggers), useMemo (math memory), useRef (element pointing)
import React, { useEffect, useState, useMemo, useRef } from "react";
// Steering wheel for routing
import { useNavigate } from "react-router-dom";
// Your custom phone line to the backend
import API from "../../api/axios";
// Importing Lucide icons for the custom dropdowns (Assuming you have this from your SearchBar)
import { ChevronDown, Check } from "lucide-react";

// ==========================================
// 🛠️ CUSTOM REUSABLE DROPDOWN COMPONENT
// We build this outside the main component so you can reuse it infinitely.
// ==========================================
const MultiSelectDropdown = ({ title, options, selectedItems, toggleItem, themeColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the dropdown if the user clicks anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Theme logic to easily switch colors (cyan for creators, purple for tags)
  const theme = {
    border: themeColor === "cyan" ? "border-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,255,255,0.5)]" : "border-purple-500/50 focus:border-purple-500 focus:shadow-[0_0_10px_rgba(168,85,247,0.5)]",
    text: themeColor === "cyan" ? "text-cyan-300" : "text-purple-300",
    bgHover: themeColor === "cyan" ? "hover:bg-cyan-500/20" : "hover:bg-purple-500/20",
    check: themeColor === "cyan" ? "text-cyan-400" : "text-purple-400",
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      {/* DROPDOWN BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 bg-black/50 border ${theme.border} ${theme.text} px-4 py-2 rounded-lg outline-none transition-all cursor-pointer uppercase tracking-wider text-sm select-none`}
      >
        <span>
          {title} {selectedItems.length > 0 && `(${selectedItems.length})`}
        </span>
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} />
      </button>

      {/* DROPDOWN MENU PANEL */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-full min-w-[200px] max-h-[250px] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 flex flex-col gap-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {options.length === 0 ? (
            <div className="text-white/50 text-xs text-center py-2 uppercase tracking-widest">No options</div>
          ) : (
            options.map((option) => {
              const isSelected = selectedItems.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => toggleItem(option)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${theme.bgHover} ${isSelected ? "bg-white/5" : ""}`}
                >
                  <span className={`text-sm uppercase tracking-wider ${isSelected ? "text-white font-bold" : "text-white/70"}`}>
                    {option}
                  </span>
                  {/* Show a checkmark if this specific item is selected */}
                  {isSelected && <Check size={16} className={theme.check} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 🚀 MAIN PAGE COMPONENT
// ==========================================
const GetAllProducts = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // 🔮 THE MASTER KEYWORD ARRAY
  const DESCRIPTION_KEYWORDS = [
    "Direct Play",
    "Download",
    "Game",
    "Asset",
    "VR",
    "Template"
  ];

  // --- MULTI-FILTER MEMORY ---
  const [activeCreators, setActiveCreators] = useState([]);
  const [activeKeywords, setActiveKeywords] = useState([]);

  // --- TOGGLE FUNCTIONS ---
  const toggleCreator = (creator) => {
    setActiveCreators((prev) => 
      prev.includes(creator) ? prev.filter((c) => c !== creator) : [...prev, creator]
    );
  };

  const toggleKeyword = (keyword) => {
    setActiveKeywords((prev) => 
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  };

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const fetchWithRetry = async (fn) => {
    while (true) {
      try {
        const res = await fn();
        return res; 
      } catch (err) {
        console.log("Retrying...");
        await new Promise((res) => setTimeout(res, 1500)); 
      }
    }
  };

  // 🔥 FETCH ON LOAD
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetchWithRetry(() => API.get("/api/products"));
        setProducts(shuffleArray(res.data.data));
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []); 

  const getImageSrc = (thumbnail, images = []) => {
    const src = thumbnail || images?.[0]; 
    if (!src) return "/placeholder.png"; 
    if (src.startsWith("http")) return src; 

    const cleanFilename = src.replace(/^uploads[\\/]/, "").replace(/\\/g, "/");
    return `${import.meta.env.VITE_API_URL}/uploads/${cleanFilename}`;
  };

  // --- MEMORY OPTIMIZATION: EXTRACT CREATORS ---
  const uniqueCreators = useMemo(() => {
    const names = products.map((p) => {
      if (p.createdBy) {
        return p.createdBy.name || p.createdBy.username;
      }
      return null;
    }).filter(Boolean); 
    
    return [...new Set(names)];
  }, [products]);

  // --- THE MULTI-FILTER ENGINE ---
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // RULE 1: CREATORS
      const productCreatorName = product.createdBy?.name || product.createdBy?.username;
      const matchesCreator = activeCreators.length === 0 || activeCreators.includes(productCreatorName);

      // RULE 2: KEYWORDS
      const desc = (product.description || "").toLowerCase();
      const matchesKeyword = activeKeywords.length === 0 || activeKeywords.some((kw) => 
        desc.includes(kw.toLowerCase())
      );

      return matchesCreator && matchesKeyword;
    });
  }, [products, activeCreators, activeKeywords]); 

  // ==========================================
  // THE VISUALS (HTML/JSX)
  // ==========================================
  return (
    <div className="text-white px-4 md:px-10 py-8 md:py-12 w-full overflow-hidden">
      <div className="max-w-[1100px] mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6 w-full">
          
          <h1 className="text-start text-4xl md:text-5xl font-extrabold tracking-widest capitalize bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text shrink-0">
            Explore
          </h1>

          {/* UI CONTROLS: Clean Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
            
            {/* RESET BUTTON */}
            {/* Kept on the left side of the dropdowns for easy access */}
            {(activeCreators.length > 0 || activeKeywords.length > 0) && (
              <button 
                onClick={() => { setActiveCreators([]); setActiveKeywords([]); }} 
                className="px-4 py-2 w-full sm:w-auto cursor-pointer text-pink-400 hover:text-white hover:bg-pink-500/20 rounded-lg transition-all border border-transparent hover:border-pink-500/50 uppercase tracking-widest text-sm font-bold"
              >
                Clear Filters ✕
              </button>
            )}

            {/* CREATOR DROPDOWN (Cyan) */}
            <MultiSelectDropdown 
              title="Creators" 
              options={uniqueCreators} 
              selectedItems={activeCreators} 
              toggleItem={toggleCreator} 
              themeColor="cyan"
            />

            {/* TAG/KEYWORD DROPDOWN (Purple) */}
            <MultiSelectDropdown 
              title="Tags" 
              options={DESCRIPTION_KEYWORDS} 
              selectedItems={activeKeywords} 
              toggleItem={toggleKeyword} 
              themeColor="purple"
            />
            
          </div>
        </div>

        {/* THE GRID DISPLAY */}
        {filteredProducts.length === 0 ? (
          <div className="text-center text-cyan-400/50 mt-20 text-2xl font-bold tracking-wider uppercase animate-pulse">
            No products match your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 justify-items-center">
            
            {filteredProducts.map((product) => {
              const image = getImageSrc(product.thumbnail, product.images);

              return (
                <div
                  key={product._id} 
                  onClick={() => navigate(`/product/${product._id}`)} 
                  className="relative w-full max-w-[240px] h-[320px] cursor-pointer group hover:scale-105 transition-all ease-in-out"
                  style={{ perspective: "1200px" }} 
                >
                  <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[0_0_20px_5px_rgba(0,255,255,0.4)] transition-opacity duration-300 opacity-40 group-hover:opacity-80" />

                  <div
                    className="relative w-full h-full rounded-2xl bg-black border border-cyan-400/40 shadow-[0_0_10px_rgba(0,255,255,0.6),0_0_20px_rgba(168,85,247,0.5),0_0_30px_rgba(236,72,153,0.4)] transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.9),0_0_40px_rgba(168,85,247,0.8),0_0_60px_rgba(236,72,153,0.7)] group-hover:rotate-y-180"
                    style={{ transformStyle: "preserve-3d", transformOrigin: "center" }}
                  >
                    
                    {/* FRONT */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                      <img
                        src={image}
                        alt={product.title}
                        className="w-full h-[80%] object-cover brightness-110 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="h-[20%] bg-black/80 backdrop-blur-md flex items-center justify-center px-4">
                        <h2 className="text-lg font-bold text-white text-center truncate uppercase">
                          {product.title}
                        </h2>
                      </div>
                    </div>

                    {/* BACK */}
                    <div
                      className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-6"
                      style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                    >
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                      <div className="relative z-10 flex flex-col items-center space-y-4">
                        <h2 className="text-2xl font-extrabold text-cyan-400 uppercase [text-shadow:0_1px_0_#0e7490,0_2px_0_#0c6a85,0_3px_0_#0a607a,0_4px_6px_rgba(0,0,0,0.6),0_0_8px_rgba(34,211,238,0.7)]">
                          {product.title}
                        </h2>

                        <p className="text-sm text-white max-h-[6rem] overflow-hidden capitalize [text-shadow:0_2px_1px_rgba(0,0,0,0.6),0_4px_6px_rgba(0,0,0,0.5),0_0_6px_rgba(255,255,255,0.3)]">
                          {product.description || "NO DESCRIPTION AVAILABLE"}
                        </p>

                        <div className="px-4 py-2 cursor-pointer rounded-full border border-cyan-400 text-cyan-300 bg-white/10 shadow-[0_0_10px_rgba(0,255,255,0.5)] select-none uppercase">
                          MORE DETAILS →
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GetAllProducts;