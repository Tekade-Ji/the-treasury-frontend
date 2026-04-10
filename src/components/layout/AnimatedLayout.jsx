import { useLocation, Outlet } from "react-router-dom";
import { useMemo } from "react";
import AnimatedBackground from "./WelcomeBg";
import ProfessionalBg from "./ProfessionalBg";
import MouseGlow from "../common/MouseGlow"; // ✅ import the glow component
import LenisProvider from "../common/Lenis";

export default function AnimatedLayout() {
  const location = useLocation();

  // Pages where hero is shown
  const showHero =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";

  // Force ProfessionalBg for specific routes
  const forceProfessional =
    location.pathname.startsWith("/product"); // adjust if needed

  // Random choice (runs once per mount)
  const useAnimated = useMemo(() => Math.random() > 0.5, []);

  // Decide layout
  const ContentWrapper = forceProfessional
    ? ProfessionalBg
    : useAnimated
    ? AnimatedBackground
    : ProfessionalBg;

  return (
    <LenisProvider>
    <ContentWrapper showHero={showHero}>
      {/* Add MouseGlow globally */}
      <MouseGlow />
      <Outlet />
    </ContentWrapper>
    </LenisProvider>
  );
}