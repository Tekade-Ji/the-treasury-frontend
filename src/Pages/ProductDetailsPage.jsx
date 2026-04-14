// Think of these imports like gathering your tools before building a machine.
// React gives us the ability to manage memory (useState) and trigger events (useEffect, useRef).
// React-Router gives us the steering wheel to read the URL (useParams) or drive to new pages (useNavigate).
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ProductVisual from "../components/ProductVisual";
import ProductAction from "../components/ProductAction";

const ProductDetailsPage = () => {
  // --- HELPER FUNCTION: THE STUBBORN FETCHER ---
  // If the database fails to respond, this function catches the error,
  // waits exactly 1.5 seconds, and loops back to try again until it succeeds.
  const fetchWithRetry = async (fn) => {
    while (true) {
      try {
        const res = await fn();
        return res;
      } catch (err) {
        console.log("Retrying...");
        await new Promise((res) => setTimeout(res, 1500)); // wait 1.5s
      }
    }
  };

  const navigate = useNavigate(); // The steering wheel to move between pages

  // Grab the 'id' from the website's URL so we know WHICH product to load
  const { id } = useParams(); 
  // Grab user data and wallet info from our global AuthContext (our secure vault)
  const { user, coins, updateCoins, purchasedProducts } = useAuth();

  // --- COMPONENT MEMORY (State) ---
  // useState acts as short-term memory. 
  // 'product' holds the data. 'setProduct' updates it.
  const [product, setProduct] = useState(null);
  const [creator, setCreator] = useState(null);
  const [owned, setOwned] = useState(false); // Remembers if the user bought this item
  const [error, setError] = useState(""); // Remembers any error messages to show the user

  // --- AUTOMATIC TRIGGER: FETCH DATA ---
  // useEffect tells the page: "As soon as you load, run this code."
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Ask the database for the specific product using the ID from the URL
        const res = await fetchWithRetry(() => API.get(`/api/products/${id}`));
        const data = res.data.data;

        // Save the received data into our memory variables
        setProduct(data);
        setCreator(data.createdBy || null);

        // Check if the user already bought this product in the past
        if (purchasedProducts?.includes(data._id)) {
          setOwned(true);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      }
    };

    fetchProduct();
  }, [id, purchasedProducts]); // The array here means: "Rerun this if the ID or purchased list ever changes."

  // --- AUTOMATIC TRIGGER: ESC KEY TO CLOSE ERROR ---
  useEffect(() => {
    if (!error) return; // If there is no error, do nothing.

    const handleKey = (e) => {
      // If the user hits the Escape key on their keyboard, clear the error memory.
      if (e.key === "Escape") {
        setError("");
      }
    };

    // Start listening for keyboard presses
    window.addEventListener("keydown", handleKey);
    // Cleanup: Stop listening when the component dies to save computer resources
    return () => window.removeEventListener("keydown", handleKey);
  }, [error]);

  // --- ACTION: PURCHASE LOGIC ---
  // This runs when the user clicks the "Buy" button
  const handlePurchase = async () => {
    // SECURITY CHECK: If they are not logged in, drive them to the login page.
    if (!user || !user.token) {
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }

    try {
      // WALLET CHECK: Make sure they have enough coins before trying to buy
      if (coins < product.price) {
        setError("NOT ENOUGH COINS");
        return;
      }

      // Tell the database to process the order. We pass the security token to prove who we are.
      const res = await API.post(
        `/api/orders/buy/${product._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      // Update the user's wallet with the new remaining balance
      updateCoins(res.data.data.coinsLeft);

      // Play the success sound effect
      const audio = new Audio("/cha-ching.mp3");
      audio.play();

      // Tell memory we now own the product and wipe any old errors
      setOwned(true);
      setError("");
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "ERROR");
    }
  };

  // --- ACTION: OPEN WALLET ---
  const handleWallet = async () => {
    if (!user || !user.token) {
      navigate("/login", { state: { from: `/product/${product._id}` } });
      return;
    } else {
      navigate(`/dashboard#redeem`); // Jump specifically to the redeem section
    }
  };

  // --- HELPER: DATE FORMATTER ---
  // Computers read time as messy strings. This translates it into human-readable text (e.g., "Oct 12, 2024").
  const formatDate = (isoDateString) => {
    if (!isoDateString) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoDateString));
  };

  // --- FALLBACK UI ---
  // If the product data hasn't arrived from the server yet, show a loading screen.
  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-cyan-400">
        LOADING...
      </div>
    );
  }

  // ==========================================
  // THE VISUALS (HTML/JSX)
  // ==========================================
  return (
    <>
      {/* 🔥 LOCAL CSS */}
      {/* This injects custom CSS directly into this page for special visual effects like the glitching grid */}
      <style>
        {`
        /* HIDE SCROLLBAR */
        .media-scroll::-webkit-scrollbar {
          display: none;
        }

        .media-scroll {
          scrollbar-width: none;
        }

        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
        }

        @keyframes glitch {
          0% { text-shadow: 2px 0 cyan, -2px 0 magenta; }
          50% { text-shadow: -2px 0 cyan, 2px 0 magenta; }
          100% { text-shadow: 2px 0 cyan, -2px 0 magenta; }
        }

        .cyber-bg {
          background-image:
            linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,255,0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        .glass {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        `}
      </style>

      {/* Main container holding the whole page. overflow-hidden stops nasty horizontal scrolling. */}
      <div className="text-white relative overflow-hidden cyber-bg">
        
        {/* 🌌 BACKGROUND LIGHT: The faint glowing orb following the mouse (currently static based on your code) */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(0,255,255,0.15), transparent 40%)",
          }}
        />

        {/* 💰 WALLET BUTTON */}
        <div
          className="fixed top-20 right-6 z-50 px-6 py-3 rounded-xl 
          bg-gradient-to-r from-yellow-400 to-orange-500 
          text-black font-bold shadow-lg
          hover:scale-110 transition-all duration-300
          shadow-[0_0_20px_rgba(255,200,0,0.6)] cursor-pointer"
          onClick={handleWallet}
        >
          💰 {coins}
        </div>

        {/* 🚨 ERROR TOAST: Only draws on screen if the 'error' memory contains text */}
        {error && (
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 z-50
             px-6 py-3 rounded-xl 
            flex items-center gap-4
            text-red-100 font-semibold
            shadow-[0_0_20px_rgba(255,0,0,0.5)]
            animate-pulse bg-red-500/60 "
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")} // Clicking the X clears the error memory, hiding the toast
              className="text-red-400 hover:text-white text-xl cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 📦 CONTENT CONTAINER */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 relative z-10">
          
          <ProductVisual product={product} />

          {/* RESPONSIVE FIX 1: The Main Grid Split 
              Mobile: flex-col (stacks elements vertically)
              Desktop (lg): flex-row (places them side-by-side like your original layout) 
          */}
          <div className="flex flex-col lg:flex-row w-full gap-10">
            
            {/* LEFT SIDE: Title & Media */}
            {/* Mobile: takes 100% width (w-full). Desktop: snaps back to 40% (lg:w-[40%]) */}
            <div className="w-full lg:w-[40%] flex flex-col gap-6">
              
              {/* TITLE */}
              <h1
                className="text-4xl lg:text-5xl font-extrabold uppercase
                text-cyan-400 tracking-widest
                hover:animate-[glitch_0.3s_infinite] cursor-pointer"
              >
                {product.title}
              </h1>

              {/* 🎬 MEDIA PANEL: The horizontal image/video scroller */}
              <MediaPanel product={product} />
            </div>

            {/* RIGHT SIDE: Creator Info */}
            {/* 👤 CREATOR PANEL */}
            {/* RESPONSIVE FIX 2: Padding and Width. 
                Mobile: w-full, standard padding (p-6). 
                Desktop: w-[60%], restores your exact massive left padding (lg:pl-20). 
            */}
            <div
              className="mb-4 text-gray-400 font-mono text-sm space-y-1
              glass p-6 lg:pl-20 rounded-xl flex flex-col justify-center w-full lg:w-[60%] gap-6 tracking-widest
              hover:scale-[1.02] transition-all duration-500
              shadow-[0_0_30px_rgba(0,255,255,0.2)]"
            >
              <div className="tracking-widest text-2xl sm:text-3xl lg:text-4xl hover:text-[#FF7500] cursor-pointer">
                <span className="font-medium text-cyan-400 text-xl sm:text-2xl">
                  Created by:
                </span>{" "}
                {creator
                  ? creator.name || creator.username || "Unknown User"
                  : "Loading..."}
              </div>

              <div className="tracking-widest hover:text-white text-base sm:text-lg font-bold">
                <span className="font-medium text-cyan-400">Created on:</span>{" "}
                {formatDate(product.createdAt)}
              </div>

              <div className="tracking-widest mb-5 hover:text-white text-base sm:text-lg font-bold">
                <span className="font-medium text-cyan-400">
                  DLC Release Date:
                </span>{" "}
                {formatDate(product.updatedAt)}
              </div>
            </div>
          </div>

          {/* 📝 DESCRIPTION PANEL */}
          {/* RESPONSIVE FIX 3: Horizontal Padding. 
              px-80 forces 80 units of blank space on the sides. On a phone, this crushes the text into a tiny column.
              Mobile: px-6. Tablet: px-20. Desktop: px-80 (Restoring your exact look). 
          */}
          <p
            className="w-full mt-10 mb-10 text-center leading-relaxed text-sm tracking-widest uppercase
            glass p-6 px-6 md:px-20 lg:px-80 rounded-xl
            transition-all duration-500
            hover:shadow-[0_0_40px_rgba(255,182,0,0.4)]"
            style={{
              color: "#FFB600",
              textShadow: `
                0 0 6px rgba(255,182,0,0.8),
                0 0 12px rgba(255,182,0,0.6),
                0 0 24px rgba(255,182,0,0.4)
              `,
            }}
          >
            {product.description || "No description available"}
          </p>

          <ProductAction
            product={product}
            owned={owned}
            setOwned={setOwned}
            setError={setError}
            handlePurchase={handlePurchase}
          />
        </div>
      </div>
    </>
  );
};

