import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios'; // ✅ your configured axios instance

const RegisterCard = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    try {
      const response = await API.post('api/auth/register', formData);

      console.log('User registered:', response.data);

      // 🔥 Instant redirect
      navigate('/login');

    } catch (err) {
      setStatus({
        loading: false,
        error:
          err.response?.data?.message ||
          'Something went wrong. Try again.',
        success: false,
      });
    }
  };

  return (
    <div className="h-auto flex items-center justify-center pb-6 px-6">
      <div className="w-full max-w-md bg-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.6)] text-white">

        <h2 className="text-3xl font-bold mb-6 text-center tracking-wide">
          Join Us
        </h2>

        <form onSubmit={handleRegister} className="space-y-5">

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Enter your name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="••••••••"
            />
          </div>

          {/* Error */}
          {status.error && (
            <p className="text-red-300 text-sm bg-red-900/30 p-2 rounded-lg">
              {status.error}
            </p>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={status.loading}
            className="cursor-pointer w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50"
          >
            {status.loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        {/* Redirect link */}
        <p className="mt-6 text-center text-sm text-white/80">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterCard;