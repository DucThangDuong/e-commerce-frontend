import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import { useStore } from '../zustand/store';

const RegisterPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { showNotification } = useStore();

  const strongPwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!strongPwdRegex.test(password)) {
      setError('Mật khẩu phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ cái và 1 chữ số!');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu và Xác nhận mật khẩu không khớp!');
      return;
    }

    if (!terms) {
      setError('Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.postnodata('/register', { 
        fullname: displayName, 
        email, 
        password,
      });
      
      showNotification('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
      navigate('/login?registered=true');
    } catch (err: any) {
      console.error("Lỗi API Đăng ký:", err);
      
      if (err.message && err.message !== "Lỗi không xác định") {
        // Lấy trực tiếp message từ ApiError
        setError(err.message);
      } else if (err.data?.errors) {
        // Xử lý Validation errors từ C# 
        const errorMessages = Object.values(err.data.errors).flat().join(' ');
        setError(errorMessages);
      } else {
        setError(err.data?.title || 'Có lỗi xảy ra trong quá trình đăng ký!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-[56px] flex flex-col overflow-hidden bg-gray-50 text-gray-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex flex-grow overflow-hidden relative">
        <main className="flex-grow h-full overflow-y-auto p-4 scroll-smooth">
          <div className="container mx-auto flex items-center justify-center h-full py-12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full p-6 md:p-10 max-w-[520px]">
              
              <div className="mb-8 text-center md:text-left">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  Tạo tài khoản mới
                </h1>
                <p className="text-gray-500 text-[0.95rem] mb-0">
                  Nhập thông tin chi tiết của bạn để bắt đầu
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block font-medium text-[0.875rem] mb-1 text-gray-700">Tên hiển thị</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a63b00] focus:border-transparent transition-all" 
                    placeholder="Nhập tên hiển thị của bạn" 
                    required 
                  />
                </div>

                <div>
                  <label className="block font-medium text-[0.875rem] mb-1 text-gray-700">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a63b00] focus:border-transparent transition-all" 
                    placeholder="vidu@email.com" 
                    required 
                  />
                </div>

                <div>
                  <label className="block font-medium text-[0.875rem] mb-1 text-gray-700">Mật khẩu</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a63b00] focus:border-transparent transition-all" 
                      placeholder="Nhập mật khẩu" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 px-3 text-gray-500 hover:text-gray-700 flex items-center h-full focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-xl">{showPassword ? "visibility" : "visibility_off"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[0.875rem] mb-1 text-gray-700">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <input 
                      type={showConfirm ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a63b00] focus:border-transparent transition-all" 
                      placeholder="Nhập lại mật khẩu" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 px-3 text-gray-500 hover:text-gray-700 flex items-center h-full focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-xl">{showConfirm ? "visibility" : "visibility_off"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#a63b00] rounded border-gray-300 focus:ring-[#a63b00] cursor-pointer shrink-0" 
                    required 
                  />
                  <label htmlFor="terms" className="text-gray-500 select-none text-[0.875rem] cursor-pointer leading-tight">
                    Tôi đồng ý với{' '}
                    <Link to="/terms" className="text-[#a63b00] hover:text-[#8a3100] font-medium no-underline hover:underline">Điều khoản dịch vụ</Link>
                    {' '}và{' '}
                    <Link to="/privacy" className="text-[#a63b00] hover:text-[#8a3100] font-medium no-underline hover:underline">Chính sách bảo mật</Link>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[#a63b00] hover:bg-[#8a3100] text-white font-bold py-3 mt-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 h-12 disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>Đăng ký</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>

              </form>

              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-[0.875rem] mb-0">
                  Bạn đã có tài khoản?
                  <Link to="/login" className="text-[#a63b00] hover:text-[#8a3100] font-bold no-underline ml-1 hover:underline">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;
