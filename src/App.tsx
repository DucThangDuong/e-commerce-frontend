import "./App.css";
import ProductPage from "./pages/HomePage";
import CreateProductPage from "./pages/CreateProductPage";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { isLoggedIn } from "./untils/auth";
import { useStore } from "./zustand/store";
import { useEffect, useState } from "react";
import { apiClient } from "./untils/apiClient";
import type { UserProfilePrivate } from "./interfaces/customer";
import ShoppingCartPage from "./pages/ShoppingCartPage";
const ProtectedRoute = () => {
  const isAuth = isLoggedIn();
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};
const GuestRoute = () => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
function App() {
  const { setUser, setIsLogin } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);
  useEffect(() => {
    const initApp = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const userData: UserProfilePrivate =
            await apiClient.get("/customer/profile");
          setUser(userData);
          setIsLogin(true);
        } else {
          const data: { accessToken: string } =
            await apiClient.post("/refresh-token");

          localStorage.setItem("accessToken", data.accessToken);
          const userData: UserProfilePrivate =
            await apiClient.get("/customer/profile");
          setUser(userData);
          setIsLogin(true);
        }
      } catch {
        setUser(null);
        setIsLogin(false);
        localStorage.removeItem("accessToken");
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, [setUser, setIsLogin]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductPage />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<ShoppingCartPage />} />
          <Route path="/create-product" element={<CreateProductPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
