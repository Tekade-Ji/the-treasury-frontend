import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const ModifyProduct = ({ product, onClose, onUpdated }) => {
  const { user } = useAuth();
  const authToken = user?.token || "";

const [editData, setEditData] = useState({
  title: "",
  description: "",
  price: "",
  videoUrl: "",
  fileUrl: "",
  thumbnailUrl: "",
  imageUrls: "",
});

  const [editThumbnail, setEditThumbnail] = useState(null);
  const [editImages, setEditImages] = useState([]);
  

  // -----------------------------
  // INIT DATA
  // -----------------------------
  useEffect(() => {
    if (product) {
      setEditData({
        title: product.title,
        description: product.description,
        price: product.price,
        videoUrl: product.videoUrl || "",
        fileUrl: product.fileUrl || "",
        thumbnailUrl: "",
        imageUrls: "",
      });
    }
  }, [product]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <h2 className="text-xl font-bold mb-4 text-white">
          Edit Product
        </h2>

        <div className="space-y-3">

          {/* TITLE */}
          <input
            value={editData.title}
            onChange={(e) =>
              setEditData({ ...editData, title: e.target.value })
            }
            className="w-full bg-transparent border border-purple-600 rounded px-3 py-2"
          />

          {/* DESCRIPTION */}
          <textarea
            value={editData.description}
            onChange={(e) =>
              setEditData({
                ...editData,
                description: e.target.value,
              })
            }
            className="w-full bg-transparent border border-purple-600 rounded px-3 py-2"
          />

          {/* PRICE */}
          <input
            type="number"
            value={editData.price}
            onChange={(e) =>
              setEditData({ ...editData, price: e.target.value })
            }
            className="w-full bg-transparent border border-purple-600 rounded px-3 py-2"
          />

          {/* THUMBNAIL */}
          <div>
            <label className="block text-sm mb-1 text-purple-300">
              Thumbnail
            </label>

            <div
              onClick={() =>
                document.getElementById("thumbnailInput").click()
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();

                if (e.dataTransfer.files[0]) {
                  setEditThumbnail(e.dataTransfer.files[0]);
                }

                const url = e.dataTransfer.getData("text/uri-list");
                if (url) {
                  setEditData((prev) => ({
                    ...prev,
                    thumbnailUrl: url,
                  }));
                }
              }}
              className="border-2 border-dashed border-purple-600 rounded-lg p-3 text-center cursor-pointer"
            >
              {editThumbnail ? (
                <img
                  src={URL.createObjectURL(editThumbnail)}
                  className="h-24 mx-auto rounded"
                />
              ) : editData.thumbnailUrl ? (
                <img
                  src={editData.thumbnailUrl}
                  className="h-24 mx-auto rounded"
                />
              ) : (
                <p className="text-xs text-gray-400">
                  Drag & drop / click / paste URL
                </p>
              )}

              <input
                type="file"
                id="thumbnailInput"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setEditThumbnail(e.target.files[0])
                }
              />
            </div>

            <input
              type="text"
              placeholder="or paste image URL"
              value={editData.thumbnailUrl || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  thumbnailUrl: e.target.value,
                })
              }
              className="mt-2 w-full bg-transparent border border-purple-600 rounded px-3 py-1 text-xs"
            />
          </div>

          {/* ADDITIONAL IMAGES */}
          <div>
            <label className="block text-sm mb-1 text-purple-300">
              Additional Images
            </label>

            <div
              onClick={() =>
                document.getElementById("imagesInput").click()
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();

                if (e.dataTransfer.files.length) {
                  setEditImages((prev) => [
                    ...prev,
                    ...Array.from(e.dataTransfer.files),
                  ]);
                }

                const url = e.dataTransfer.getData("text/uri-list");
                if (url) {
                  setEditData((prev) => ({
                    ...prev,
                    imageUrls: prev.imageUrls
                      ? prev.imageUrls + "," + url
                      : url,
                  }));
                }
              }}
              className="border-2 border-dashed border-purple-600 rounded-lg p-3 text-center"
            >
              <p className="text-xs text-gray-400">
                Drag & drop / click / paste URLs
              </p>

              <input
                type="file"
                id="imagesInput"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) =>
                  setEditImages((prev) => [
                    ...prev,
                    ...Array.from(e.target.files),
                  ])
                }
              />
            </div>

            {/* PREVIEW */}
            <div className="flex flex-wrap gap-2 mt-2">
              {editImages.map((img, idx) => (
                <img
                  key={idx}
                  src={URL.createObjectURL(img)}
                  className="w-16 h-16 object-cover rounded"
                />
              ))}

              {editData.imageUrls &&
                editData.imageUrls
                  .split(",")
                  .map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ))}
            </div>

            <input
              type="text"
              placeholder="comma separated URLs"
              value={editData.imageUrls || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  imageUrls: e.target.value,
                })
              }
              className="mt-2 w-full bg-transparent border border-purple-600 rounded px-3 py-1 text-xs"
            />
          </div>

          {/* VIDEO + FILE */}
          <input
            value={editData.videoUrl}
            onChange={(e) =>
              setEditData({ ...editData, videoUrl: e.target.value })
            }
            placeholder="Video URL"
            className="w-full bg-transparent border border-purple-600 rounded px-3 py-2"
          />

          <input
            value={editData.fileUrl}
            onChange={(e) =>
              setEditData({ ...editData, fileUrl: e.target.value })
            }
            placeholder="File URL"
            className="w-full bg-transparent border border-purple-600 rounded px-3 py-2"
          />

          {/* ACTIONS */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={async () => {
                const formData = new FormData();

                Object.keys(editData).forEach((key) => {
                  formData.append(key, editData[key]);
                });

                if (editThumbnail)
                  formData.append("thumbnail", editThumbnail);

                editImages.forEach((img) =>
                  formData.append("images", img)
                );

                const res = await fetch(
                  `${import.meta.env.VITE_API_URL}/api/products/${product._id}`,
                  {
                    method: "PUT",
                    headers: {
                      Authorization: `Bearer ${authToken}`,
                    },
                    body: formData,
                  }
                );

                const data = await res.json();

                if (res.ok) {
                  onUpdated(data.data);
                  window.dispatchEvent(new Event("product-updated"));
                  onClose();
                }
              }}
              className="flex-1 bg-green-500 hover:bg-green-600 py-2 rounded-md"
            >
              Save
            </button>

            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 py-2 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifyProduct;