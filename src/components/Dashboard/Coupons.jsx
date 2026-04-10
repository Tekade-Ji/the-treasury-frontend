import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const API = `${import.meta.env.VITE_API_URL}/api/coupons`;

export default function Coupons() {
  const { user, role } = useAuth();

  const isAdmin = role === "admin";
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [fxId, setFxId] = useState(null);

  
  const fetchWithRetry = async (fn) => {
  let delay = 1000;

  while (true) {
    try {
      const res = await fn();

      // 🔥 handle bad responses too
      if (!res.ok) throw new Error("Bad response");

      return res;
    } catch (err) {
      console.log("Retrying coupons in", delay, "ms");
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, 5000);
    }
  }
};

  // 🔌 FETCH
  useEffect(() => {
    if (!token) return;

    const fetchCoupons = async () => {
  const res = await fetchWithRetry(() =>
    fetch(API, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  const data = await res.json();
  setCoupons(data.data || []);
};

    fetchCoupons();
  }, [token]);

  // ➕ CREATE
  const createCoupon = async () => {
    if (!isAdmin || !code || !value) return;

    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, value }),
    });

    const data = await res.json();

    setCoupons((prev) => [...prev, data.data]);
    setFxId(data.data._id);

    setCode("");
    setValue("");
    setTimeout(() => setFxId(null), 800);
  };

  // ❌ DELETE
  const deleteCoupon = async (id) => {
    if (!isAdmin) return;

    await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setCoupons((prev) => prev.filter((c) => c._id !== id));
  };

  // 🔄 TOGGLE
  const toggleCoupon = async (id) => {
    if (!isAdmin) return;

    await fetch(`${API}/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    setCoupons((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isActive: !c.isActive } : c)),
    );
  };

  // ✏️ EDIT
  const startEdit = (coupon) => {
    if (!isAdmin) return;
    setEditingId(coupon._id);
    setEditData({ code: coupon.code, value: coupon.value });
  };

  const saveEdit = async () => {
    const res = await fetch(`${API}/${editingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editData),
    });

    const data = await res.json();

    setCoupons((prev) =>
      prev.map((c) => (c._id === editingId ? data.data : c)),
    );

    setEditingId(null);
  };

  // 🔍 FILTER + SORT
  const processedCoupons = coupons
    .filter((c) => c.code.toLowerCase().includes(search.toLowerCase()))
    .filter((c) =>
      filter === "all" ? true : filter === "active" ? c.isActive : !c.isActive,
    )
    .sort((a, b) => {
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "creator") {
        return (a.createdBy?.name || "").localeCompare(b.createdBy?.name || "");
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="flex justify-center">
      <div className="h-auto p-8 w-full max-w-[1090px]">
        {/* HEADER */}
        <h1 className="text-4xl mb-6 font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          Coupon Control
        </h1>

        {/* CREATE */}
        <div className="mb-6 flex gap-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createCoupon();
              }
            }}
            placeholder="Coupon Code"
            className="flex-1 px-4 py-3 rounded-xl bg-black/40 border uppercase border-cyan-500/30"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createCoupon();
              }
            }}
            type="number"
            placeholder="Value"
            className="w-30 text-center px-2 py-3 rounded-xl bg-black/40 border border-purple-500/30"
          />
          <button
            onClick={createCoupon}
            className={`px-6 py-3 rounded-xl cursor-pointer ${
              isAdmin
                ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:scale-105"
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            {isAdmin ? "Create" : "Locked"}
          </button>
        </div>

        {/* SEARCH / FILTER / SORT */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl bg-black/40 border border-cyan-500/30"
          />

          <select
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl bg-black/40 cursor-pointer"
          >
            <option value="latest">Latest</option>
            <option value="value">Value</option>
            <option value="creator">Creator</option>
          </select>

          <select
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-black/40 cursor-pointer"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {/* LIST */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6  ">
          {processedCoupons.map((c) => (
            <div
              key={c._id}
              className="
    p-5 
    rounded-2xl 
    bg-white/5 
    border 
    border-white/10 
    backdrop-blur-md 
    transition 
    transform 
    hover:scale-102 
    hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]
  "
            >
              {editingId === c._id ? (
                <>
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
                    className="w-full mb-2 px-3 py-2 rounded bg-black/40"
                  />
                  <input
                    type="number"
                    value={editData.value}
                    onChange={(e) =>
                      setEditData({ ...editData, value: +e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdit();
                      }
                    }}
                    className="w-full mb-2 px-3 py-2 rounded bg-black/40"
                  />
                  <button
                    onClick={saveEdit}
                    className="text-green-400 text-sm cursor-pointer"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <h3
                    onClick={() => startEdit(c)}
                    className="text-xl text-cyan-300 cursor-pointer"
                  >
                    {c.code}
                  </h3>
                  <p>Value: {c.value} Coins</p>
                  <p className="text-xs text-gray-400">
                    By: {c.createdBy?.name || "Unknown"}
                  </p>
                </>
              )}

              <div className="flex justify-between mt-4">
                <span
                  className={c.isActive ? "text-green-400" : "text-red-400"}
                >
                  {c.isActive ? "Active" : "Disabled"}
                </span>

                <div className="flex gap-2">
                  <button
                    className="
                                rounded-full p-2 cursor-pointer
                                transition-all duration-300 ease-in-out

                                /* base glass */

                                /* hover glow (no border) */
                                hover:scale-105
                                 hover:bg-white/10
                                hover:backdrop-blur-md
                                hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]
                                "
                    onClick={() => toggleCoupon(c._id)}
                  >
                    ⚡
                  </button>
                  <button
                    onClick={() => deleteCoupon(c._id)}
                    className="
                        rounded-full p-2 cursor-pointer
                            transition-all duration-300 ease-in-out

                        /* base glass */

                        /* hover danger glow */
                        hover:scale-105
                        hover:text-red-500
                         hover:bg-red-500/10
                            hover:backdrop-blur-md
                         hover:shadow-[0_0_18px_rgba(239,68,68,0.25)]
                         "
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
