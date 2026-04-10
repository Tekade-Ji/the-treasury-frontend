import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Import required modules
import { Autoplay, Pagination, Navigation } from "swiper/modules";

const SwiperHome = () => {
  const [products, setProducts] = useState([]);

  // 🔀 Shuffle function to shuffle an array of images
  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetchWithRetry(() => API.get("/api/products"));
        const shuffled = shuffleArray(res.data.data); // Shuffle the entire product list
        setProducts(shuffled);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  // Function to get image source (including thumbnails)
const getImageSrc = (thumbnail, images = []) => {
  const allImages = [thumbnail, ...images];
  const imageSrc = shuffleArray(allImages);
  const firstImage = imageSrc[0];

  if (!firstImage) return "/placeholder.png";

  return firstImage; // ✅ Cloudinary URL OR existing URL
};

  const navigate = useNavigate();

  return (
    <div className="w-full p-16 flex items-center justify-center">
      <div className="h-125 w-400 rounded-4xl">
        <Swiper
          slidesPerView={1}
          spaceBetween={30}
          centeredSlides={true}
          loop={products.length > 1} // Fix loop warning
          speed={800}
          watchOverflow={false}
          observer={true}
          observeParents={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[Autoplay, Pagination, Navigation]}
          className="mySwiper rounded-4xl select-none"
        >
          {products.map((product) => {
            const image = getImageSrc(product.thumbnail, product.images);

            return (
              <SwiperSlide key={product._id} onClick={() => navigate(`/product/${product._id}`)}>
                <img src={image} alt={product.title} />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
};

export default SwiperHome;