import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const RedeemCoupon = () => {
  /**
   * 🔐 Auth Context
   * Gives us:
   * - user (contains token for API auth)
   * - coins (global coin state)
   * - updateCoins (function to update coins globally)
   */
  const { user, coins, updateCoins } = useAuth();

  /**
   * 🧾 Local State
   */
  const [code, setCode] = useState(""); // Coupon input
  const [loading, setLoading] = useState(false); // Button loading state
  const [popup, setPopup] = useState(null); // Success/Error popup
  const [mouse, setMouse] = useState({ x: 0, y: 0 }); // Mouse position for glow effect
  const [displayCoins, setDisplayCoins] = useState(coins); // Animated coin display

  /**
   * 🔊 Preload Sound (Best Practice)
   * - Loaded once when component mounts
   * - Stored in state so it persists across renders
   * - Prevents delay on first play
   */
  const [sound] = useState(() => {
    const audio = new Audio("/cha-ching.mp3");
    audio.volume = 0.6; // Adjust loudness (0 to 1)
    return audio;
  });

  /**
   * 🎯 Smooth Coin Animation
   * Animates from old coin value → new coin value
   */
  useEffect(() => {
    let start = displayCoins;
    let end = coins;

    if (start === end) return;

    let duration = 600; // animation time (ms)
    let startTime = Date.now();

    const animate = () => {
      let progress = Math.min((Date.now() - startTime) / duration, 1);

      // Linear interpolation
      let value = Math.floor(start + (end - start) * progress);
      setDisplayCoins(value);

      if (progress < 1) requestAnimationFrame(animate);
    };

    animate();
  }, [coins]);

  /**
   * 🧠 Mouse Tracking Effect
   * Tracks cursor to create glowing radial light effect
   */
  useEffect(() => {
    const move = (e) => setMouse({ x: e.clientX, y: e.clientY });

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  /**
   * 🎟 Redeem Coupon Function
   * - Calls backend API
   * - Updates coins
   * - Shows popup
   * - Plays sound on success
   */
  const handleRedeem = async () => {
    if (!code.trim()) return;

    setLoading(true);

    try {
      const API = `${import.meta.env.VITE_API_URL}/api/coupons/redeem`;

      const res = await axios.post(
        API,
        { code },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const { addedCoins, totalCoins } = res.data.data;

      // 🪙 Update global coins
      updateCoins(totalCoins);

      /**
       * 🔊 Play Sound (Optimized)
       * - Reset time so it can replay instantly
       * - Catch prevents browser autoplay errors
       */
      sound.currentTime = 0;
      sound.play().catch(() => {});

      // 🎉 Show success popup
      setPopup({
        type: "success",
        message: `+${addedCoins} COINS`,
        total: totalCoins,
      });

      setCode(""); // clear input
    } catch (err) {
      // ❌ Error popup
      setPopup({
        type: "error",
        message: err.response?.data?.message || "INVALID CODE",
      });

      setCode("");
    } finally {
      setLoading(false);

      // ⏳ Auto hide popup
      setTimeout(() => setPopup(null), 2500);
    }
  };

  /**
   * ⌨️ Enter Key Support
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRedeem();
  };

  return (
    <div
      id="redeem"
      className=" h-auto w-full text-white flex justify-center  px-6 py-10 relative overflow-hidden"
    >
      {/* 🎉 POPUP (Success / Error) */}
      {popup && (
        <div
          className={`absolute top-0 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-xl text-center font-bold text-lg tracking-widest animate-[glitch_0.3s_linear_infinite]
          ${
            popup.type === "success"
              ? "bg-green-500/40 border border-green-400 text-green-100 shadow-[0_0_30px_rgba(0,255,0,0.6)]"
              : "bg-red-500/40 border border-red-400 text-red-100 shadow-[0_0_30px_rgba(255,0,0,0.6)]"
          }`}
          style={{ zIndex: 50 }}
        >
          {popup.message}

          {/* Show total coins only on success */}
          {popup.type === "success" && (
            <div className="text-sm mt-1 opacity-70">TOTAL: {popup.total}</div>
          )}
        </div>
      )}

      {/* 🧠 Cursor Glow Effect */}
      <div
        className="pointer-events-none absolute w-[600px] h-[600px] opacity-30"
        style={{
          left: mouse.x - 300,
          top: mouse.y - 300,
          background:
            "radial-gradient(circle, rgba(0,255,255,0.15), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* 🧾 MAIN CONTENT */}
      <div className="w-full max-w-5xl">
        <h1 className="mb-6 text-2xl tracking-widest uppercase text-white/80">
          Redeem Coupon To Get Coins
        </h1>

        {/* 💎 Glass Container */}
        <div className="relative z-10 p-[1px] rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20">
          <div className="w-full p-8 rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-[0_10px_60px_rgba(0,0,0,0.8)]">
            {/* 💰 Wallet Display */}
            <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg">💰</span>
                <p className="text-xs uppercase tracking-widest opacity-80">
                  Wallet
                </p>
              </div>

              {/* Animated Coins */}
              <h1 className="text-4xl font-bold tracking-wider">
                {displayCoins}
              </h1>

              <p className="text-xs opacity-70">COINS</p>
            </div>

            {/* 🎟 Input + Button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="ENTER CODE"
                className="flex-1 px-4 py-3 bg-black/50 border border-cyan-500/20 rounded-xl text-center tracking-widest"
              />

              <button
                onClick={handleRedeem}
                disabled={loading}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 cursor-pointer hover:scale-104 transition-all ease-in-out"
              >
                {loading ? "..." : "CLAIM"}
              </button>
            </div>

            <p className="text-center text-xs mt-3 opacity-40 tracking-widest">
              SYSTEM READY • ENTER CODE
            </p>
          </div>
        </div>
      </div>

      {/* 🎞 Glitch Animation */}
      <style>
        {`
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
          }
        `}
      </style>
    </div>
  );
};

export default RedeemCoupon;
