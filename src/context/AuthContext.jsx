import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ central loading

  // Fetch user details from token
  const fetchUserDetails = async (token) => {
    if (!token) {
      setUser(null);
      return setLoading(false);
    }

    try {
      const res = await API.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Extract the actual user object from res.data.data
      const userData = res.data.data;

      setUser({ ...userData, token }); // role, coins, etc. are now directly accessible
    } catch (err) {
      console.error("Failed to fetch user details", err.response || err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On app load, check if token exists in storage
  useEffect(() => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    fetchUserDetails(token);
  }, []);

  // Login function
  const login = async (token, rememberMe) => {
    if (rememberMe) localStorage.setItem("authToken", token);
    else sessionStorage.setItem("authToken", token);

    await fetchUserDetails(token); // fetch user after login
  };

  const updateCoins = (newCoins) => {
    setUser((prev) => ({
      ...prev,
      coins: newCoins,
    }));
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        logout,
        role: user?.role,
        coins: user?.coins,
        updateCoins,
        purchasedProducts: user?.ownedProducts || [],
        loading, // expose central loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
