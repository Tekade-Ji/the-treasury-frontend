import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../api/axios";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus({ loading: true, error: null, success: false });

    try {
      const res = await API.post("/api/auth/forgot-password", { email });

      setStatus({
        loading: false,
        error: null,
        success: true,
      });

    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.message || "Something went wrong",
        success: false,
      });
    }
  };

  return (
    <div className="h-full flex justify-center p-6">
      <div className="w-full max-w-md bg-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.6)] text-white">

        <h2 className="text-3xl font-bold mb-6 text-center tracking-wide">
          Forgot Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="Enter your email"
            />
          </div>

          {status.error && (
            <p className="text-red-300 text-sm bg-red-900/30 p-2 rounded-lg">
              {status.error}
            </p>
          )}

          {status.success && (
            <p className="text-green-300 text-sm bg-green-900/30 p-2 rounded-lg">
              Reset link sent to your email 📧
            </p>
          )}

          <button
            type="submit"
            disabled={status.loading}
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 py-3 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
          >
            {status.loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* 👇 back to login */}
        <p className="mt-6 text-center text-sm text-white/80">
          Remember your password?{" "}
          <span
            onClick={() =>
              navigate("/login", {
                state: { from: location.state?.from || "/" },
              })
            }
            className="text-cyan-400 hover:underline cursor-pointer"
          >
            Go back to login
          </span>
        </p>

      </div>
    </div>
  );
};

export default ForgotPassword;  