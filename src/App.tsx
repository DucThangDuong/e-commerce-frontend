import "./App.css";
import ProductPage from "./pages/FilterPage";
import LandingPage from "./pages/HomePage";
import CreateProductPage from "./pages/CreateProductPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import UserProfilePage from "./pages/UserProfilePage";
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
import { useEffect } from "react";
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

const GlobalNotification = () => {
  const notification = useStore((state) => state.notification);
  if (!notification) return null;

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-300 ease-out
         flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-black/80 text-white shadow-2xl backdrop-blur-md
          pointer-events-none text-center min-w-[200px] ${
            notification.visible
              ? "opacity-100 scale-100"
              : "opacity-0 scale-90"
          }`}
    >
      <span
        className={`material-symbols-outlined text-4xl ${notification.type === "error" ? "text-red-400" : "text-green-400"}`}
      >
        {notification.type === "error" ? "error" : "check_circle"}
      </span>
      <p className="font-bold text-lg">{notification.message}</p>
    </div>
  );
};

function App() {
  const { setUser, setIsLogin } = useStore();
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
      }
    };

    initApp();
  }, [setUser, setIsLogin]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/categories" element={<ProductPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<ShoppingCartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/create-product" element={<CreateProductPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
        </Route>
      </Routes>
      <GlobalNotification />
    </BrowserRouter>
  );
}

export default App;
