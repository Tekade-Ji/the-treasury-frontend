import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const UploadedProducts = ({ onEdit }) => {
  const { user, isLoggedIn, loading } = useAuth();
  const authToken = user?.token || "";

  const [myProducts, setMyProducts] = useState([]);

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

  // -----------------------------
  // FETCH PRODUCTS
  // -----------------------------
  const fetchMyProducts = async () => {
    if (!user) return;

    try {
      const res = await fetchWithRetry(() =>
        fetch(
          `${import.meta.env.VITE_API_URL}/api/products/my-products`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        )
      );

      const data = await res.json();
      if (res.ok) setMyProducts(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, [user, authToken]);

  // 🔥 LISTEN FOR UPDATES
  useEffect(() => {
    window.addEventListener("product-updated", fetchMyProducts);
    return () => {
      window.removeEventListener("product-updated", fetchMyProducts);
    };
  }, []);

  // -----------------------------
  // HELPER
  // -----------------------------
  const getImageSrc = (thumbnail) => {
    if (!thumbnail) return "/placeholder.png";
    if (thumbnail.startsWith("http")) return thumbnail;

    const cleanFilename = thumbnail
      .replace(/^uploads[\\/]/, "")
      .replace(/\\/g, "/");

    return `${import.meta.env.VITE_API_URL}/uploads/${cleanFilename}`;
  };

  // -----------------------------
  // AUTH GUARDS
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-cyan-400 bg-transparent tracking-widest uppercase animate-pulse font-mono">
        <p>[ SYSTEM LOADING... ]</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-red-500 bg-transparent tracking-widest uppercase font-bold font-mono text-xl">
        <p>⚠️ ACCESS DENIED. AUTHENTICATION REQUIRED.</p>
      </div>
    );
  }

  return (
    <>
      {/* LOCAL STYLES FOR ADVANCED CYBER EFFECTS */}
      <style>{`
        .scanlines {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0,0,0,0.3) 50%,
            rgba(0,0,0,0.3)
          );
          background-size: 100% 4px;
        }
        
        .cyber-btn {
          position: relative;
          clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
          overflow: hidden;
        }
        
        .cyber-btn::before {
          content: '';
          position: absolute;
          top: 0; 
          left: -150%; 
          width: 50%; 
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-25deg);
          transition: left 0.6s cubic-bezier(0.19, 1, 0.22, 1);
          z-index: 1;
        }
        
        .cyber-btn:hover::before {
          left: 150%;
        }
      `}</style>

      <section className="max-w-6xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-12 border-b border-cyan-400/30 pb-4">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
            Command Center
          </h2>
          <div className="text-cyan-400 font-mono text-sm tracking-widest uppercase flex flex-col items-end">
            <span>Status: <span className="text-green-400">Online</span></span>
            <span>{myProducts.length} Entities Found</span>
          </div>
        </div>

        {myProducts.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-cyan-400/20 bg-black/50 relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-cyan-400/5 group-hover:bg-cyan-400/10 transition-colors duration-500" />
            <p className="text-cyan-400/70 text-2xl font-black tracking-[0.3em] uppercase animate-pulse">
              [ NO DATA CONSTRUCTS DETECTED ]
            </p>
            <p className="text-gray-500 mt-4 tracking-widest text-sm uppercase">
              Initialize upload protocol to populate this grid.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {myProducts.map((prod) => (
              <div
                key={prod._id}
                className="group flex flex-col justify-between bg-gray-950 border border-cyan-400/20 p-5 transition-all duration-500 ease-out hover:-translate-y-2 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
              >
                {/* IMAGE CONTAINER WITH SCANLINES */}
                <div className="relative overflow-hidden mb-5 h-48 border border-white/10 group-hover:border-cyan-400/50 transition-colors duration-500">
                  <div className="absolute inset-0 scanlines z-10 pointer-events-none opacity-50 group-hover:opacity-20 transition-opacity" />
                  <div className="absolute inset-0 bg-cyan-900/20 group-hover:bg-transparent transition-colors z-0 duration-300 mix-blend-overlay" />
                  <img
                    src={getImageSrc(prod.thumbnail)}
                    alt={prod.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-125 filter grayscale-[30%] group-hover:grayscale-0"
                  />
                </div>

                {/* CARD DETAILS */}
                <div className="flex-grow flex flex-col relative z-20">
                  <h3 className="text-xl font-extrabold uppercase tracking-widest text-white truncate group-hover:text-cyan-300 transition-colors">
                    {prod.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed font-mono">
                    {prod.description || "// NO DESCRIPTION_"}
                  </p>
                  
                  <div className="mt-5 mb-6 flex items-center justify-between border-t border-dashed border-gray-700 pt-4">
                    <span className="text-xs text-purple-400 uppercase tracking-widest font-bold">
                      Value
                    </span>
                    <span className="text-2xl font-black text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)] tracking-widest">
                      ${prod.price}
                    </span>
                  </div>
                </div>

                {/* ACTIONS - THE NEW BUTTON GAME */}
                <div className="flex flex-col gap-3 mt-auto relative z-20">
                  {/* EDIT BUTTON */}
                  <button
                    onClick={() => onEdit(prod)}
                    className="cyber-btn cursor-pointer w-full py-3 bg-cyan-950/50 border-l-2 border-r-2 border-cyan-400 text-cyan-400 uppercase tracking-[0.2em] text-xs font-bold transition-all duration-300 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]"
                  >
                    <span className="relative z-10">Reconfigure</span>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={async () => {
                      if (!confirm("CRITICAL WARNING: This action will permanently erase this data construct. Proceed?")) return;

                      try {
                        const res = await fetch(
                          `${import.meta.env.VITE_API_URL}/api/products/${prod._id}`,
                          {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${authToken}` },
                          }
                        );

                        if (res.ok) {
                          setMyProducts((prev) => prev.filter((p) => p._id !== prod._id));
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="cyber-btn w-full py-3 cursor-pointer bg-red-950/30 border-l-2 border-r-2 border-red-500/50 text-red-500 uppercase tracking-[0.2em] text-xs font-bold transition-all duration-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                  >
                    <span className="relative z-10">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default UploadedProducts;