// ==========================================
// SEPARATE COMPONENT: MEDIA PANEL
// ==========================================
const MediaPanel = ({ product }) => {
  // useRef acts like a laser pointer aimed directly at an HTML element (the scrolling box)
  const scrollRef = useRef(null);

  // Group all possible images and videos into a single list
  const media = [];
  if (product?.thumbnail) media.push(product.thumbnail);
  if (product?.images) media.push(...product.images);
  if (product?.videoUrl) media.push(product.videoUrl);

  // --- AUTOMATIC TRIGGER: MOUSE WHEEL SCROLLING ---
  // Converts vertical mouse scrolling into horizontal movement
  useEffect(() => {
    const el = scrollRef.current; // Point at the scroll box

    const handleWheel = (e) => {
      if (!el) return;
      if (!el.matches(":hover")) return; // Only trigger if mouse is currently over the box

      e.preventDefault(); // Stop the whole webpage from scrolling down
      el.scrollLeft += e.deltaY; // Move the box left/right instead
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // --- AUTOMATIC TRIGGER: KEYBOARD SCROLLING ---
  // Lets users use 'A', 'D', or Arrow Keys to scroll the media panel
  useEffect(() => {
    const handleKey = (e) => {
      const el = scrollRef.current;
      if (!el || !el.matches(":hover")) return;

      if (["ArrowRight", "d", "D"].includes(e.key)) {
        el.scrollBy({ left: 200, behavior: "smooth" }); // Jump 200 pixels right smoothly
      }

      if (["ArrowLeft", "a", "A"].includes(e.key)) {
        el.scrollBy({ left: -200, behavior: "smooth" }); // Jump 200 pixels left smoothly
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // --- HELPER: FORMAT IMAGE/VIDEO SOURCES ---
  const formatSrc = (src) => {
    if (!src) return "/placeholder.png";

    if (src.includes("youtube.com") || src.includes("youtu.be")) return src;
    if (src.startsWith("http")) return src;

    let clean = src.replace(/\\/g, "/");
    if (clean.startsWith("uploads/")) clean = clean.replace("uploads/", "");
    return `${import.meta.env.VITE_API_URL}/uploads/${clean}`;
  };

  // --- HELPER: EXTRACT YOUTUBE ID ---
  // YouTube has messy URLs. This slices the string up to isolate just the unique video ID needed for embedding.
  const getYouTubeEmbed = (url) => {
    if (!url) return "";
    let id = "";
    if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("youtube.com/watch")) id = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtube.com/shorts/")) id = url.split("shorts/")[1].split("?")[0];

    return `https://www.youtube.com/embed/${id}`;
  };

  return (
    <div
      ref={scrollRef} // Attach our laser pointer to this box
      className="media-scroll flex gap-6 overflow-x-auto overflow-y-hidden w-full py-4"
    >
      {/* Loop through our list of media items and draw them on screen */}
      {media.map((item, index) => {
        const src = formatSrc(item);
        const isYoutube = src.includes("youtube.com") || src.includes("youtu.be");

        return (
          <div
            key={index}
            // min-w adjusts so smaller phones don't stretch or break the cards
            className="min-w-[280px] sm:min-w-[300px] h-[200px] rounded-xl overflow-hidden
            glass flex-shrink-0 hover:scale-105 transition duration-300"
          >
            {/* If it's a video, load an iframe. If it's an image, load an img tag. */}
            {isYoutube ? (
              <iframe
                src={getYouTubeEmbed(src)}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <a href={src} target="_blank" rel="noopener noreferrer">
                <img src={src} className="w-full h-full object-cover" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProductDetailsPage;