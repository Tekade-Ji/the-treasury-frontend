import Navbar from "./components/Navbar/Navbar";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import AnimatedLayout from "./components/layout/AnimatedLayout";
import { Routes, Route, Outlet } from "react-router-dom"; // Import Outlet
import LoginCard from "./components/Login&Register/LoginCard";
import RegisterCard from "./components/Login&Register/RegisterCard";
import ProductDetailsPage from "./Pages/ProductDetailsPage";
import ForgotPassword from "./components/Login&Register/ForgotPassword";
import ResetPassword from "./components/Login&Register/ResetPassword";
import Cyberpunk404 from "./components/common/Cyberpunk404"; 
import About from "./components/Home/About";
import Codex from "./components/Home/Codex";

// 1. Create a wrapper for your normal pages
const MainAppLayout = () => {
  return (
    <div className="relative isolate">
      <Navbar />
      <div className="relative z-0">
        <Outlet /> {/* Renders the nested routes below */}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* 2. Group all standard routes inside the MainAppLayout and AnimatedLayout */}
      <Route element={<MainAppLayout />}>
        <Route element={<AnimatedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginCard />} />
          <Route path="/register" element={<RegisterCard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About/>} />
          <Route path="/codex" element={<Codex/>} />
        </Route>
      </Route>

      {/* 3. The Trap: Completely isolated, no Navbar, no Animations */}
      <Route path="*" element={<Cyberpunk404 />} />
    </Routes>
  );
};

export default App;