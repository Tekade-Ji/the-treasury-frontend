import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../api/axios"; // ✅ your configured axios instance

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  const [password, setPassword] = useState("");

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus({ loading: true, error: null, success: false });

    try {
      const res = await API.post(`api/auth/reset-password?token=${token}`, { password });

      setStatus({
        loading: false,
        error: null,
        success: true,
      });

      // redirect after 2 sec
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.message || "Something went wrong",
        success: false,
      });
    }
  };

  return (
    <div className="h-auto flex justify-center p-6">
      <div className="w-full max-w-md bg-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.6)] text-white">

        <h2 className="text-3xl font-bold mb-6 text-center tracking-wide">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="Enter new password"
            />
          </div>

          {status.error && (
            <p className="text-red-300 text-sm bg-red-900/30 p-2 rounded-lg">
              {status.error}
            </p>
          )}

          {status.success && (
            <p className="text-green-300 text-sm bg-green-900/30 p-2 rounded-lg">
              Password reset successful ✅ Redirecting...
            </p>
          )}

          <button
            type="submit"
            disabled={status.loading}
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {status.loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ResetPassword;