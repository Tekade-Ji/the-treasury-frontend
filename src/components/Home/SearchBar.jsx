import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

export default function GlassSearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [products, setProducts] = useState([]);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

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

  // 🔥 FETCH PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetchWithRetry(() => API.get("/api/products"));
        const data = res.data;

        let items = [];
        if (Array.isArray(data)) items = data;
        else if (Array.isArray(data.products)) items = data.products;
        else if (Array.isArray(data.data)) items = data.data;

        setProducts(items);
      } catch (err) {
        console.error("API error:", err);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  // 🔎 SEARCH LOGIC
  useEffect(() => {
    if (!query.trim() || !Array.isArray(products)) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = products.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      return titleMatch || descMatch;
    });

    setResults(filtered);
  }, [query, products]);

  // 🔥 CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 ESC KEY
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center m-10">
      <div ref={wrapperRef} className="flex flex-col items-center">
        {/* 🔍 SEARCH BAR */}
        <div
          className={`relative flex items-center transition-all duration-500 ${
            focused ? "w-[900px]" : "w-[600px]"
          }`}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 via-red-300 to-red-500 blur-lg opacity-40"></div>

          <div className="relative flex items-center w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-full shadow-xl px-4 py-3">
            <Search className="text-white/70" />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (results.length === 1 && results[0]?._id) {
                    navigate(`/product/${results[0]._id}`);
                    setFocused(false);
                    inputRef.current?.blur();
                  }
                }
              }}
              placeholder="Search products..."
              className="bg-transparent outline-none text-white placeholder-white/60 px-3 w-full text-lg"
            />

            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  inputRef.current?.blur();
                }}
                className="text-white/70 hover:text-red-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* 🔥 RESULTS */}
        {focused && results.length > 0 && (
          <div className="mt-4 w-[900px] max-h-[300px] overflow-y-auto no-scrollbar backdrop-blur-xl bg-cyan-400/10 border border-white/10 rounded-3xl shadow-sm p-3 text-white space-y-2">
            {results.map((item, index) => (
              <div
                key={`${item._id || item.id || item.title}-${index}`}
                onMouseDown={() => {
                  setQuery(item.title);
                  setFocused(false);
                  inputRef.current?.blur();

                  if (item._id) {
                    navigate(`/product/${item._id}`);
                  }
                }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 cursor-pointer transition"
              >
                {item.thumbnail && (
                  <img
                    src={
                      item.thumbnail.startsWith("http")
                        ? item.thumbnail
                        : `${import.meta.env.VITE_API_URL}/${item.thumbnail.replace(/\\/g, "/")}`
                    }
                    alt={item.title}
                    className="w-10 h-10 object-cover rounded-md"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}

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

        {/* ❌ NO RESULTS */}
        {focused && query.length > 1 && results.length === 0 && (
          <p className="text-white/50 mt-4">No results found</p>
        )}
      </div>
    </div>
  );
}
