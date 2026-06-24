import "./App.css";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FilterPage from "./pages/FilterPage";
import DetailPage from "./pages/DetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PurchasePage from "./pages/PurchasePage";
import MainLayout from "./layouts/MainLayout";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { isLoggedIn } from "./untils/auth";
import { useStore } from "./zustand/store";
import "./css/home-page.css";
import { useEffect } from "react";
import { apiClient, getCookie, setCookie, removeCookie } from "./untils/apiClient";
const ProtectedRoute = () => {
  const isAuth = isLoggedIn();
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};
const GuestRoute = () => {
  const token = getCookie("accessToken");
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
};

function App() {
  const { setUser, setIsLogin } = useStore();
  useEffect(() => {
    const initApp = async () => {
      try {
        const token = getCookie("accessToken");
        if (token) {
          const response: any = await apiClient.get("/customer/profile");
          const userData = response?.data ? response.data : response;
          setUser(userData);
          setIsLogin(true);
        } else {
          const refreshRes: any = await apiClient.post("/refresh-token");
          
          if (refreshRes?.success && refreshRes?.accessToken) {
            setCookie("accessToken", refreshRes.accessToken);
            const response: any = await apiClient.get("/customer/profile");
            const userData = response?.data ? response.data : response;
            setUser(userData);
            setIsLogin(true);
          } else {
            throw new Error("Refresh token expired or invalid");
          }
        }
      } catch {
        setUser(null);
        setIsLogin(false);
        removeCookie("accessToken");
      }
    };

    initApp();
  }, [setUser, setIsLogin]);
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<FilterPage />} />
          <Route path="/product/:id" element={<DetailPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/purchase" element={<PurchasePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
