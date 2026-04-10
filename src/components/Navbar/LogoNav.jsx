import React from "react";
import { useNavigate } from "react-router-dom";

const LogoNav = () => {
  const navigate = useNavigate(); 
  
  const text = "THE TREASURY";

  return (
    <div className="text relative" onClick={() => navigate("/")}>
      <h3 className="font-bold text-2xl">
        {text.split("").map((letter, i) => (
          <span
            key={i}
            style={{ "--i": i }}
          >
            {/* 🔥 THE FIX: If it's a space, render a non-breaking space */}
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </h3>
    </div>
  );
};

export default LogoNav;