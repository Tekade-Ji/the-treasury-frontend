import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const LoginCard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, loading } = useAuth(); // ✅ use global auth loading

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    const isEmail = formData.identifier.includes("@");
    const payload = {
      password: formData.password,
      rememberMe: formData.rememberMe,
      ...(isEmail
        ? { email: formData.identifier }
        : { name: formData.identifier }),
    };

    try {
      const response = await API.post("api/auth/login", payload);
      const token = response.data.token;

      // console.log("Login token received:", token);

      await login(token, formData.rememberMe); // ✅ login via context

      // 🔥 redirect logic
      const from = location.state?.from;
      if (!from || from === "/register" || from === "/login") navigate("/");
      else navigate(from);
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.message || "Invalid credentials. Try again.",
        success: false,
      });
    }
  };

  // Show loading screen if global auth is still fetching
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="h-auto  flex justify-center p-6">
      <div className="w-full max-w-md bg-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.6)] text-white">
        <h2 className="text-3xl font-bold mb-6 text-center tracking-wide">
          Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">Name or Email</label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="Enter name or email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              id="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm cursor-pointer">
              Remember me
            </label>
          </div>

          {status.error && (
            <p className="text-red-300 text-sm bg-red-900/30 p-2 rounded-lg">
              {status.error}
            </p>
          )}

          <button
            type="submit"
            disabled={status.loading}
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 py-3 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
          >
            {status.loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-cyan-400 hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/80">
          Don't have an account?{" "}
          <Link
            to="/register"
            state={{ from: location.state?.from || "/" }}
            className="text-cyan-400 hover:underline"
          >
            Sign up instead
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginCard;
