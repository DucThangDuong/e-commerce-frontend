import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import LoginLayout from "../layouts/HomeLayout";
import { apiClient } from "../untils/apiClient";
import { InputField } from "../component/home/InputField";
import { useStore } from "../zustand/store";
import type { UserLogin, UserProfilePrivate } from "../interfaces/customer";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setIsLogin } = useStore();

  const handleGoogleExample = async (credential: string) => {
    try {
      setIsLoading(true);
      const data = await apiClient.post<{ accessToken: string }>(
        `/google`,
        {
          IdToken: credential,
        },
      );
      localStorage.setItem("accessToken", data.accessToken);
      const userData = await apiClient.get<UserProfilePrivate>("/customer/profile");
      setUser(userData);
      setIsLogin(true);
    } catch {
      setError("Đăng nhập bằng Google thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const userlogin: UserLogin = { email, password };
    try {
      const data = await apiClient.post<{ accessToken: string }>(
        `/login`,
        userlogin
      );
      localStorage.setItem("accessToken", data.accessToken);
      const userData = await apiClient.get<UserProfilePrivate>("/customer/profile");
      setUser(userData);
      setIsLogin(true);
    } catch {
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginLayout>
      <div className=" flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-[480px] bg-white rounded-xl shadow-lg border border-[#e5e7eb] overflow-hidden">
          <div className="p-8 md:p-10 flex flex-col gap-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-[#111318] text-[32px] font-bold tracking-tight">
                Chào mừng trở lại
              </h1>
              <p className="text-gray-500">
                Vui lòng nhập thông tin đăng nhập của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      handleGoogleExample(credentialResponse.credential);
                    }
                  }}
                  onError={() => {
                    setError("Đăng nhập bằng Google thất bại.");
                  }}
                  size="large"
                  width="400"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <div className="relative flex items-center gap-2 py-2">
              <div className="h-px flex-1 bg-[#e5e7eb]"></div>
              <span className="text-xs font-medium text-gray-400 uppercase">
                Hoặc
              </span>
              <div className="h-px flex-1 bg-[#e5e7eb]"></div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <InputField
                label="Email"
                icon="mail"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <InputField
                label="Mật khẩu"
                icon="lock"
                isPassword={true}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="form-checkbox w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-[#111318] group-hover:text-primary transition-colors">
                    Nhớ tôi
                  </span>
                </label>
                <Link
                  className="text-sm font-medium text-primary hover:underline"
                  to="/forgot-password"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                disabled={isLoading}
                className={`flex w-full items-center justify-center rounded-lg h-12 px-4 text-white text-base font-bold transition-all shadow-md mt-2 
                ${isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-blue-700 hover:shadow-lg"
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>
          </div>

          <div className="p-4 bg-gray-50 border-t border-[#e5e7eb] text-center">
            <p className="text-sm text-gray-500">
              Chưa có tài khoản?{" "}
              <Link
                className="text-primary hover:underline font-bold"
                to="/register"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </LoginLayout>
  );
};

export default LoginPage;
