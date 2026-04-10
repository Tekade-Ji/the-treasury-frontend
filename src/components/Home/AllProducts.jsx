import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

const GetAllProducts = () => {


  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

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
      await new Promise((res) => setTimeout(res, 1500)); // wait 1.5s
    }
  }
};

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

  return (
    <div className="text-white px-10 py-12">
      {/* WRAPPER → aligns title + grid */}
      <div className="max-w-[1100px] mx-auto">

        {/* TITLE aligned with grid */}
        <h1 className="text-start  text-5xl font-extrabold mb-12 tracking-widest capitalize bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          Explore
        </h1>

        {/* GRID */}
        <div className="grid grid-cols-3 gap-12 justify-items-center">
          {products.map((product) => {
            const image = getImageSrc(product.thumbnail, product.images);

            return (
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product._id}`)}
                className="relative w-[240px] h-[320px] cursor-pointer group hover:scale-105 transition-all ease-in-out"
                style={{ perspective: "1200px" }}
              >
                {/* GLOW OUTSIDE CARD */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none
                             shadow-[0_0_20px_5px_rgba(0,255,255,0.4)]
                             transition-opacity duration-300 opacity-40
                             group-hover:opacity-80"
                />

                {/* CARD */}
                <div
                  className="relative w-full h-full rounded-2xl bg-black
                             border border-cyan-400/40
                             shadow-[0_0_10px_rgba(0,255,255,0.6),0_0_20px_rgba(168,85,247,0.5),0_0_30px_rgba(236,72,153,0.4)]
                             transition-all duration-500
                             group-hover:shadow-[0_0_20px_rgba(0,255,255,0.9),0_0_40px_rgba(168,85,247,0.8),0_0_60px_rgba(236,72,153,0.7)]
                             transform-style-preserve-3d group-hover:rotate-y-180"
                  style={{ transformStyle: "preserve-3d", transformOrigin: "center" }}
                >
                  {/* FRONT */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
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
                    style={{
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    <div className="relative z-10 flex flex-col items-center space-y-4">
                      {/* 3D GLOW TITLE */}
                      <h2 className="text-2xl font-extrabold text-cyan-400 uppercase 
                      [text-shadow:0_1px_0_#0e7490,0_2px_0_#0c6a85,0_3px_0_#0a607a,0_4px_6px_rgba(0,0,0,0.6),0_0_8px_rgba(34,211,238,0.7)]">
                        {product.title}
                      </h2>

                      {/* DESCRIPTION */}
                      <p className="text-sm text-white max-h-[6rem] overflow-hidden capitalize 
                      [text-shadow:0_2px_1px_rgba(0,0,0,0.6),0_4px_6px_rgba(0,0,0,0.5),0_0_6px_rgba(255,255,255,0.3)]">
                        {product.description || "NO DESCRIPTION AVAILABLE"}
                      </p>

                      {/* BUTTON */}
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
      </div>
    </div>
  );
};

export default GetAllProducts;