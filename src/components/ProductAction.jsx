import { useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


const ProductAction = ({ product, owned, setOwned, setError }) => {
  const navigate = useNavigate();

  const { user, coins, updateCoins } = useAuth();

  const [loading, setLoading] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

 const handlePurchase = async () => {
  if (!user || !user.token) {
    navigate("/login", { state: { from: `/product/${product._id}` } });
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
      }
    );

    updateCoins(res.data.data.coinsLeft);

    const audio = new Audio("/cha-ching.mp3");
    audio.play();

    setOwned(true);
    setError("");
  } catch (err) {
    setError(err.response?.data?.message || "ERROR");
  }
};

  return (
    <>
      <style>
        {`
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 20px cyan; }
          50% { box-shadow: 0 0 60px magenta; }
        }

        @keyframes scanMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.7; }
          100% { transform: scale(4); opacity: 0; }
        }

        @keyframes unlockPulse {
          0%,100% { text-shadow: 0 0 10px #00ff88; }
          50% { text-shadow: 0 0 25px #00ff88; }
        }
        `}
      </style>

      <div className="mt-10 relative z-10">

        {successFlash && (
          <div className="fixed inset-0 bg-cyan-400/20 backdrop-blur-md z-[9999] animate-pulse pointer-events-none" />
        )}

        {!owned ? (
          <button
            onClick={handlePurchase}
            disabled={loading}
            className={`
              relative px-14 py-6 cursor-pointer rounded-full font-bold text-lg tracking-widest
              overflow-hidden select-none transition-all duration-300
              ${
                loading
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:scale-110 active:scale-95 shadow-[0_0_25px_rgba(0,255,255,0.7)] hover:shadow-[0_0_80px_rgba(255,0,255,1)]"
              }
            `}
          >

            {!loading && (
              <div className="absolute inset-0 rounded-full opacity-30 animate-[pulseGlow_2s_infinite]" />
            )}

            {!loading && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-1/3 h-full bg-white/20 blur-md animate-[scanMove_2s_linear_infinite]" />
              </div>
            )}

            {loading && (
              <div className="absolute bottom-0 left-0 h-1 w-full bg-cyan-400 animate-pulse" />
            )}

            <span className="relative z-10">
              {loading ? "PROCESSING..." : `BUY FOR ${product.price} COINS`}
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-start gap-6 select-none">

            <div className="text-green-400 font-bold tracking-widest text-xl animate-[unlockPulse_2s_infinite] cursor-pointer">
              ✔ ACCESS GRANTED
            </div>

            <a
              href={product.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="relative px-12 py-5 rounded-full font-bold tracking-widest bg-gradient-to-r from-green-400 to-emerald-600 text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(0,255,0,0.8)] hover:shadow-[0_0_70px_rgba(0,255,0,1)] overflow-hidden"
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-1/3 h-full bg-white/20 blur-md animate-[scanMove_2s_linear_infinite]" />
              </div>

              <span className="relative z-10">
                DOWNLOAD FILE
              </span>
            </a>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductAction;