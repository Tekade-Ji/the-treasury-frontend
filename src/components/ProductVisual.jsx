import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { Navigation, Pagination, Autoplay } from "swiper/modules";

const ProductVisual = ({ product }) => {
  const swiperRef = useRef(null);
  const containerRef = useRef(null);

  const [slides, setSlides] = useState([]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showVideo, setShowVideo] = useState(false);

  // 🧠 Build slides (ONLY IMAGES NOW)
  useEffect(() => {
    let arr = [];

    if (product?.thumbnail) {
      arr.push({ type: "image", src: formatSrc(product.thumbnail) });
    }

    if (product?.images?.length) {
      product.images.forEach((img) => {
        arr.push({ type: "image", src: formatSrc(img) });
      });
    }

    if (arr.length === 0) {
      arr.push({ type: "image", src: "/placeholder.png" });
    }

    arr = arr.sort(() => Math.random() - 0.5);
    setSlides(arr);
  }, [product]);

  const formatSrc = (src) => {
    if (!src) return "/placeholder.png";
    if (src.startsWith("http")) return src;

    const clean = src.replace(/^uploads[\\/]/, "").replace(/\\/g, "/");
    return `${import.meta.env.VITE_API_URL}/uploads/${clean}`;
  };

  // 🎯 Extract YouTube ID
  const extractYouTubeId = (url) => {
    if (!url) return "";

    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].split("?")[0];
    }

    if (url.includes("youtube.com/watch")) {
      return url.split("v=")[1].split("&")[0];
    }

    if (url.includes("youtube.com/shorts/")) {
      return url.split("shorts/")[1].split("?")[0];
    }

    return "";
  };

  // 🎥 Handle toggle
  const handleToggle = () => {
    setShowVideo((prev) => {
      const next = !prev;

      const swiper = swiperRef.current;

      if (swiper && swiper.autoplay) {
        if (next) {
          swiper.autoplay.stop(); // stop when video opens
        } else {
          swiper.autoplay.start(); // resume when back
        }
      }

      return next;
    });
  };

  // 🖱️ Tilt effect
  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: y * 10,
      y: x * -10,
    });
  };

  return (
    <>
      {/* 🔥 LOCAL CSS (INLINE) */}
      <style>
        {`
        @keyframes borderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .cyber-border {
          position: absolute;
          inset: -2px;
          border-radius: 24px;
          overflow: hidden;
          z-index: 0;
        }

        .cyber-border::before {
          content: "";
          position: absolute;
          inset: 0;
          background: conic-gradient(
            from 0deg,
            #00ffff,
            #ff00ff,
            #00ffff,
            #ff00ff,
            #00ffff
          );
          animation: borderSpin 4s linear infinite;
          filter: blur(6px);
          opacity: 0.9;
        }

        .cyber-border::after {
          content: "";
          position: absolute;
          inset: 2px;
          background: rgba(0,0,0,0.9);
          border-radius: 22px;
        }
        `}
      </style>

      <div className="w-full flex justify-center items-center py-16">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          className="w-[92%] max-w-6xl h-[460px] relative group transition-all duration-500"
          style={{
            transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <div className="cyber-border" />

          <div className="absolute inset-0 rounded-3xl shadow-[0_0_50px_rgba(0,255,255,0.3)] group-hover:shadow-[0_0_120px_rgba(255,0,255,0.6)] transition-all duration-700 -z-10" />

          {/* 🔥 TOGGLE BUTTON */}
          {product?.videoUrl && (
            <button
              onClick={handleToggle}
              className=" cursor-pointer absolute bottom-4 left-4 z-50 px-5 py-2 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-white hover:text-black transition-all duration-300"
            >
              {showVideo ? "Watch Images" : "Play Trailer"}
            </button>
          )}

          {/* 🎥 VIDEO MODE */}
          {showVideo && product?.videoUrl ? (
            <div className="absolute inset-0 z-40 rounded-3xl overflow-hidden bg-black">
              <iframe
                key={product.videoUrl}
                src={`https://www.youtube.com/embed/${extractYouTubeId(
                  product.videoUrl,
                )}?autoplay=1&mute=1&rel=0&playsinline=1&origin=${window.location.origin}`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            /* 🖼️ IMAGE SLIDER */
            <Swiper
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              slidesPerView={1}
              spaceBetween={30}
              centeredSlides={true}
              loop={slides.length > 1}
              speed={1000}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }}
              navigation={true}
              modules={[Autoplay, Pagination, Navigation]}
              className="rounded-3xl overflow-hidden h-full relative z-30"
            >
              {slides.map((slide, index) => (
                <SwiperSlide key={index}>
                  <div className="w-full h-full relative overflow-hidden">
                    <img
                      src={slide.src}
                      className="w-full h-full object-cover transition-all duration-[1200ms] scale-105 group-hover:scale-100"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-30 transition duration-500"
                      style={{
                        background:
                          "radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(0,255,255,0.3), transparent 40%)",
                      }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductVisual;
