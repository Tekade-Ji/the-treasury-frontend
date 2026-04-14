// Think of imports like grabbing specific tools from your toolbox before you start working.
// useState gives our component 'memory'. useEffect lets us trigger actions automatically.
import { useState, useEffect } from "react";
// Pulling in your custom authentication vault to check if the user is an admin.
import { useAuth } from "../../context/AuthContext";

// We set up our direct phone line to the backend database using environment variables.
const API = `${import.meta.env.VITE_API_URL}/api/coupons`;

export default function Coupons() {
  // Grab the current user's data and their role (e.g., 'admin' or 'user')
  const { user, role } = useAuth();

  // A simple true/false check to see if the user is an admin
  const isAdmin = role === "admin";
  
  // Grab the VIP pass (token) from the browser's storage so the database knows we are legit
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // -----------------------------
  // STATE HOOKS (Component Memory)
  // -----------------------------
  const [coupons, setCoupons] = useState([]); // Remembers the list of all coupons
  const [code, setCode] = useState(""); // Remembers what you are typing in the 'Code' box
  const [value, setValue] = useState(""); // Remembers what you type in the 'Value' box
  const [search, setSearch] = useState(""); // Remembers your search bar text
  const [sortBy, setSortBy] = useState("latest"); // Remembers how you want to sort the list
  const [filter, setFilter] = useState("all"); // Remembers if you want active, disabled, or all
  const [editingId, setEditingId] = useState(null); // Remembers WHICH coupon you are currently editing
  const [editData, setEditData] = useState({}); // Remembers the new text while you edit
  const [fxId, setFxId] = useState(null); // Used to trigger quick visual effects on creation

  // -----------------------------
  // HELPER: STUBBORN FETCH
  // -----------------------------
  // If the server hiccups, this function doesn't give up. It waits 1 second, tries again, 
  // then waits 1.5 seconds, then 2.25s... up to 5 seconds. (Exponential backoff)
  const fetchWithRetry = async (fn) => {
    let delay = 1000;

    while (true) {
      try {
        const res = await fn();
        if (!res.ok) throw new Error("Bad response"); // If the server says "404 Not Found", treat it as an error
        return res; // Success! Return the data.
      } catch (err) {
        console.log("Retrying coupons in", delay, "ms");
        await new Promise((r) => setTimeout(r, delay)); // Wait for the delay
        delay = Math.min(delay * 1.5, 5000); // Increase the delay for the next try
      }
    }
  };

  // -----------------------------
  // 🔌 FETCH ALL COUPONS (Runs on load)
  // -----------------------------
  // useEffect with [token] means: "Run this immediately, and run it again if the token changes."
  useEffect(() => {
    if (!token) return; // If no VIP pass, don't even try to fetch

    const fetchCoupons = async () => {
      const res = await fetchWithRetry(() =>
        fetch(API, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const data = await res.json();
      setCoupons(data.data || []); // Save the fetched coupons to our memory
    };

    fetchCoupons();
  }, [token]);

  // -----------------------------
  // ➕ CREATE A NEW COUPON
  // -----------------------------
  const createCoupon = async () => {
    // If not admin, or boxes are empty, do nothing.
    if (!isAdmin || !code || !value) return;

    // Send the new data to the server
    const res = await fetch(API, {
      method: "POST", // POST means "Create new data"
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, value: Number(value) }), // Package our text into JSON format, ensuring value is a math number
    });

    const data = await res.json();

    // Add the brand new coupon to our existing memory array so it shows up instantly without reloading the page
    setCoupons((prev) => [...prev, data.data]);
    setFxId(data.data._id); // Trigger visual effect

    // Clear the typing boxes
    setCode("");
    setValue("");
    setTimeout(() => setFxId(null), 800); // Clear effect after 0.8s
  };

  // -----------------------------
  // ❌ DELETE A COUPON
  // -----------------------------
  const deleteCoupon = async (id) => {
    if (!isAdmin) return;

    // Tell the server to delete it
    await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Update our memory: Keep every coupon EXCEPT the one whose ID matches the deleted one
    setCoupons((prev) => prev.filter((c) => c._id !== id));
  };

  // -----------------------------
  // 🔄 TOGGLE (Enable/Disable)
  // -----------------------------
  const toggleCoupon = async (id) => {
    if (!isAdmin) return;

    // PATCH means "Update just a small piece of this data"
    await fetch(`${API}/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Loop through memory. Find the one we clicked, and flip its isActive status (true to false, false to true)
    setCoupons((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isActive: !c.isActive } : c)),
    );
  };

  // -----------------------------
  // ✏️ EDIT COUPON
  // -----------------------------
  const startEdit = (coupon) => {
    if (!isAdmin) return;
    setEditingId(coupon._id); // Tell memory which ID is being edited
    setEditData({ code: coupon.code, value: coupon.value }); // Pre-fill the edit boxes with the current text
  };

  const saveEdit = async () => {
    // Send updated data to the server
    const res = await fetch(`${API}/${editingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editData),
    });

    const data = await res.json();

    // Update memory with the newly returned data from the server
    setCoupons((prev) =>
      prev.map((c) => (c._id === editingId ? data.data : c)),
    );

    setEditingId(null); // Close the edit window
  };

  // -----------------------------
  // 🔍 FILTER + SORT ENGINE
  // -----------------------------
  // This takes our full memory array and processes it before drawing it on screen
  const processedCoupons = coupons
    // Step 1: Filter by search text (Checks BOTH Code name and Code value)
    .filter((c) => {
      // Make the search term lowercase so "FREE" matches "free"
      const searchTerm = search.toLowerCase();
      // Check if the code string includes the search term
      const matchesCode = c.code.toLowerCase().includes(searchTerm);
      // Convert the number (e.g., 500) into a string ("500") and check if it includes the search term
      const matchesValue = c.value?.toString().includes(searchTerm);
      
      // If EITHER the code OR the value matches what they typed, let it pass through the filter
      return matchesCode || matchesValue;
    })
    // Step 2: Filter by dropdown (All, Active, or Disabled)
    .filter((c) =>
      filter === "all" ? true : filter === "active" ? c.isActive : !c.isActive,
    )
    // Step 3: Sort the remaining items based on the sort dropdown
    .sort((a, b) => {
      if (sortBy === "value") return b.value - a.value; // Highest value first
      if (sortBy === "creator") {
        return (a.createdBy?.name || "").localeCompare(b.createdBy?.name || ""); // Alphabetical by creator
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // Default: Newest first
    });

  // ==========================================
  // THE VISUALS (HTML/JSX)
  // ==========================================
  return (
    <div className="flex justify-center text-white">
      {/* Container scales padding based on screen size */}
      <div className="h-auto p-4 md:p-8 w-full max-w-[1090px]">
        
        {/* HEADER */}
        <h1 className="text-3xl md:text-4xl mb-8 font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          Coupon Control
        </h1>

        {/* ------------------------------------- */}
        {/* 🔥 UNIFIED CREATION ROW */}
        {/* ------------------------------------- */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 w-full">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())} // Force everything to uppercase as they type
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createCoupon(); // Hit enter to submit
              }
            }}
            placeholder="Coupon Code"
            className="w-full md:flex-1 px-6 py-3 rounded-full bg-white/5 border border-cyan-500/30 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all uppercase"
          />
          <input
            value={value}
            onChange={(e) => {
              // 🛡️ THE NUMBERS-ONLY SHIELD
              // .replace(/[^0-9]/g, "") looks at every character typed. 
              // If it is NOT (^) a number between 0-9, it deletes it instantly by replacing it with nothing ("").
              const strictNumber = e.target.value.replace(/[^0-9]/g, "");
              setValue(strictNumber);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createCoupon();
              }
            }}
            // We use type="text" with inputMode="numeric". 
            // This pulls up the number pad on mobile, but prevents the browser from letting weird characters (like 'e' or '-') slip past our shield.
            type="text"
            inputMode="numeric"
            placeholder="Value"
            className="w-full md:w-32 text-center px-6 py-3 rounded-full bg-white/5 border border-purple-500/30 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all"
          />
          <button
            onClick={createCoupon}
            className={`w-full md:w-auto px-8 py-3 rounded-full font-bold uppercase tracking-widest transition-all duration-300 ${
              isAdmin
                ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isAdmin ? "Create" : "Locked"}
          </button>
        </div>

        {/* ------------------------------------- */}
        {/* 🔥 UNIFIED SEARCH & FILTERS ROW */}
        {/* ------------------------------------- */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-10 flex-wrap w-full">
          <input
            placeholder="Search codes or values..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // Flex-1 allows the search bar to stretch and take up remaining space, pushing the dropdowns to the right.
            className="w-full md:flex-1 px-6 py-3 rounded-full bg-white/5 border border-cyan-500/30 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
          />

          <select
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-6 py-3 rounded-full bg-white/5 border border-cyan-500/30 text-white cursor-pointer focus:outline-none focus:border-cyan-400 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all outline-none"
          >
            <option value="latest" className="bg-gray-900">Sort: Latest</option>
            <option value="value" className="bg-gray-900">Sort: Value</option>
            <option value="creator" className="bg-gray-900">Sort: Creator</option>
          </select>

          <select
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-auto px-6 py-3 rounded-full bg-white/5 border border-cyan-500/30 text-white cursor-pointer focus:outline-none focus:border-cyan-400 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all outline-none"
          >
            <option value="all" className="bg-gray-900">Filter: All</option>
            <option value="active" className="bg-gray-900">Filter: Active</option>
            <option value="disabled" className="bg-gray-900">Filter: Disabled</option>
          </select>
        </div>

        {/* LIST / GRID SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {processedCoupons.map((c) => (
            <div
              key={c._id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition transform hover:scale-102 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] flex flex-col"
            >
              {editingId === c._id ? (
                <div className="flex flex-col flex-1">
                  <input
                    value={editData.code.toUpperCase()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdit();
                      }
                    }}
                    onChange={(e) =>
                      setEditData({
                        ...editData, 
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full mb-3 px-4 py-2 rounded-lg bg-black/60 border border-cyan-500/50 outline-none text-white focus:border-cyan-400 transition-colors"
                  />
                  <input
                    // Applied the same Numbers-Only shield to the Edit box
                    type="text"
                    inputMode="numeric"
                    value={editData.value}
                    onChange={(e) => {
                      const strictNumber = e.target.value.replace(/[^0-9]/g, "");
                      // If the box isn't empty, convert the strict text back into a real math Number for the database
                      setEditData({ ...editData, value: strictNumber === "" ? "" : Number(strictNumber) });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdit();
                      }
                    }}
                    className="w-full mb-4 px-4 py-2 rounded-lg bg-black/60 border border-cyan-500/50 outline-none text-white focus:border-cyan-400 transition-colors"
                  />
                  <div className="mt-auto flex gap-2">
                     <button
                      onClick={saveEdit}
                      className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-bold py-2 rounded-lg text-sm cursor-pointer transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30 font-bold py-2 rounded-lg text-sm cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Normal view
                <div className="flex flex-col flex-1">
                  <h3
                    onClick={() => startEdit(c)}
                    className="text-2xl font-black text-cyan-300 hover:text-cyan-100 cursor-pointer transition-colors tracking-wider"
                    title="Click to Edit"
                  >
                    {c.code}
                  </h3>
                  
                  {/* High contrast Stark White for the number, muted cyan for "COINS". */}
                  <p className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white tracking-wider">
                      {c.value}
                    </span>
                    <span className="text-cyan-500/70 text-sm font-bold uppercase tracking-widest">
                      Coins
                    </span>
                  </p>

                  <p className="text-xs text-gray-500 mt-auto pt-4">
                    Created By: <span className="text-gray-300">{c.createdBy?.name || "Unknown"}</span>
                  </p>
                </div>
              )}

              {/* Card Footer actions */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                <span
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    c.isActive 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {c.isActive ? "Active" : "Disabled"}
                </span>

                <div className="flex gap-2">
                  <button
                    className="rounded-full p-2 cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white/10 hover:backdrop-blur-md hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] bg-black/20"
                    onClick={() => toggleCoupon(c._id)}
                    title="Toggle Status"
                  >
                    ⚡
                  </button>
                  <button
                    onClick={() => deleteCoupon(c._id)}
                    className="rounded-full p-2 cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:text-red-500 hover:bg-red-500/20 hover:backdrop-blur-md hover:shadow-[0_0_18px_rgba(239,68,68,0.3)] bg-black/20"
                    title="Delete Coupon"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}