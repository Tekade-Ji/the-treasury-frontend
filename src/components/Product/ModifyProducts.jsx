// React tools: useState for component memory, useEffect for triggers, useCallback for performance optimization.
import { useState, useEffect, useCallback } from "react";
// Custom authentication vault.
import { useAuth } from "../../context/AuthContext";

const ModifyProduct = ({ product, onClose, onUpdated }) => {
  // Grab user info to authorize the database update
  const { user } = useAuth();
  const authToken = user?.token || "";

  // -----------------------------
  // STATE HOOKS (Memory)
  // -----------------------------
  // Remembers the text data for the product
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    price: "",
    videoUrl: "",
    fileUrl: "",
  });

  // --- SEPARATED ASSET PIPELINES ---
  // Thumbnail memory
  const [editThumbnail, setEditThumbnail] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState("");

  // Supplemental images memory
  const [editImages, setEditImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // 🔥 DRAG AND DROP ENGAGEMENT STATES
  // These remember if a file is currently hovering directly over the drop zones.
  const [thumbDrag, setThumbDrag] = useState(false);
  const [imgDrag, setImgDrag] = useState(false);

  // -----------------------------
  // INIT DATA
  // -----------------------------
  // When the popup opens, fill the boxes with the product's current data
  useEffect(() => {
    if (product) {
      setEditData({
        title: product.title,
        description: product.description,
        price: product.price,
        videoUrl: product.videoUrl || "",
        fileUrl: product.fileUrl || "",
      });
      setExistingThumbnail(product.thumbnail || "");
      setExistingImages(product.images || []);
    }
  }, [product]);

  // -----------------------------
  // HELPER FOR IMAGE RENDER
  // -----------------------------
  // Figures out the correct URL to display the image properly
  const getImageSrc = (src) => {
    if (!src) return "/placeholder.png";
    if (src.startsWith("http") || src.startsWith("blob:")) return src;
    const cleanFilename = src.replace(/^uploads[\\/]/, "").replace(/\\/g, "/");
    return `${import.meta.env.VITE_API_URL}/uploads/${cleanFilename}`;
  };

  // -----------------------------
  // EXECUTE UPDATE LOGIC
  // -----------------------------
  // Packages the new text and files and sends them to the database
  const executeUpdate = useCallback(async () => {
    const formData = new FormData();
    Object.keys(editData).forEach((key) => formData.append(key, editData[key]));
    formData.append("imageUrls", existingImages.join(","));
    if (editThumbnail) formData.append("thumbnail", editThumbnail);
    editImages.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${product._id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData,
        },
      );

      const data = await res.json();
      if (res.ok) {
        onUpdated(data.data); // Tell the parent component the data changed
        window.dispatchEvent(new Event("product-updated")); // Broadcast update to whole app
        onClose(); // Close the modal
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  }, [
    editData,
    existingImages,
    editThumbnail,
    editImages,
    authToken,
    product,
    onClose,
    onUpdated,
  ]);

  // -----------------------------
  // KEYBOARD BINDINGS
  // -----------------------------
  // Let users close the popup with Escape or submit with Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        // Prevent submission if the user is hitting enter inside the description textarea to make a new line
        if (e.target.tagName === "TEXTAREA") return;

        e.preventDefault();
        executeUpdate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, executeUpdate]);

  if (!product) return null;

  // ==========================================
  // THE VISUALS (HTML/JSX)
  // ==========================================
  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 global-cursor-zone"
      onClick={onClose} // Clicking the dark background closes the popup
    >
      <div
        className="bg-gray-950 border border-cyan-500/30 p-6 rounded-2xl w-full max-w-6xl flex flex-col shadow-[0_0_40px_rgba(0,255,255,0.1)]"
        onClick={(e) => e.stopPropagation()} // Clicking inside the popup prevents it from closing
      >
        {/* HEADER */}
        <h2 className="text-2xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase tracking-widest border-b border-gray-800 pb-2 shrink-0">
          Reconfigure Construct
        </h2>

        {/* HIGH DENSITY GRID */}
        <div className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMN 1: DATA & TELEMETRY */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-1">
                Telemetry
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">
                  Designation (Title)
                </label>
                <input
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                  className="w-full bg-black border border-gray-700 focus:border-cyan-400 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">
                  System Specs (Description)
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-black border border-gray-700 focus:border-cyan-400 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                  Value (Price)
                </label>
                <input
                  type="number"
                  value={editData.price}
                  onChange={(e) =>
                    setEditData({ ...editData, price: e.target.value })
                  }
                  className="w-full bg-black border border-gray-700 focus:border-purple-400 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                <div>
                  <label className="block text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-1">
                    Video Feed URL
                  </label>
                  <input
                    value={editData.videoUrl}
                    onChange={(e) =>
                      setEditData({ ...editData, videoUrl: e.target.value })
                    }
                    className="w-full bg-black border border-gray-700 focus:border-pink-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-1">
                    Download Package URL
                  </label>
                  <input
                    value={editData.fileUrl}
                    onChange={(e) =>
                      setEditData({ ...editData, fileUrl: e.target.value })
                    }
                    className="w-full bg-black border border-gray-700 focus:border-pink-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 2: VISUAL ASSET MANAGER */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-1">
                Visual Assets
              </h3>

              <div className="grid grid-cols-2 gap-4">
                
                {/* THUMBNAIL PIPELINE */}
                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">
                    Primary Thumbnail
                  </label>
                  <div
                    onClick={() =>
                      document.getElementById("thumbnailInput").click()
                    }
                    // 🔥 TRIGGER: Detect when a file enters the airspace of this box
                    onDragOver={(e) => {
                      e.preventDefault();
                      setThumbDrag(true); // Turn on the glow
                    }}
                    // 🔥 TRIGGER: Detect when the file leaves the airspace
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setThumbDrag(false); // Turn off the glow
                    }}
                    // 🔥 TRIGGER: Detect the drop
                    onDrop={(e) => {
                      e.preventDefault();
                      setThumbDrag(false); // Turn off the glow
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setEditThumbnail(e.dataTransfer.files[0]);
                      }
                    }}
                    // Dynamic styling: If thumbDrag is true, glow cyan and add a subtle background tint. Otherwise, keep the standard look.
                    className={`border-2 border-dashed rounded-lg p-2 text-center !cursor-pointer transition-all duration-300 group h-28 flex items-center justify-center relative ${
                      thumbDrag
                        ? "border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.4)] bg-cyan-400/10"
                        : "border-gray-700 hover:border-cyan-400 bg-black/50"
                    }`}
                  >
                    <div className="pointer-events-none h-full w-full flex items-center justify-center">
                      
                      {/* Visual Feedback Logic */}
                      {thumbDrag ? (
                        // 1. If currently dragging a file over the box, show an engaging instruction
                        <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest animate-pulse">
                          Drop to Engage
                        </p>
                      ) : editThumbnail || existingThumbnail ? (
                        // 2. If an image exists and we are not dragging, show the image
                        <img
                          src={
                            editThumbnail
                              ? URL.createObjectURL(editThumbnail)
                              : getImageSrc(existingThumbnail)
                          }
                          className="h-full rounded-md object-cover shadow-lg group-hover:opacity-80 transition-opacity"
                          alt="Thumbnail"
                        />
                      ) : (
                        // 3. If empty, show standard placeholder text
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Upload Thumbnail
                        </p>
                      )}
                    </div>

                    <input
                      type="file"
                      id="thumbnailInput"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0])
                          setEditThumbnail(e.target.files[0]);
                      }}
                    />
                  </div>
                </div>

                {/* ADDITIONAL IMAGES DROPZONE */}
                <div>
                  <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                    Supplemental Media
                  </label>
                  <div
                    onClick={() =>
                      document.getElementById("imagesInput").click()
                    }
                    // 🔥 TRIGGER: Detect drag enter
                    onDragOver={(e) => {
                      e.preventDefault();
                      setImgDrag(true);
                    }}
                    // 🔥 TRIGGER: Detect drag leave
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setImgDrag(false);
                    }}
                    // 🔥 TRIGGER: Detect drop
                    onDrop={(e) => {
                      e.preventDefault();
                      setImgDrag(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length) {
                        setEditImages((prev) => [
                          ...prev,
                          ...Array.from(e.dataTransfer.files),
                        ]);
                      }
                    }}
                    // Dynamic styling: If imgDrag is true, glow purple.
                    className={`border-2 border-dashed rounded-lg p-2 text-center !cursor-pointer transition-all duration-300 h-28 flex items-center justify-center ${
                      imgDrag
                        ? "border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] bg-purple-400/10"
                        : "border-gray-700 hover:border-purple-400 bg-black/50"
                    }`}
                  >
                    {/* Dynamic text changes color and pulses when engaged */}
                    <p
                      className={`text-[10px] uppercase tracking-wider pointer-events-none transition-colors duration-300 ${
                        imgDrag
                          ? "text-purple-400 font-bold animate-pulse text-xs"
                          : "text-gray-500"
                      }`}
                    >
                      {imgDrag ? "Drop to Inject Files" : "Inject New Files"}
                    </p>
                    
                    <input
                      type="file"
                      id="imagesInput"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files.length) {
                          setEditImages((prev) => [
                            ...prev,
                            ...Array.from(e.target.files),
                          ]);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ASSET GALLERY */}
              <div className="bg-black border border-gray-800 rounded-lg p-3 flex flex-wrap gap-3 h-[110px] overflow-hidden">
                {existingImages.length === 0 && editImages.length === 0 && (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs uppercase pointer-events-none">
                    No supplemental media.
                  </div>
                )}

                {existingImages.map((imgUrl, idx) => (
                  <div
                    key={`exist-${idx}`}
                    className="relative group w-16 h-16 rounded-md overflow-hidden border border-gray-700 shrink-0"
                  >
                    <img
                      src={getImageSrc(imgUrl)}
                      className="w-full h-full object-cover"
                      alt="Existing"
                    />

                    <button
                      onClick={() =>
                        setExistingImages((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute inset-0 bg-black/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center !cursor-pointer text-red-500 hover:text-red hover:scale-125 font-black text-xl z-10 w-full h-full"
                    >
                      ✕
                    </button>

                    <span className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-center text-cyan-400 font-mono py-[1px] pointer-events-none">
                      DATA
                    </span>
                  </div>
                ))}

                {editImages.map((file, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="relative group w-16 h-16 rounded-md overflow-hidden border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)] shrink-0"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-cover"
                      alt="New"
                    />

                    <button
                      onClick={() =>
                        setEditImages((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm !cursor-pointer text-red-500 hover:text-red-400 font-bold text-lg drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] z-10 w-full h-full"
                    >
                      ✕
                    </button>

                    <span className="absolute bottom-0 left-0 right-0 bg-purple-900/80 text-[8px] text-center text-white font-mono py-[1px] animate-pulse pointer-events-none">
                      NEW_
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4 mt-6 pt-4 border-t border-gray-800 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border-2 cursor-pointer border-gray-600 text-gray-400 hover:text-black hover:bg-white hover:border-white uppercase tracking-widest text-xs font-bold py-2.5 rounded-lg transition-all duration-300"
          >
            Abort
          </button>

          <button
            onClick={executeUpdate}
            className="flex-1 bg-cyan-950 border-2 cursor-pointer border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] uppercase tracking-widest text-xs font-bold py-2.5 rounded-lg transition-all duration-300"
          >
            Execute Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModifyProduct;