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
        })
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
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Loading user data...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Please login to access this page.</p>
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-white">
        Your Uploaded Products
      </h2>

      {myProducts.length === 0 ? (
        <p className="text-gray-300">No products uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {myProducts.map((prod) => (
            <div
              key={prod._id}
              className="bg-gray-900 flex flex-col justify-between rounded-xl p-4 shadow-lg transform transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[12px_-12px_30px_rgba(0,255,255,0.9),-12px_12px_30px_rgba(255,0,0,0.9)]"
            >
              <img
                src={getImageSrc(prod.thumbnail)}
                alt={prod.title}
                className="w-full h-40 object-cover rounded-md mb-2"
              />

              <h3 className="text-lg font-bold">{prod.title}</h3>
              <p className="text-sm text-gray-400">{prod.description}</p>
              <p className="mt-1 font-semibold">${prod.price}</p>

              <div>
              {/* EDIT BUTTON */}
              <button
                onClick={() => onEdit(prod)}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
              >
                Edit Product
              </button>

              {/* DELETE BUTTON */}
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      "WARNING: This will DELETE the entire product. Are you sure?"
                    )
                  )
                    return;

                  try {
                    const res = await fetch(
                      `${import.meta.env.VITE_API_URL}/api/products/${prod._id}`,
                      {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${authToken}`,
                        },
                      }
                    );

                    if (res.ok) {
                      setMyProducts((prev) =>
                        prev.filter((p) => p._id !== prod._id)
                      );
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md  "
              >
                Delete Product
              </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UploadedProducts;