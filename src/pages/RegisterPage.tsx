import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegisterLayout from "../layouts/HomeLayout";
import { apiClient, ApiError } from "../untils/apiClient";
import { InputField } from "../component/home/InputField";
import type { UserRegister } from "../interfaces/customer";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null | React.ReactNode>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setIsLoading(true);
    const userregister: UserRegister = {
      fullname: displayName,
      email: email,
      password: password,
    };
    try {
      await apiClient.postnodata("/register", userregister);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const status = err.status;
        const message = err.message || "Lỗi xảy ra";
        switch (status) {
          case 409:
            setError(
              <span>
                Email này đã được đăng ký. Bạn có muốn{" "}
                <Link
                  to="/login"
                  className="text-primary font-bold underline hover:text-primary/80 transition-colors"
                >
                  đăng nhập
                </Link>{" "}
                không?
              </span>,
            );
            break;
          case 400:
            setError(message);
            break;
          case 500:
            setError("Hệ thống đang bảo trì. Vui lòng thử lại sau.");
            break;
          case 404:
            setError("Không tìm thấy đường dẫn yêu cầu.");
            break;
          default:
            setError("Lỗi không xác định: " + err.message);
        }
      } else {
        setError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <RegisterLayout>
        <div className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-[520px] bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl text-green-600">
                check_circle
              </span>
            </div>
            <h1 className="text-[#111318] text-2xl font-black tracking-tight mb-3">
              Đăng ký thành công!
            </h1>
            <p className="text-[#616f89] text-base mb-8">
              Tài khoản của bạn đã được khởi tạo. Vui lòng đăng nhập để bắt đầu sử
              dụng dịch vụ.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full h-12 bg-primary text-white text-base font-bold rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Đến trang đăng nhập</span>
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </RegisterLayout>
    );
  }

  return (
    <RegisterLayout>
      <div className="flex-1 flex items-center justify-center p-4 py-12">

        <div className="w-full max-w-[520px] bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-6 md:p-8">
          {/* Heading */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-[#111318] text-3xl font-black tracking-tight mb-2">
              Tạo tài khoản mới
            </h1>
            <p className="text-[#616f89] text-base">
              Nhập thông tin chi tiết của bạn để bắt đầu
            </p>
          </div>

          {/* Hiển thị lỗi nếu có */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputField
              label="Tên hiển thị"
              placeholder="Nhập tên hiển thị của bạn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <InputField
              label="Email"
              placeholder="vidu@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <InputField
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              isPassword={true}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <InputField
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              isPassword={true}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 mt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>
              <label
                htmlFor="terms"
                className="text-sm text-[#616f89] cursor-pointer select-none"
              >
                Tôi đồng ý với{" "}
                <a href="#" className="text-primary hover:underline font-medium">
                  Điều khoản dịch vụ
                </a>{" "}
                và{" "}
                <a href="#" className="text-primary hover:underline font-medium">
                  Chính sách bảo mật
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`mt-4 w-full h-12 text-white text-base font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2
              ${isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-blue-700 hover:shadow-lg"
                }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Đăng ký</span>
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#616f89]">
              Bạn đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-primary font-bold hover:underline ml-1"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </RegisterLayout >
  );
};

export default RegisterPage;
