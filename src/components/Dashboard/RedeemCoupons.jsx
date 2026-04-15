// Grab the essential React hooks.
// useState is the component's short-term memory.
// useEffect lets us trigger side-effects (like animations or API calls) automatically.
import { useState, useEffect } from "react";
// Axios is our HTTP client for talking to the backend API.
import axios from "axios";
// Import our custom authentication vault to get user info and global state.
import { useAuth } from "../../context/AuthContext";

const RedeemCoupon = () => {
  /**
   * 🔐 Auth Context
   * Gives us:
   * - user: Contains the token we need to prove who we are to the API.
   * - coins: The actual true coin balance stored in the global state.
   * - updateCoins: The global function to update the balance everywhere in the app.
   */
  const { user, coins, updateCoins } = useAuth();

  /**
   * 🧾 Local Component Memory (State)
   */
  const [code, setCode] = useState(""); // Remembers what the user types into the box.
  const [loading, setLoading] = useState(false); // Remembers if we are waiting on the API to prevent double-clicks.
  const [popup, setPopup] = useState(null); // Holds the success/error message object to display.
  const [mouse, setMouse] = useState({ x: 0, y: 0 }); // Tracks X and Y coordinates of the mouse.
  const [displayCoins, setDisplayCoins] = useState(coins); // The *visual* coin number shown on screen (used for animation).

  /**
   * 🔊 Preload Sound (Performance Best Practice)
   * We wrap this in useState with an arrow function. 
   * This guarantees the browser only loads the mp3 file EXACTLY ONCE when the page first loads,
   * rather than re-loading it every time the component updates.
   */
  const [sound] = useState(() => {
    const audio = new Audio("/cha-ching.mp3");
    audio.volume = 0.6; // Scale down the loudness (0 is mute, 1 is max)
    return audio;
  });

  /**
   * 🎯 Smooth Coin Animation Engine
   * This useEffect watches the global 'coins' variable.
   * If the global coins change, it triggers a visual "counting" animation to bridge the gap
   * between the old number and the new number smoothly over 600 milliseconds.
   */
  useEffect(() => {
    let start = displayCoins; // The number currently shown on screen
    let end = coins; // The actual new total

    if (start === end) return; // If they match, do nothing.

    let duration = 600; // Total time the animation should take in milliseconds
    let startTime = Date.now(); // Record the exact millisecond the animation started

    const animate = () => {
      // Calculate how far along we are in the 600ms timeframe (returns a percentage between 0 and 1)
      let progress = Math.min((Date.now() - startTime) / duration, 1);

      // Math trick (Linear Interpolation): Calculate the exact number to show at this exact percentage of completion.
      let value = Math.floor(start + (end - start) * progress);
      setDisplayCoins(value); // Update the screen

      // If we haven't hit 100% (1) yet, ask the browser to run this function again on the next frame.
      if (progress < 1) requestAnimationFrame(animate);
    };

    animate(); // Kickstart the loop
  }, [coins]); // <-- Run this block anytime 'coins' changes.

  /**
   * 🧠 Mouse Tracking Radar
   * This effect attaches a sensor to the whole window that listens for mouse movement.
   * It updates the state with the new coordinates, which drives the glowing radial light effect.
   */
  useEffect(() => {
    const move = (e) => setMouse({ x: e.clientX, y: e.clientY });

    window.addEventListener("mousemove", move);
    // Cleanup function: If this page closes, stop tracking the mouse to save memory.
    return () => window.removeEventListener("mousemove", move);
  }, []);

  /**
   * 🎟 The Main Engine: Redeem Coupon
   * Triggered when the user hits the Claim button.
   */
  const handleRedeem = async () => {
    // If the box is empty (or just spaces), stop immediately.
    if (!code.trim()) return;

    setLoading(true); // Lock the button

    try {
      // Construct the exact URL to our backend server
      const API = `${import.meta.env.VITE_API_URL}/api/coupons/redeem`;

      // Make the POST request. 
      // Parameter 1: URL
      // Parameter 2: The Data (the code they typed)
      // Parameter 3: The Headers (Our VIP pass proving we are logged in)
      const res = await axios.post(
        API,
        { code },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      // Extract the relevant data from the server's response
      const { addedCoins, totalCoins } = res.data.data;

      // 🪙 Tell the global system our new coin total
      updateCoins(totalCoins);

      /**
       * 🔊 Play Sound
       * .currentTime = 0 rewinds the audio to the beginning just in case it was already playing.
       * .catch(() => {}) silently handles errors if the browser blocks the audio (common on mobile).
       */
      sound.currentTime = 0;
      sound.play().catch(() => {});

      // 🎉 Show success toast notification
      setPopup({
        type: "success",
        message: `+${addedCoins} COINS`,
        total: totalCoins,
      });

      setCode(""); // Clear the input box
    } catch (err) {
      // ❌ If the server throws an error (like "Invalid Code" or "Already Used")
      setPopup({
        type: "error",
        message: err.response?.data?.message || "INVALID CODE",
      });

      setCode(""); // Clear the input box anyway
    } finally {
      // Always unlock the button, whether it succeeded or failed.
      setLoading(false);

      // ⏳ Auto hide the popup message after 2.5 seconds
      setTimeout(() => setPopup(null), 2500);
    }
  };

  /**
   * ⌨️ Keyboard Support
   * If the user presses the Enter key inside the input box, trigger the redeem function.
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRedeem();
  };

  // ==========================================
  // THE VISUALS (HTML/JSX)
  // ==========================================
  return (
    // Base container. Responsive padding added to keep it from hugging screen edges on mobile.
    <div
      id="redeem"
      className="h-auto w-full text-white flex justify-center px-4 md:px-6 py-10 relative overflow-hidden"
    >
      
      {/* 🎉 POPUP TOAST (Success / Error) */}
      {/* This block only renders if the 'popup' memory is not null */}
      {popup && (
        <div
          className={`absolute top-0 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-xl text-center font-bold text-lg md:text-xl tracking-widest animate-[glitch_0.3s_linear_infinite]
          ${
            popup.type === "success"
              ? "bg-green-500/40 border border-green-400 text-green-100 shadow-[0_0_30px_rgba(0,255,0,0.6)]"
              : "bg-red-500/40 border border-red-400 text-red-100 shadow-[0_0_30px_rgba(255,0,0,0.6)]"
          }`}
          style={{ zIndex: 50 }}
        >
          {popup.message}

          {/* If it was a success, show the new total below the message */}
          {popup.type === "success" && (
            <div className="text-sm mt-1 opacity-70">TOTAL: {popup.total}</div>
          )}
        </div>
      )}

      {/* 🧠 DYNAMIC CURSOR GLOW EFFECT */}
      {/* An absolute positioned div that moves instantly to track the mouse state */}
      <div
        className="pointer-events-none absolute w-[600px] h-[600px] opacity-30"
        style={{
          left: mouse.x - 300, // Offset by 300 so the mouse is dead center of the 600px box
          top: mouse.y - 300,
          background:
            "radial-gradient(circle, rgba(0,255,255,0.15), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* 🧾 MAIN CONTENT CONTAINER */}
      <div className="w-full max-w-5xl z-10 relative">
        
        {/* RESPONSIVE FIX: Text scaling for mobile readability */}
        <h1 className="mb-6 text-xl md:text-2xl tracking-widest uppercase text-white/80 text-center md:text-left">
          Redeem Coupon To Get Coins
        </h1>

        {/* 💎 Glass Container Wrapper (Creates the thin gradient border effect) */}
        <div className="relative z-10 p-[1px] rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20">
          
          {/* Inner frosted glass container */}
          <div className="w-full p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-[0_10px_60px_rgba(0,0,0,0.8)]">
            
            {/* 💰 Wallet Status Card */}
            <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xl">💰</span>
                <p className="text-sm uppercase tracking-widest font-bold opacity-90">
                  Wallet
                </p>
              </div>

              {/* Displays the animated coin value we calculated in the useEffect */}
              <h1 className="text-5xl md:text-6xl font-black tracking-wider text-white drop-shadow-md">
                {displayCoins}
              </h1>

              <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-80">COINS</p>
            </div>

            {/* 🎟 INPUT + BUTTON ROW */}
            {/* RESPONSIVE FIX: flex-col on mobile stacks the button under the input. sm:flex-row on tablets/desktop puts them side by side. */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full">
              
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())} // Force uppercase
                onKeyDown={handleKeyDown} // Listen for the Enter key
                placeholder="ENTER CODE"
                // flex-1 lets it expand to fill all remaining horizontal space on desktop
                className="w-full sm:flex-1 px-6 py-4 md:py-3 bg-black/50 border border-cyan-500/30 rounded-xl text-center md:text-left tracking-widest text-lg focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all placeholder:text-white/30"
              />

              <button
                onClick={handleRedeem}
                disabled={loading} // Lock button while waiting for server
                // w-full on mobile makes it a massive, easy target. sm:w-auto sizes it strictly to the text on desktop.
                className="w-full sm:w-auto px-8 py-4 md:py-3 rounded-xl font-black tracking-widest bg-gradient-to-r from-purple-500 to-cyan-500 cursor-pointer hover:scale-105 active:scale-95 transition-all ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
              >
                {loading ? "..." : "CLAIM"}
              </button>
            </div>

            <p className="text-center text-xs mt-6 opacity-40 font-mono tracking-widest">
              SYSTEM READY • ENTER CODE
            </p>
          </div>
        </div>
      </div>

      {/* 🎞 Glitch Animation Keyframes */}
      <style>
        {`
          @keyframes glitch {
            0% { transform: translate(-50%, 0); }
            20% { transform: translate(calc(-50% - 2px), 2px); }
            40% { transform: translate(calc(-50% - 2px), -2px); }
            60% { transform: translate(calc(-50% + 2px), 2px); }
            80% { transform: translate(calc(-50% + 2px), -2px); }
            100% { transform: translate(-50%, 0); }
          }
        `}
      </style>
    </div>
  );
};

export default RedeemCoupon;