import React, { useEffect, useState } from "react";
// Think of imports like grabbing tools from a toolbox. 
// We are grabbing 'API' to talk to your database, and 'useNavigate' to move between pages.
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";

// Import the core building blocks for the Swiper carousel
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper's pre-written CSS styles so it actually looks like a slider and not plain text
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Import the specific 'addons' we want our Swiper to use
import { Autoplay, Pagination, Navigation } from "swiper/modules";

const SwiperHome = () => {
  // useState is your component's short-term memory. 
  // 'products' is the memory holding the data. 'setProducts' is the function we use to update that memory.
  // We start it off as an empty array: []
  const [products, setProducts] = useState([]);

  // 🔀 A helper function. It takes a list (array) of items and shuffles them into a random order.
  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  // 🔄 This is a persistent fetching function. 
  // It tries to get data. If the server throws an error, it complains in the console, 
  // waits exactly 1.5 seconds, and loops back to try again. It does this until it succeeds.
  const fetchWithRetry = async (fn) => {
  while (true) {
    try {
      const res = await fn(); // Attempt the API call
      return res; // If successful, hand the data back
    } catch (err) {
      console.log("Retrying..."); 
      await new Promise((res) => setTimeout(res, 1500)); // Wait 1.5 seconds before trying again
    }
  }
};

  // useEffect is a gatekeeper. The empty bracket [] at the end means:
  // "Only run this block of code EXACTLY ONCE when the component first loads on the screen."
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Go fetch the products from the API using our stubborn retry function
        const res = await fetchWithRetry(() => API.get("/api/products"));
        // Shuffle the list of products so the user sees a different order every time
        const shuffled = shuffleArray(res.data.data); 
        // Save the shuffled list into our component's 'products' memory
        setProducts(shuffled);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts(); // Actually trigger the function we just defined above
  }, []); // <-- This empty array is what stops it from running in an infinite loop

  // 🖼️ A function to determine which image to show on the slide.
  // It groups the thumbnail and any extra images, shuffles them, and picks the first one.
  const getImageSrc = (thumbnail, images = []) => {
    const allImages = [thumbnail, ...images];
    const imageSrc = shuffleArray(allImages);
    const firstImage = imageSrc[0];

    // If the product has absolutely no images, use a placeholder so the UI doesn't crash
    if (!firstImage) return "/placeholder.png";

    return firstImage; 
  };

  // Grab the steering wheel to change URLs programmatically
  const navigate = useNavigate();

  // Everything inside 'return' is the actual HTML (JSX) drawn on the screen.
  return (
    // RESPONSIVE FIX 1: Padding.
    // p-4 on mobile, md:p-8 on tablets, and your original p-16 strictly on large screens.
    <div className="w-full p-4 md:p-8 lg:p-16 flex items-center justify-center">
      
      {/* RESPONSIVE FIX 2: Width and Height.
        Mobile/Tablet: Takes full width (w-full) and scales height gracefully (h-64 to h-96).
        Desktop (Your 1080p screen): Kicks in 'lg:w-400' and 'lg:h-125' to perfectly match your original layout.
      */}
      <div className="w-full h-64 sm:h-80 md:h-96 lg:h-125 lg:w-400 rounded-2xl lg:rounded-4xl overflow-hidden">
        <Swiper
          slidesPerView={1} // Show exactly 1 slide at a time
          spaceBetween={30} // Put 30 pixels of space between slides
          centeredSlides={true} // Make sure the active slide is dead center
          loop={products.length > 1} // Make it loop infinitely (only if we have more than 1 item)
          speed={800} // How fast the slide transitions (0.8 seconds)
          watchOverflow={false} 
          observer={true} // Tells Swiper to recalculate if the container changes size
          observeParents={true} 
          autoplay={{
            delay: 2500, // Wait 2.5 seconds before moving to the next slide automatically
            disableOnInteraction: false, // Keep autoplaying even if the user clicks or swipes
            pauseOnMouseEnter: false, // Don't stop autoplaying if the mouse hovers over it
          }}
          pagination={{ clickable: true }} // Allow users to click the navigation dots at the bottom
          navigation={true} // Turn on the Left/Right arrows
          modules={[Autoplay, Pagination, Navigation]} // Plug in the addons we imported at the top
          className="mySwiper rounded-2xl lg:rounded-4xl select-none w-full h-full"
        >
          {/* Take our memory array ('products') and map over it. 
            For every single product inside, generate a <SwiperSlide>.
          */}
          {products.map((product) => {
            // Figure out which image to show for this specific product
            const image = getImageSrc(product.thumbnail, product.images);

            return (
              // When the user clicks this slide, steer them to /product/ID
              <SwiperSlide 
                key={product._id} 
                onClick={() => navigate(`/product/${product._id}`)}
                className="cursor-pointer" // Changes the mouse to a pointing hand
              >
                {/* RESPONSIVE FIX 3: Image scaling. 
                  w-full h-full object-cover forces the image to perfectly fill the Swiper box 
                  without stretching, warping, or bleeding out of the container on smaller phones.
                */}
                <img 
                  src={image} 
                  alt={product.title} 
                  className="w-full h-full object-cover rounded-2xl lg:rounded-4xl"
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
};

export default SwiperHome;