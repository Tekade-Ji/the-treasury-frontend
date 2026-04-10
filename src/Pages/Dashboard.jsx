import { useAuth } from "../context/AuthContext";
import UploadForm from "../components/Dashboard/UploadForm";
import UpdateProducts from "../components/Dashboard/UpdateProducts";
import Coupons from "../components/Dashboard/Coupons";
import RedeemCoupon from "../components/Dashboard/RedeemCoupons";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OwnedProducts from "../components/Dashboard/OwnedProduct";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading } = useAuth();

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, loading, navigate]);

  // ✅ Scroll to redeem section if hash exists
  useEffect(() => {
  if (!loading && window.location.hash === "#redeem") {
    const el = document.getElementById("redeem");
    if (el) {
      const navbarOffset = 80; // adjust if your navbar height is different

      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }
}, [loading]);

  // ✅ Show loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Loading user data...</p>
      </div>
    );
  }

  // ✅ Stop rendering if redirecting
  if (!isLoggedIn) return null;

  const isAdmin = user?.role === "admin";

  return (
    <main className="pt-20 text-white font-sans select-none">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-center drop-shadow-lg tracking-wide">
        Welcome{" "}
        <span className="text-[#f97316] hover:text-[#ea580c] transition-colors duration-500">
          {user?.name}
        </span>
        !
      </h1>

      {/* ✅ Admin only */}
      {isAdmin && (
        <>
          <UploadForm />
          <UpdateProducts />
          <Coupons />
          
        </>
      )}

      {/* ✅ Everyone */}
      <div id="redeem">
        <RedeemCoupon />
        <OwnedProducts/>
      </div>
       
    </main>
  );
}