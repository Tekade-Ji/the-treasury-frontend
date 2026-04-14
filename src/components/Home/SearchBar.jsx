// Think of these imports as gathering your tools before building a house.
// React gives us our core building blocks (useState, useEffect, useRef).
import React, { useState, useEffect, useRef } from "react";
// Lucide-react gives us pre-made, cool-looking icons (the magnifying glass and the X).
import { Search, X } from "lucide-react";
// useNavigate is our steering wheel to move the user to different pages.
import { useNavigate } from "react-router-dom";
// API is the custom phone line we built to talk to your backend database.
import API from "../../api/axios";

export default function GlassSearchBar() {
  // --- MEMORY (State) ---
  // useState is short-term memory for this specific component. 
  // 'query' remembers what the user is typing. 'setQuery' is how we update that memory.
  const [query, setQuery] = useState("");
  // 'focused' remembers if the user is actively clicking inside the search bar (true/false).
  const [focused, setFocused] = useState(false);
  // 'results' remembers the products that match whatever the user typed.
  const [results, setResults] = useState([]);
  // 'products' remembers the massive list of ALL products we fetch from the database.
  const [products, setProducts] = useState([]);

  // --- REFERENCES (Refs) ---
  // useRef lets us point directly at a specific HTML element on the screen without refreshing the page.
  // wrapperRef points to the whole search component (so we know if the user clicked outside of it).
  const wrapperRef = useRef(null);
  // inputRef points to the actual typing box (so we can force the keyboard to hide when needed).
  const inputRef = useRef(null);
  
  // Grab the steering wheel
  const navigate = useNavigate();

  // --- HELPER FUNCTION ---
  // A stubborn function that tries to get data. If it fails, it waits 1.5 seconds and tries again forever until it works.
  const fetchWithRetry = async (fn) => {
    while (true) {
      try {
        const res = await fn(); // Try the task
        return res; // Success! Return the data.
      } catch (err) {
        console.log("Retrying...");
        await new Promise((res) => setTimeout(res, 1500)); // Failed. Wait 1.5s, loop back to the top.
      }
    }
  };

  // --- ACTIONS (Effects) ---
  // useEffect is a gatekeeper. The empty array [] at the bottom means: "Do this exactly ONCE when the page loads."
  // 🔥 FETCH PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Go ask the database for all the products
        const res = await fetchWithRetry(() => API.get("/api/products"));
        const data = res.data;

        // The database might send the data back in different wrappers depending on how the backend is built. 
        // This block smartly digs through the data to find the actual array of items.
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (Array.isArray(data.products)) items = data.products;
        else if (Array.isArray(data.data)) items = data.data;

        // Save the massive list of items into our component's memory
        setProducts(items);
      } catch (err) {
        console.error("API error:", err);
        setProducts([]); // If everything breaks, just set an empty list so the app doesn't crash
      }
    };

    fetchProducts(); // Actually execute the block we just wrote
  }, []); // <-- The empty array ensuring this only happens once

  // 🔎 SEARCH LOGIC
  // This useEffect runs every time the 'query' or 'products' memory changes.
  useEffect(() => {
    // If the user hasn't typed anything (or just typed spaces), empty the search results and stop.
    if (!query.trim() || !Array.isArray(products)) {
      setResults([]);
      return;
    }

    // Convert what they typed to lowercase so "Apple" and "apple" match properly.
    const q = query.toLowerCase();
    
    // Filter down the massive product list. Keep the item if its title OR description includes the typed letters.
    const filtered = products.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      return titleMatch || descMatch;
    });

    // Save the matching items into our 'results' memory
    setResults(filtered);
  }, [query, products]); // <-- Tells React: "Run this block whenever 'query' or 'products' changes."

  // 🔥 CLICK OUTSIDE TO CLOSE
  useEffect(() => {
    const handleClickOutside = (e) => {
      // If the wrapper exists, AND the thing the user clicked (e.target) is NOT inside our wrapper...
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFocused(false); // Tell memory the search bar is no longer focused
        inputRef.current?.blur(); // Force the input box to lose focus (closes the mobile keyboard)
      }
    };
    // Listen for every mouse click on the whole webpage
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup function: If this component dies, stop listening for clicks (saves computer memory)
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 ESC KEY TO CLOSE
  useEffect(() => {
    const handleEsc = (e) => {
      // If they press the Escape key...
      if (e.key === "Escape") {
        setFocused(false); // Unfocus
        inputRef.current?.blur(); // Drop the keyboard
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // --- THE ACTUAL VISUALS (HTML/JSX) ---
  return (
    // Responsive padding and width container
    <div className="flex flex-col items-center justify-center p-4 md:p-10 w-full">
      <div ref={wrapperRef} className="flex flex-col items-center w-full">
        
        {/* 🔍 SEARCH BAR */}
        <div
          // Responsive width magic scaling
          className={`relative flex items-center transition-all duration-500 w-full max-w-[95vw] md:max-w-none ${
            focused ? "md:w-[700px] lg:w-[900px]" : "md:w-[500px] lg:w-[600px]"
          }`}
        >
          {/* Glowing background effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 via-red-300 to-red-500 blur-lg opacity-40"></div>

          {/* The actual input container (glass effect) */}
          <div className="relative flex items-center w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-full shadow-xl px-4 py-3">
            <Search className="text-white/70" />

            <input
              ref={inputRef}
              type="text"
              value={query} // Tie the input box to our 'query' memory
              onChange={(e) => setQuery(e.target.value)} // Update memory every time they type a letter
              onFocus={() => setFocused(true)} // When clicked, tell memory it's focused
              onKeyDown={(e) => {
                // If they press Enter, and there is exactly ONE result, just take them straight to that product page.
                if (e.key === "Enter") {
                  if (results.length === 1 && results[0]?._id) {
                    navigate(`/product/${results[0]._id}`);
                    setFocused(false);
                    inputRef.current?.blur();
                  }
                }
              }}
              placeholder="Search products..."
              // bg-transparent makes it invisible so the glass effect shows through.
              className="bg-transparent outline-none text-white placeholder-white/60 px-3 w-full text-lg"
            />

            {/* If they have typed anything at all, show the X button to let them clear it */}
            {query && (
              <button
                onClick={() => {
                  setQuery(""); // Clear what they typed
                  setResults([]); // Clear the dropdown
                  inputRef.current?.blur(); // Drop focus
                }}
                className="text-white/70 hover:text-red-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* 🔥 RESULTS DROPDOWN */}
        {/* Only show this box IF they are focused on the input AND we actually have results to show */}
        {focused && results.length > 0 && (
          // RESPONSIVE & SCROLLBAR FIX:
          // The long string of [&::-webkit...] classes builds a custom scrollbar directly in Tailwind.
          // It creates a transparent track with a sleek, rounded, semi-transparent white thumb that brightens on hover.
          <div className=" cursor-pointer mt-4 w-full max-w-[95vw] md:max-w-none md:w-[700px] lg:w-[900px] max-h-[300px] overflow-y-auto backdrop-blur-xl bg-cyan-400/10 border border-white/10 rounded-3xl shadow-sm p-3 text-white space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40">
            
            {/* Take our results memory, map over it, and draw a block for every single item */}
            {results.map((item, index) => (
              <div
                key={`${item._id || item.id || item.title}-${index}`} // A unique ID React needs to keep track of lists
                onMouseDown={() => {
                  // When they click a result...
                  setQuery(item.title); // Fill the search bar with the item name
                  setFocused(false); // Close the dropdown
                  inputRef.current?.blur(); // Unfocus the bar

                  if (item._id) {
                    navigate(`/product/${item._id}`); // Drive the user to the product page
                  }
                }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 cursor-pointer transition"
              >
                {/* If the product has an image, render it */}
                {item.thumbnail && (
                  <img
                    // Logic to figure out if the image is an external link (http) or hosted on your own server
                    src={
                      item.thumbnail.startsWith("http")
                        ? item.thumbnail
                        : `${import.meta.env.VITE_API_URL}/${item.thumbnail.replace(/\\/g, "/")}`
                    }
                    alt={item.title}
                    className="w-10 h-10 object-cover rounded-md"
                    // If the image link is broken, secretly hide the image tag so it doesn't look ugly
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}

                {/* The text next to the image */}
                <div className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-white/60 line-clamp-1">
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ❌ NO RESULTS FALLBACK */}
        {/* If they are focused, typed at least 2 letters, and there are 0 results... tell them. */}
        {focused && query.length > 1 && results.length === 0 && (
          <p className="text-white/50 mt-4">No results found</p>
        )}
      </div>
    </div>
  );
}