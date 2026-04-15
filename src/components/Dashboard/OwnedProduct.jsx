// ==========================================
// 🛠️ TOOLBOX (IMPORTS)
// Think of these as the fundamental building blocks we need before writing the page.
// ==========================================
// 'useEffect' lets us trigger automatic actions (like fetching data when the page loads).
// 'useState' gives our page short-term memory to remember things like what you typed in the search bar.
import { useEffect, useState } from "react";
// Pulls in our custom security system so we know who is logged in and what items they own.
import { useAuth } from "../../context/AuthContext";
// 'useNavigate' is our steering wheel. It lets us drive the user to a different page when they click a card.
import { useNavigate } from "react-router-dom";
// API is the custom phone line we built to talk to our backend database securely.
import API from '../../api/axios'

const OwnedProducts = () => {
  // -----------------------------
  // 🧠 COMPONENT MEMORY (State Hooks)
  // -----------------------------
  // Ask the Auth system for the list of IDs this user owns, and if it's currently loading.
  const { purchasedProducts, loading } = useAuth();
  
  // 'products' remembers the raw list of items from the database.
  const [products, setProducts] = useState([]);
  // 'filtered' remembers the finalized list we actually draw on screen (after searching/sorting).
  const [filtered, setFiltered] = useState([]);
  // 'search' remembers what letters the user typed into the search bar.
  const [search, setSearch] = useState("");
  // 'sort' remembers which option they clicked in the dropdown menu (e.g., 'latest', 'oldest').
  const [sort, setSort] = useState("latest");
  
  const navigate = useNavigate();

  // -----------------------------
  // 📦 AUTOMATIC TRIGGER: FETCH OWNED PRODUCTS
  // -----------------------------
  useEffect(() => {
    const fetchOwned = async () => {
      try {
        // HELPER: The Stubborn Fetcher
        // If the server glitches, it will try again up to 3 times before giving up.
        const fetchWithRetry = async (fn, retries = 3) => {
          try {
            return await fn();
          } catch (err) {
            if (retries <= 0) throw err; 
            return fetchWithRetry(fn, retries - 1); 
          }
        };

        // Dial the backend to get EVERY product in the store
        const res = await fetchWithRetry(() => API.get("/api/products"));
        
        // Filter the massive list: ONLY keep the product if its ID matches one in the user's 'purchasedProducts' vault.
        const owned = res.data.data.filter((p) =>
          purchasedProducts?.includes(p._id)
        );
        
        // Save the final list of owned items into our component's memory.
        setProducts(owned);
      } catch (err) {
        console.error(err);
      }
    };

    // If the global auth system is finished loading, go fetch the products.
    if (!loading) fetchOwned();
  }, [purchasedProducts, loading]); 

  // -----------------------------
  // 🔍 AUTOMATIC TRIGGER: FILTER & SORT ENGINE
  // This engine runs automatically anytime the search text, sort dropdown, or product list changes.
  // -----------------------------
  useEffect(() => {
    // Make a fresh copy of the products list so we don't accidentally destroy the original data.
    let data = [...products];

    // If the user typed anything in the search bar...
    if (search) {
      // Filter the list. Convert everything to lowercase so "SWORD" matches "sword".
      data = data.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort the data based on what is selected in the dropdown
    switch (sort) {
      case "latest":
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "name":
        data.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "nameDesc":
        data.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    // Save the fully processed list into the 'filtered' memory so React can draw it.
    setFiltered(data);
  }, [products, search, sort]); 

  // -----------------------------
  // 🖼️ HELPER: IMAGE ROUTER
  // Figures out which picture to show for the card.
  // -----------------------------
  const getImageSrc = (thumbnail, images = []) => {
    const src = thumbnail || images?.[0]; // Prefer the thumbnail, fallback to the first image.
    if (!src) return "/placeholder.png"; // If completely empty, show a blank placeholder.
    if (src.startsWith("http")) return src; // If it's a direct web link, use it.

    // If it's a file saved on your server, clean up the slashes and build the full URL path.
    const clean = src.replace(/^uploads[\\/]/, "").replace(/\\/g, "/");
    return `${import.meta.env.VITE_API_URL}/uploads/${clean}`;
  };

  // -----------------------------
  // 💥 HELPER: CLICK EFFECT MATH
  // Creates an expanding ripple effect perfectly centered where the user's mouse clicked.
  // -----------------------------
  const createRipple = (e) => {
    const btn = e.currentTarget; 
    const circle = document.createElement("span"); 

    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - btn.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - btn.offsetTop - radius}px`;
    circle.classList.add("ripple"); 

    const ripple = btn.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();

    btn.appendChild(circle);
  };

  // -----------------------------
  // ⏳ HIGH-TECH LOADING UI
  // Shows this screen while waiting for the database to respond.
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-cyan-400 font-mono tracking-widest uppercase bg-transparent">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-y-2 border-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.4)]"></div>
          <div className="absolute inset-2 border-x-2 border-purple-500 rounded-full animate-[spin_1.5s_reverse_infinite] shadow-[0_0_15px_rgba(168,85,247,0.4)]"></div>
          <div className="absolute inset-6 bg-cyan-500/20 rounded-full animate-pulse"></div>
        </div>
        <p className="animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Decrypting Secure Vault...</p>
      </div>
    );
  }

  // ==========================================
  // THE VISUALS (HTML/JSX & CSS)
  // ==========================================
  return (
    <>
      {/* 🔥 CUSTOM CSS ANIMATIONS */}
      <style>
        {`
        /* HOW TO CHANGE LASER SPEED: Change '2s' to '1s' in the tailwind class below to make it bounce faster. */
        @keyframes scanYoyo {
          0% { top: 0%; opacity: 0.1; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: calc(100% - 4px); opacity: 0.1; }
        }

        /* The math for the expanding circle when you click a card */
        @keyframes rippleAnim {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        .ripple {
          position: absolute;
          border-radius: 9999px;
          background: rgba(34, 211, 238, 0.3); /* Cyan color */
          transform: scale(0);
          animation: rippleAnim 600ms ease-out;
          pointer-events: none;
        }
        `}
      </style>

      {/* MAIN WRAPPER 
        NOTE: Transparent background so it seamlessly layers over your parent website design.
      */}
      <div className="text-white relative w-full min-h-screen font-sans bg-transparent">

        {/* 🧠 CONTENT CONTAINER */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">

          {/* ==========================================
              🏷️ HEADER SECTION
              ========================================== */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black tracking-[0.2em] uppercase bg-gradient-to-b from-white to-gray-400 text-transparent bg-clip-text drop-shadow-md mb-4">
              Your Vault
            </h1>
            
            <div className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-3 shadow-[0_0_8px_#22d3ee]"></span>
              <p className="text-cyan-400/80 tracking-widest text-xs md:text-sm font-bold uppercase">
                <span className="text-white">{filtered.length}</span> Assets Secured
              </p>
            </div>
          </div>

          {/* ==========================================
              🔍 FILTER & SEARCH BAR
              ========================================== */}
          {/* HOW TO CHANGE LAYOUT: flex-col stacks them on mobile, md:flex-row aligns them horizontally on desktop. */}
          <div className="flex flex-col md:flex-row w-full gap-4 mb-16 items-center justify-center max-w-3xl mx-auto">
            
            {/* Search Input */}
            <div className="relative w-full md:flex-1 group">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <input
                type="text"
                placeholder="Search Database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="relative w-full px-6 py-4 bg-black/60 border border-white/10 rounded-full focus:outline-none focus:border-cyan-400 focus:bg-black/80 transition-all text-sm tracking-wider placeholder:text-gray-500 font-medium z-10 shadow-inner"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full md:w-auto group">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="relative w-full md:w-auto px-6 py-4 bg-black/60 border border-white/10 rounded-full cursor-pointer hover:border-purple-400/50 transition-all text-sm font-bold tracking-wider outline-none focus:border-purple-400 focus:bg-black/80 appearance-none z-10"
              >
                <option value="latest" className="bg-gray-900">SORT: LATEST</option>
                <option value="oldest" className="bg-gray-900">SORT: OLDEST</option>
                <option value="name" className="bg-gray-900">SORT: A-Z</option>
                <option value="nameDesc" className="bg-gray-900">SORT: Z-A</option>
              </select>
            </div>
          </div>

          {/* ==========================================
              🃏 THE CARDS GRID (Upgraded Sci-Fi Design)
              ========================================== */}
          {filtered.length === 0 ? (
            // If the search yields zero results, show this
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <p className="text-center text-gray-400 tracking-widest font-bold uppercase">
                No matching records found.
              </p>
            </div>
          ) : (
            // Responsive Grid: 1 col on mobile, 2 on tablet, 3 on standard desktop, 4 on ultrawide monitors
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 justify-items-center pb-20">
              
              {/* Loop through the filtered array and draw the cards */}
              {filtered.map((product) => {
                const image = getImageSrc(product.thumbnail, product.images);

                return (
                  <div
                    key={product._id}
                    onClick={(e) => {
                      createRipple(e); // Fire the expanding circle effect
                      // Wait 200ms before changing pages so the user sees the cool animation
                      setTimeout(() => { navigate(`/product/${product._id}`); }, 200); 
                    }}
                    // HOW TO CHANGE CARD SIZE: Adjust max-w-[320px] to make the cards wider or thinner.
                    // 'group' is critical: It lets us trigger hover effects on inner elements when the main card is hovered.
                    // 'active:scale-[0.97]' physically presses the card down when clicked.
                    className="relative w-full max-w-[320px] aspect-[3/4] cursor-pointer group active:scale-[0.97] active:brightness-125 transition-all duration-150"
                  >
                    
                    {/* --- SCI-FI CORNER BRACKETS --- */}
                    {/* HOW IT WORKS: These are absolute positioned exactly on the corners. 
                        On hover (group-hover), they translate outward to "expand" the target frame. */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/50 group-hover:border-cyan-400 group-hover:-translate-x-2 group-hover:-translate-y-2 transition-all duration-300 z-20 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/50 group-hover:border-cyan-400 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all duration-300 z-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500/50 group-hover:border-cyan-400 group-hover:-translate-x-2 group-hover:translate-y-2 transition-all duration-300 z-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500/50 group-hover:border-cyan-400 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300 z-20 pointer-events-none"></div>

                    {/* --- MAIN CARD BODY --- */}
                    <div className="relative w-full h-full bg-black/40 backdrop-blur-md border border-white/5 overflow-hidden flex flex-col group-hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] group-hover:border-white/20 transition-all duration-500">
                      
                      {/* 🔥 THE BOUNCING LASER SCANNER (Yoyo Effect) */}
                      {/* HOW TO CHANGE SPEED: Change '2s' to make the bounce faster or slower. */}
                      {/* 'alternate' tells the animation to play forward to 100%, then backward to 0%, over and over. */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] -translate-y-full group-hover:animate-[scanYoyo_2s_ease-in-out_infinite_alternate] z-30 pointer-events-none opacity-0"></div>

                      {/* --- IMAGE SECTION --- */}
                      <div className="relative h-[75%] w-full overflow-hidden bg-black">
                        {/* Holographic TV Scanlines overlay - hidden until hover */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
                        
                        {/* The Image: Starts slightly grayscale (40%), snaps to full color and zooms out slightly on hover */}
                        <img 
                          src={image} 
                          alt={product.title}
                          className="w-full h-full object-cover scale-110 group-hover:scale-100 grayscale-[40%] group-hover:grayscale-0 transition-all duration-700 ease-out" 
                        />
                        
                        {/* Gradient shadow from the bottom so the text is always perfectly readable regardless of image color */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none"></div>
                      </div>

                      {/* --- CONTENT SECTION --- */}
                      <div className="relative z-20 flex-1 flex flex-col justify-between p-4 md:p-5 bg-gradient-to-b from-black to-gray-950 border-t border-white/5">
                        
                        {/* Product Title */}
                        {/* 'group-hover:tracking-[0.1em]' slightly stretches the letters apart when hovered for a cool kinetic effect */}
                        <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-gray-300 group-hover:text-white group-hover:tracking-[0.1em] transition-all duration-500 truncate">
                          {product.title}
                        </h2>
                        
                        <div className="flex justify-between items-end">
                          {/* Acquired Date Badge */}
                          <div className="text-[9px] md:text-[10px] text-cyan-500/60 font-mono tracking-[0.2em] group-hover:text-cyan-400 transition-colors uppercase">
                            Acquired: <br/>{new Date(product.createdAt).toLocaleDateString()}
                          </div>
                          
                          {/* Techy Hover Arrow */}
                          <div className="text-gray-600 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all duration-300">
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </div>
                        </div>

                      </div>

                      {/* --- "ACCESS GRANTED" OVERLAY --- */}
                      {/* Fully covers the card with a frosted glass effect on hover. The loading spinner has been removed per instructions. */}
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 ease-in-out z-20 pointer-events-none">
                         
                         {/* Glowing Text Box */}
                         <span className="text-cyan-400 font-black text-sm tracking-[0.3em] uppercase bg-cyan-950/80 px-6 py-2 rounded border border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.4)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          Access Granted
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OwnedProducts;