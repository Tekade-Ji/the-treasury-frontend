import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ProductVisual from "../components/ProductVisual";
import ProductAction from "../components/ProductAction";
import { useNavigate } from "react-router-dom";

const ProductDetailsPage = () => {

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

  const navigate = useNavigate();

  const { id } = useParams();
  const { user, coins, updateCoins, purchasedProducts } = useAuth();

  const [product, setProduct] = useState(null);
  const [creator, setCreator] = useState(null);
  const [owned, setOwned] = useState(false);
  const [error, setError] = useState("");

  // 🎯 Mouse glow effect (UNCHANGED)
//  useEffect(() => {
//   const move = (e) => {
//     // Set the custom properties for mouse position
//     document.documentElement.style.setProperty("--x", e.clientX + "px");
//     document.documentElement.style.setProperty("--y", e.clientY + "px");

//     // Add this line to lower z-index
//     document.documentElement.style.zIndex = -10;  // Lower z-index of the whole document
//   };

//   // Add the event listener for mouse move
//   window.addEventListener("mousemove", move);

//   // Cleanup to remove the event listener
//   return () => window.removeEventListener("mousemove", move);
// }, []);

  // 📦 Fetch product (UNCHANGED)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetchWithRetry(() => API.get(`/api/products/${id}`));
        const data = res.data.data;

        setProduct(data);
        setCreator(data.createdBy || null);

        if (purchasedProducts?.includes(data._id)) {
          setOwned(true);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      }
    };

    fetchProduct();
  }, [id, purchasedProducts]);

  // ❌ ESC error close (UNCHANGED)
  useEffect(() => {
    if (!error) return;

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setError("");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [error]);

  // 🛒 Purchase logic (UNCHANGED)
  const handlePurchase = async () => {
    // 🔒 NOT LOGGED IN → redirect to login + remember this page
    if (!user || !user.token) {
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }

    try {
      if (coins < product.price) {
        setError("NOT ENOUGH COINS");
        return;
      }

      const res = await API.post(
        `/api/orders/buy/${product._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      updateCoins(res.data.data.coinsLeft);

      const audio = new Audio("/cha-ching.mp3");
      audio.play();

      setOwned(true);
      setError("");
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "ERROR");
    }
  };

  const handleWallet = async () => {
    if (!user || !user.token) {
      navigate("/login", { state: { from: `/product/${product._id}` } });
      return;
    } else {
      navigate(`/dashboard#redeem`);
    }
  };

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

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-cyan-400">
        LOADING...
      </div>
    );
  }

  return (
    <>
      {/* 🔥 LOCAL CSS */}
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

      <div className="text-white relative overflow-hidden cyber-bg ">
        {/* 🌌 BACKGROUND LIGHT */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(0,255,255,0.15), transparent 40%)",
          }}
        />

        {/* 💰 WALLET (ENHANCED UI ONLY) */}
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

        {/* 🚨 ERROR TOAST (SAME LOGIC, BETTER STYLE) */}
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
              onClick={() => setError("")}
              className="text-red-400 hover:text-white text-xl cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 📦 CONTENT (STRUCTURE SAME) */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <ProductVisual product={product} />

          <div className="flex w-full gap-10">
            {/* LEFT SIDE */}
            <div className="w-[40%] flex flex-col gap-6">
              {/* TITLE */}
              <h1
                className="text-5xl font-extrabold uppercase
      text-cyan-400 tracking-widest
      hover:animate-[glitch_0.3s_infinite] cursor-pointer"
              >
                {product.title}
              </h1>

              {/* 🎬 MEDIA PANEL */}
              <MediaPanel product={product} />
            </div>

            {/* RIGHT SIDE */}
            {/* 👤 CREATOR PANEL (GLASS UI ONLY) */}
            <div
              className="mb-4 text-gray-400 font-mono text-sm space-y-1
              glass p-6 rounded-xl flex flex-col justify-center w-[60%]  gap-6 tracking-widest pl-20
              hover:scale-[1.02] transition-all duration-500
              shadow-[0_0_30px_rgba(0,255,255,0.2)]"
            >
              <div className="tracking-widest text-4xl hover:text-[#FF7500] cursor-pointer">
                <span className="font-medium text-cyan-400 text-2xl">
                  Created by:
                </span>{" "}
                {creator
                  ? creator.name || creator.username || "Unknown User"
                  : "Loading..."}
              </div>

              <div className="tracking-widest hover:text-white text-lg font-bold">
                <span className="font-medium text-cyan-400">Created on:</span>{" "}
                {formatDate(product.createdAt)}
              </div>

              <div className="tracking-widest mb-5 hover:text-white text-lg font-bold">
                <span className="font-medium text-cyan-400">
                  DLC Release Date:
                </span>{" "}
                {formatDate(product.updatedAt)}
              </div>
            </div>
          </div>

          {/* 📝 DESCRIPTION (GLASS UPGRADE ONLY) */}
          <p
            className="w-full mb-10 text-center leading-relaxed text-sm tracking-widest uppercase
  glass p-6 px-80 rounded-xl
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

const MediaPanel = ({ product }) => {
  const scrollRef = useRef(null);

  const media = [];

  if (product?.thumbnail) media.push(product.thumbnail);
  if (product?.images) media.push(...product.images);
  if (product?.videoUrl) media.push(product.videoUrl);

  useEffect(() => {
    const el = scrollRef.current;

    const handleWheel = (e) => {
      if (!el) return;

      if (!el.matches(":hover")) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      const el = scrollRef.current;
      if (!el || !el.matches(":hover")) return;

      if (["ArrowRight", "d", "D"].includes(e.key)) {
        el.scrollBy({ left: 200, behavior: "smooth" });
      }

      if (["ArrowLeft", "a", "A"].includes(e.key)) {
        el.scrollBy({ left: -200, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const formatSrc = (src) => {
    if (!src) return "/placeholder.png";

    // YouTube
    if (src.includes("youtube.com") || src.includes("youtu.be")) {
      return src;
    }

    // Already full URL
    if (src.startsWith("http")) {
      return src;
    }

    // Normalize path
    let clean = src.replace(/\\/g, "/");

    // Remove duplicate "uploads/"
    if (clean.startsWith("uploads/")) {
      clean = clean.replace("uploads/", "");
    }

    return `${import.meta.env.VITE_API_URL}/uploads/${clean}`;
  };

  const getYouTubeEmbed = (url) => {
    if (!url) return "";

    let id = "";

    if (url.includes("youtu.be/")) {
      id = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/watch")) {
      id = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtube.com/shorts/")) {
      id = url.split("shorts/")[1].split("?")[0];
    }

    return `https://www.youtube.com/embed/${id}`;
  };

  return (
    <div
      ref={scrollRef}
      className="media-scroll flex gap-6 overflow-x-auto overflow-y-hidden w-full py-4"
    >
      {media.map((item, index) => {
        const src = formatSrc(item);

        const isYoutube =
          src.includes("youtube.com") || src.includes("youtu.be");

        return (
          <div
            key={index}
            className="min-w-[300px] h-[200px] rounded-xl overflow-hidden
            glass flex-shrink-0 hover:scale-105 transition duration-300"
          >
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
