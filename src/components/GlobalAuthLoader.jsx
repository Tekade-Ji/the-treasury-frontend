// src/components/common/GlobalAuthLoader.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";

const GlobalAuthLoader = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Loading authentication...</p>
      </div>
    );
  }

  return <>{children}</>; // render app once auth is ready
};

export default GlobalAuthLoader;