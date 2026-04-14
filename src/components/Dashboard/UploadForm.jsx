// Think of these imports as gathering your tools before building.
// useState: Short-term memory for this specific page.
// useRef: A laser pointer that lets us target specific HTML elements (like a hidden file input).
import { useState, useRef } from "react";
// Pulling in your custom authentication vault to check if the user is an admin.
import { useAuth } from "../../context/AuthContext";

const UploadForm = () => {
  // Grab the user data, their role, and the master key (token) to talk to the database securely.
  const { user, role, isLoggedIn, loading } = useAuth();
  const authToken = user?.token || "";

  // -----------------------------
  // STATE HOOKS (Component Memory)
  // -----------------------------
  // 'thumbnail' remembers the main image file. 'setThumbnail' updates it.
  const [thumbnail, setThumbnail] = useState(null);
  // Remembers if the user is currently dragging a file over the box (true/false).
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);
  // Remembers the array of extra images (files from the PC).
  const [images, setImages] = useState([]);
  // Remembers the array of image web links (URLs from the internet).
  const [imageUrls, setImageUrls] = useState([]);
  // Remembers if the form is currently talking to the database to prevent double-clicks.
  const [submitting, setSubmitting] = useState(false);
  // Remembers error or success messages to show the user.
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // This points directly at the hidden <input type="file"> so we can trigger it when the user clicks the stylized box.
  const fileUrlRef = useRef(null);

  // -----------------------------
  // DRAG & DROP / FILE HANDLERS
  // -----------------------------
  // Triggered when a file hovers over the drop zone.
  const onDragOver = (e) => {
    e.preventDefault(); // Stops the browser from opening the image in a new tab.
    setThumbnailDragActive(true); // Tell memory to glow the box.
  };

  // Triggered when the file leaves the hover zone.
  const onDragLeave = (e) => {
    e.preventDefault();
    setThumbnailDragActive(false); // Turn off the glow.
  };

  // Triggered when the user literally drops the file.
  const onDrop = (e) => {
    e.preventDefault();
    setThumbnailDragActive(false);

    // Grab the very first file they dropped.
    const file = e.dataTransfer.files[0];
    if (file) setThumbnail(file); // Save it to memory.
  };

  // Triggered when they click the box and use the standard file explorer.
  const onThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) setThumbnail(file);
  };

  // Triggered for the extra images list. Converts the list of files into a true JavaScript Array.
  const onImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  // -----------------------------
  // FORM SUBMIT (Talking to the Database)
  // -----------------------------
  const onSubmit = async (e) => {
    e.preventDefault(); // Stop the page from reloading (the default HTML behavior).

    // Wipe any old messages.
    setError(null);
    setSuccess(null);

    // SECURITY GATE: If they aren't logged in or aren't an admin, kick them out.
    if (!isLoggedIn || role !== "admin") {
      setError("Only admins can upload products.");
      return;
    }

    // FormData is a special package designed specifically for sending files + text to a server.
    const formData = new FormData(e.target);

    // Attach our files to the package.
    if (thumbnail) formData.append("thumbnail", thumbnail);
    images.forEach((img) => formData.append("images", img));

    setSubmitting(true); // Lock the submit button.

    try {
      // Dial the database using our URL and send the FormData package.
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`, // Present our VIP pass.
        },
        body: formData,
      });

      const data = await res.json(); // Read the server's response.

      if (!res.ok) {
        // If the server threw an error code (like 400 or 500).
        setError(data.message || "Failed to upload product.");
      } else {
        // Success!
        setSuccess("Product uploaded successfully!");

        // Clear the form and wipe the images from memory so it's ready for the next product.
        e.target.reset();
        setThumbnail(null);
        setImages([]);

        // 🔥 Broadcast a radio signal to the rest of the website telling it to refresh the product lists.
        window.dispatchEvent(new Event("product-updated"));
      }
    } catch {
      // If the internet completely drops or the server is dead.
      setError("Network error. Please try again.");
    } finally {
      // Unlock the submit button regardless of success or failure.
      setSubmitting(false);
    }
  };

  // -----------------------------
  // AUTH GUARDS (Bouncers)
  // -----------------------------
  // If we are still checking who the user is, show a loading screen.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Loading user data...</p>
      </div>
    );
  }

  // If they are absolutely not logged in, show this.
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Please login to access this page.</p>
      </div>
    );
  }

  return (
    // RESPONSIVE FIX 1: Width & Padding.
    // w-[95%] md:w-full keeps it from touching the screen edges on phones.
    // p-4 sm:p-6 md:p-10 adapts the internal breathing room based on screen size.
    <section className="max-w-5xl mx-auto w-[95%] md:w-full bg-gradient-to-tr from-gray-900/60 via-purple-900/50 to-black/60 rounded-3xl p-4 sm:p-6 md:p-10 shadow-lg backdrop-blur-lg border border-purple-700/40 mb-6 md:mb-12 mt-6">
      
      {/* RESPONSIVE FIX 2: Text Scaling. text-2xl on mobile, text-3xl on desktop. */}
      <h2 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8 border-b border-purple-600 pb-3">
        Upload Product
      </h2>

      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      {success && <p className="text-green-400 text-center mb-4">{success}</p>}

      {role !== "admin" && (
        <p className="text-yellow-400 mb-4 text-center">
          You are not an admin. Only admins can upload products.
        </p>
      )}

      {/* The actual form container. space-y-6 adds vertical gaps between every block. */}
      <form onSubmit={onSubmit} className="space-y-6 md:space-y-8">
        
        {/* If they aren't an admin, disable every single input inside this fieldset simultaneously. */}
        <fieldset disabled={role !== "admin"}>
          
          {/* TITLE & DESCRIPTION */}
          {/* flex-col stacks them on mobile. md:flex-row places them side-by-side on desktop. */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            
            {/* Title takes 1 unit of space */}
            <div className="flex-1 relative group">
              <label htmlFor="title" className="block mb-2 font-semibold text-sm md:text-base">
                Product Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="Ex: Galactic Sword"
                className="w-full bg-transparent border border-purple-600 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
              />
            </div>

            {/* Description takes 2 units of space (so it's wider on desktop) */}
            <div className="flex-[2] relative group">
              <label htmlFor="description" className="block mb-2 font-semibold text-sm md:text-base">
                Product Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Ex: A legendary sword forged in a dying star..."
                className="w-full bg-transparent border border-purple-600 rounded-lg px-4 py-3 resize-none text-white font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
              />
            </div>
          </div>

          {/* PRICE */}
          <div className="relative group max-w-full md:max-w-xs mt-6">
            <label htmlFor="price" className="block mb-2 font-semibold text-sm md:text-base">
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
              className="w-full bg-transparent border border-purple-600 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
            />
          </div>

          {/* THUMBNAIL DROP ZONE */}
          <div className="mt-6">
            <label className="block mb-3 font-semibold text-sm md:text-base">
              Upload Thumbnail (drag & drop or click)
            </label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileUrlRef.current?.click()} // When clicked, secretly click the hidden input file element
              // Responsive height: h-32 on mobile, h-40 on desktop
              className={`relative border-4 border-dashed rounded-2xl cursor-pointer flex items-center justify-center h-32 md:h-40 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 transition-all duration-300 ${
                thumbnailDragActive ? "border-orange-400 shadow-[0_0_20px_3px_rgba(249,115,22,0.8)]" : "border-purple-600"
              }`}
            >
              {thumbnail ? (
                // If a thumbnail exists, show a preview image.
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={URL.createObjectURL(thumbnail)} // Creates a temporary fake URL to preview the file
                    alt="Thumbnail"
                    className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop the click from also triggering the upload box underneath
                      setThumbnail(null); // Delete the image from memory
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm hover:bg-red-600 z-10"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="text-orange-400 font-semibold text-center text-sm md:text-base pointer-events-none px-4">
                  Drag & drop thumbnail or click
                </p>
              )}
              
              {/* This is the actual native HTML file input. It is hidden visually. */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileUrlRef}
                onChange={onThumbnailChange}
              />
            </div>
          </div>

          {/* ADDITIONAL IMAGES */}
          <div className="mt-6">
            <label htmlFor="images" className="block mb-3 font-semibold text-sm md:text-base">
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

                // CASE 1: Real files dropped from the computer
                if (files.length > 0 && files[0].type.startsWith("image/")) {
                  setImages((prev) => [...prev, ...files]);
                  return; 
                }

                // CASE 2: An image link dropped from a browser
                if (url && url.startsWith("http")) {
                  setImageUrls((prev) => [...prev, url]);
                }
              }}
              onClick={() => document.getElementById("imagesInput").click()}
              className="w-full rounded-md border border-purple-600 bg-transparent px-4 py-6 text-white font-medium text-center cursor-pointer hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
            >
              <p className="text-orange-400 font-semibold text-sm md:text-base">
                Drag & drop images (PC or internet) or click to upload
              </p>

              <input
                id="imagesInput"
                type="file"
                accept="image/*"
                multiple // Allows selecting more than one file at once
                className="hidden"
                onChange={(e) =>
                  setImages((prev) => [...prev, ...Array.from(e.target.files)])
                }
              />
            </div>

            {/* PREVIEW TRAY FOR ADDITIONAL IMAGES */}
            {(images.length > 0 || imageUrls.length > 0) && (
              <div className="flex flex-wrap gap-4 mt-4">
                
                {/* Loop through PC Images and draw a preview box for each */}
                {images.map((img, idx) => (
                  <div key={`file-${idx}`} className="relative w-20 h-20 md:w-24 md:h-24">
                    <img
                      src={URL.createObjectURL(img)}
                      className="w-full h-full object-cover rounded-md border border-purple-500/30"
                    />
                    <button
                      type="button"
                      // Delete this specific image by filtering it out of the array
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Loop through URL Images and draw a preview box for each */}
                {imageUrls.map((url, idx) => (
                  <div key={`url-${idx}`} className="relative w-20 h-20 md:w-24 md:h-24">
                    <img
                      src={url}
                      className="w-full h-full object-cover rounded-md border border-purple-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VIDEO URL */}
          <div className="mt-6">
            <label htmlFor="videoUrl" className="block mb-2 font-semibold text-sm md:text-base">
              Video URL (optional)
            </label>
            <input
              id="videoUrl"
              name="videoUrl"
              type="url"
              placeholder="https://youtube.com/..."
              className="w-full rounded-md border border-purple-600 bg-transparent px-4 py-3 text-white font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
            />
          </div>

          {/* FILE DOWNLOAD URL */}
          <div className="mt-6">
            <label htmlFor="fileUrl" className="block mb-2 font-semibold text-sm md:text-base">
              File URL (compulsory)
            </label>
            <input
              id="fileUrl"
              name="fileUrl"
              type="url"
              required
              placeholder="https://example.com/download-file"
              className="w-full rounded-md border border-purple-600 bg-transparent px-4 py-3 text-white font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-shadow duration-300"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting} // Prevents double-clicking while it talks to the server
            className="w-full py-4 mt-8 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 rounded-xl font-extrabold text-black text-lg md:text-xl tracking-wide hover:scale-[1.02] active:scale-[0.95] transform transition-all duration-200 ease-in-out cursor-pointer shadow-lg shadow-orange-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Uploading..." : "Upload Product"}
          </button>
        </fieldset>
      </form>
    </section>
  );
};

export default UploadForm;