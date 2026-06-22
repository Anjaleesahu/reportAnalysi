import { createContext, useState, useEffect, useContext } from "react";
import * as authApi from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token validity and load profile on start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const data = await authApi.getMe();
          setUser(data);
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      const { access_token } = data;
      localStorage.setItem("auth_token", access_token);

      const userData = await authApi.getMe();
      setUser(userData);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.detail || "Invalid email or password.";
      return { success: false, error: message };
    }
  };

  const register = async (email, password, fullName) => {
    setLoading(true);
    try {
      await authApi.register({
        email,
        password,
        full_name: fullName,
      });
      // Automatically log in after registration
      return await login(email, password);
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.detail || "Registration failed. Email might already exist.";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  // Merge updated profile fields into the cached user (after a profile edit).
  const updateUser = (fields) => {
    setUser((prev) => ({ ...prev, ...fields }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
