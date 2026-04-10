import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const UploadForm = () => {
  const { user, role, isLoggedIn, loading } = useAuth();
  const authToken = user?.token || "";

  // -----------------------------
  // STATE HOOKS
  // -----------------------------
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fileUrlRef = useRef(null);

  // -----------------------------
  // DRAG & DROP / FILE HANDLERS
  // -----------------------------
  const onDragOver = (e) => {
    e.preventDefault();
    setThumbnailDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setThumbnailDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setThumbnailDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) setThumbnail(file);
  };

  const onThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) setThumbnail(file);
  };

  const onImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  // -----------------------------
  // FORM SUBMIT
  // -----------------------------
  const onSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    if (!isLoggedIn || role !== "admin") {
      setError("Only admins can upload products.");
      return;
    }

    const formData = new FormData(e.target);

    if (thumbnail) formData.append("thumbnail", thumbnail);
    images.forEach((img) => formData.append("images", img));

    setSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to upload product.");
      } else {
        setSuccess("Product uploaded successfully!");

        e.target.reset();
        setThumbnail(null);
        setImages([]);

        // 🔥 trigger UpdateProducts refresh
        window.dispatchEvent(new Event("product-updated"));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
    <section className="max-w-5xl mx-auto bg-gradient-to-tr from-gray-900/60 via-purple-900/50 to-black/60 rounded-3xl p-10 shadow-lg backdrop-blur-lg border border-purple-700/40 mb-12">
      <h2 className="text-3xl font-semibold mb-8 border-b border-purple-600 pb-3">
        Upload Product
      </h2>

      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      {success && <p className="text-green-400 text-center mb-4">{success}</p>}

      {role !== "admin" && (
        <p className="text-yellow-400 mb-4 text-center">
          You are not an admin. Only admins can upload products.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        <fieldset disabled={role !== "admin"}>
          {/* ALL YOUR UI BELOW IS UNCHANGED */}
          {/* Title & Description */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative group">
              <label htmlFor="title" className="block mb-2 font-semibold">
                Product Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="Ex: Galactic Sword"
                className="w-full bg-transparent border border-purple-600 rounded-lg px-4 py-3 text-white font-medium
                  focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)]
                  transition-shadow duration-300"
              />
            </div>

            <div className="flex-[2] relative group">
              <label htmlFor="description" className="block mb-2 font-semibold">
                Product Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Ex: A legendary sword forged in a dying star..."
                className="w-full bg-transparent border border-purple-600 rounded-lg px-4 py-3 resize-none text-white font-medium
                  focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)]
                  transition-shadow duration-300"
              />
            </div>
          </div>

          {/* Price */}
          <div className="relative group max-w-xs">
            <label htmlFor="price" className="block mb-2 font-semibold">
              Price (USD)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="Ex: 49.99"
              className="w-full bg-transparent border border-purple-600 rounded-lg px-4 py-3 text-white font-medium
                focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)]
                transition-shadow duration-300"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block mb-3 font-semibold">
              Upload Thumbnail (drag & drop or click)
            </label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileUrlRef.current?.click()}
              className={`relative border-4 border-dashed rounded-2xl cursor-pointer flex items-center justify-center h-40 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950
                transition-all duration-300 ${thumbnailDragActive ? "border-orange-400 shadow-[0_0_20px_3px_rgba(249,115,22,0.8)]" : "border-purple-600"}`}
            >
              {thumbnail ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(thumbnail)}
                    alt="Thumbnail"
                    className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnail(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="text-orange-400 font-semibold text-center pointer-events-none">
                  Drag & drop thumbnail or click
                </p>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileUrlRef}
                onChange={onThumbnailChange}
              />
            </div>
          </div>

          {/* Additional Images */}
          {/* Additional Images */}
          <div>
            <label htmlFor="images" className="block mb-3 font-semibold">
              Additional Images (optional)
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();

                const files = Array.from(e.dataTransfer.files || []);
                const url =
                  e.dataTransfer.getData("text/uri-list") ||
                  e.dataTransfer.getData("text/plain");

                // ✅ Case 1: Real files (from PC)
                if (files.length > 0 && files[0].type.startsWith("image/")) {
                  setImages((prev) => [...prev, ...files]);
                  return; // 🚀 IMPORTANT: stop here so URL is not also added
                }

                // ✅ Case 2: URL from internet
                if (url && url.startsWith("http")) {
                  setImageUrls((prev) => [...prev, url]);
                }
              }}
              onClick={() => document.getElementById("imagesInput").click()}
              className="w-full rounded-md border border-purple-600 bg-transparent px-4 py-6 text-white font-medium
    text-center cursor-pointer hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
            >
              <p className="text-orange-400 font-semibold">
                Drag & drop images (PC or internet) or click to upload
              </p>

              <input
                id="imagesInput"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) =>
                  setImages((prev) => [...prev, ...Array.from(e.target.files)])
                }
              />
            </div>

            {/* Preview */}
            {(images.length > 0 || imageUrls.length > 0) && (
              <div className="flex flex-wrap gap-4 mt-4">
                {/* PC Images */}
                {images.map((img, idx) => (
                  <div key={`file-${idx}`} className="relative w-24 h-24">
                    <img
                      src={URL.createObjectURL(img)}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages(images.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-1 py-0.5 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* URL Images */}
                {imageUrls.map((url, idx) => (
                  <div key={`url-${idx}`} className="relative w-24 h-24">
                    <img
                      src={url}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrls(imageUrls.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-1 py-0.5 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video URL */}
          <div>
            <label htmlFor="videoUrl" className="block mb-3 font-semibold">
              Video URL (optional)
            </label>
            <input
              id="videoUrl"
              name="videoUrl"
              type="url"
              placeholder="https://youtube.com/..."
              className="w-full rounded-md border border-purple-600 bg-transparent px-4 py-3 text-white font-medium
                focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
            />
          </div>

          {/* File URL */}
          <div>
            <label htmlFor="fileUrl" className="block mb-3 font-semibold">
              File URL (compulsory)
            </label>
            <input
              id="fileUrl"
              name="fileUrl"
              type="url"
              required
              placeholder="https://example.com/download-file"
              className="w-full rounded-md border border-purple-600 bg-transparent px-4 py-3 text-white font-medium
                focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 mt-6 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500
              rounded-xl font-extrabold text-black text-xl tracking-wide hover:scale-[1.05] active:scale-[0.95] transform transition-all duration-200 ease-in-out cursor-pointer shadow-lg shadow-orange-400/80"
          >
            {submitting ? "Uploading..." : "Upload Product"}
          </button>
        </fieldset>
      </form>
    </section>
  );
};

export default UploadForm;
