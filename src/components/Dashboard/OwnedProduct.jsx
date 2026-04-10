import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from '../../api/axios'

const OwnedProducts = () => {
  const { purchasedProducts, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  

  const navigate = useNavigate();

  // 🌌 mouse glow
  useEffect(() => {
    const move = (e) => {
      document.documentElement.style.setProperty("--x", e.clientX + "px");
      document.documentElement.style.setProperty("--y", e.clientY + "px");
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // 📦 fetch owned products
  useEffect(() => {
    const fetchOwned = async () => {
      try {
        const fetchWithRetry = async (fn, retries = 3) => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    return fetchWithRetry(fn, retries - 1);
  }
};



const res = await fetchWithRetry(() => API.get("/api/products"));
        const owned = res.data.data.filter((p) =>
          purchasedProducts?.includes(p._id)
        );
        setProducts(owned);
      } catch (err) {
        console.error(err);
      }
    };

    if (!loading) fetchOwned();
  }, [purchasedProducts, loading]);

  // 🔍 filter + sort
  useEffect(() => {
    let data = [...products];

    if (search) {
      data = data.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

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

    setFiltered(data);
  }, [products, search, sort]);

  const getImageSrc = (thumbnail, images = []) => {
    const src = thumbnail || images?.[0];
    if (!src) return "/placeholder.png";
    if (src.startsWith("http")) return src;

    const clean = src.replace(/^uploads[\\/]/, "").replace(/\\/g, "/");
    return `${import.meta.env.VITE_API_URL}/uploads/${clean}`;
  };

  // 💥 ripple
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-cyan-400">
        LOADING YOUR VAULT...
      </div>
    );
  }

  return (
    <>
      {/* 🔥 LOCAL CSS */}
      <style>
        {`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
        }

        @keyframes rippleAnim {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        .ripple {
          position: absolute;
          border-radius: 9999px;
          background: rgba(0,255,255,0.6);
          transform: scale(0);
          animation: rippleAnim 600ms linear;
          pointer-events: none;
        }

        .cyber-bg {
          background-image:
            linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,255,0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }
        `}
      </style>

      <div className=" text-white cyber-bg relative overflow-hidden">

        {/* 🌌 mouse glow */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(0,255,255,0.15), transparent 40%)",
          }}
        />

        {/* 🧠 CONTAINER (THIS FIXES WIDTH ISSUE) */}
        <div className="max-w-6xl mx-auto px-6">

          {/* HEADER */}
          <div className="text-center py-14">
            <h1 className="text-5xl font-extrabold tracking-widest uppercase 
            bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
              YOUR VAULT
            </h1>

            <p className="text-gray-400 mt-3 tracking-widest text-sm">
              {filtered.length} ITEMS OWNED
            </p>
          </div>

          {/* 🔍 FILTER BAR */}
          <div className="flex flex-wrap w-full gap-4 mb-12 items-center justify-center">
            <input
              type="text"
              placeholder="SEARCH YOUR VAULT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 w-auto px-4 py-3 bg-black/60 border border-cyan-400/30 rounded-lg 
              focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_cyan]"
            />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-3 bg-black/60 border border-purple-400/30 rounded-lg cursor-pointer hover:scale-105 transition-all ease-in-out"
            >
              <option value="latest">LATEST</option>
              <option value="oldest">OLDEST</option>
              <option value="name">NAME A-Z</option>
              <option value="nameDesc">NAME Z-A</option>
            </select>
          </div>

          {/* GRID */}
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 tracking-widest">
              NO MATCHING PRODUCTS...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 justify-items-center pb-20">
              {filtered.map((product) => {
                const image = getImageSrc(product.thumbnail, product.images);

                return (
                  <div
                    key={product._id}
                    onClick={(e) => {
                      createRipple(e);
                      setTimeout(() => {
                        navigate(`/product/${product._id}`);
                      }, 150);
                    }}
                    className="relative w-[220px] h-[280px] cursor-pointer group"
                  >
                    {/* glow */}
                    <div className="absolute inset-0 rounded-2xl 
                    shadow-[0_0_20px_rgba(0,255,255,0.4)]
                    group-hover:shadow-[0_0_50px_rgba(168,85,247,0.9)]
                    transition-all duration-500" />

                    {/* card */}
                    <div className="relative w-full h-full rounded-2xl overflow-hidden
                    bg-white/5 backdrop-blur-md border border-white/10
                    group-hover:scale-105 transition duration-300">

                      {/* image */}
                      <img
                        src={image}
                        className="w-full h-[70%] object-cover group-hover:scale-110 transition duration-500"
                      />

                      {/* info */}
                      <div className="h-[30%] px-3 py-2 flex flex-col justify-center">
                        <h2 className="text-xs font-bold uppercase tracking-widest truncate">
                          {product.title}
                        </h2>

                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                      flex items-center justify-center transition">
                        <span className="text-cyan-400 text-xs tracking-widest">
                          OPEN →
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