import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NavLastBtn = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const text = "LOGIN";

  return (
    <>
      {isLoggedIn ? (
        <div className="flex gap-4 cursor-pointer">
          
          {/* Profile */}
          <div
            className="navprofile"
            onClick={() => navigate("/dashboard")}
          >
            <img className="h-10" src="/icons/profile.svg" alt="" />
          </div>

          <div className="h-10 w-1 bg-white rounded-full"></div>

          {/* Logout */}
          <div
            className="navprofile"
            onClick={() => {
              logout();        // 🔥 clears token + updates UI
              navigate("/");   // redirect
            }}
          >
            <img className="h-10" src="/icons/logout.svg" alt="" />
          </div>
        </div>
      ) : (
        <div
          className="font-bold text-2xl text cursor-pointer "
          onClick={() => navigate("/login")}
        >
          <h3>
            {text.split("").map((letter, i) => (
              <span key={i} style={{ "--i": i }}>
                {letter}
              </span>
            ))}
          </h3>
        </div>
      )}
    </>
  );
};

export default NavLastBtn;