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
    <div className="min-h-screen pt-[80px] flex flex-col bg-[#f9f9f7] text-[#1a1c1b] font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent pointer-events-none"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -right-40 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <main className="flex-grow flex items-center justify-center p-4 relative z-10 pb-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white w-full overflow-hidden max-w-[520px] relative">
          <div className="p-8 md:p-10 flex flex-col gap-6 relative z-10">
            
            <div className="text-center mb-2">
              <h1 className="text-3xl font-heading font-black tracking-tight text-[#1a1c1b] uppercase">
                Tạo tài khoản mới
              </h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">
                Nhập thông tin chi tiết của bạn để bắt đầu
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest mb-2">Tên hiển thị</label>
                <div className="relative flex items-center group">
                  <span className="absolute left-4 text-gray-400 flex items-center group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">badge</span>
                  </span>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white hover:bg-white transition-all text-sm font-medium" 
                    placeholder="Nhập tên hiển thị của bạn" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest mb-2">Email</label>
                <div className="relative flex items-center group">
                  <span className="absolute left-4 text-gray-400 flex items-center group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white hover:bg-white transition-all text-sm font-medium" 
                    placeholder="vidu@email.com" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest mb-2">Mật khẩu</label>
                <div className="relative flex items-center group">
                  <span className="absolute left-4 text-gray-400 flex items-center group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white hover:bg-white transition-all text-sm font-medium [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                    placeholder="Nhập mật khẩu" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary transition-colors flex items-center justify-center focus:outline-none rounded-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest mb-2">Xác nhận mật khẩu</label>
                <div className="relative flex items-center group">
                  <span className="absolute left-4 text-gray-400 flex items-center group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">verified_user</span>
                  </span>
                  <input 
                    type={showConfirm ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white hover:bg-white transition-all text-sm font-medium [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                    placeholder="Nhập lại mật khẩu" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary transition-colors flex items-center justify-center focus:outline-none rounded-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showConfirm ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      className="peer hidden" 
                      required
                    />
                    <div className="w-5 h-5 rounded border-2 border-gray-200 peer-checked:border-primary peer-checked:bg-primary transition-colors flex items-center justify-center group-hover:border-primary/50 shrink-0">
                      <span className="material-symbols-outlined text-white text-[14px] opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors leading-relaxed">
                    Tôi đồng ý với{' '}
                    <Link to="/terms" className="text-primary hover:text-primary-hover font-bold no-underline hover:underline transition-colors">Điều khoản dịch vụ</Link>
                    {' '}và{' '}
                    <Link to="/privacy" className="text-primary hover:text-primary-hover font-bold no-underline hover:underline transition-colors">Chính sách bảo mật</Link>
                  </span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-heading font-bold uppercase tracking-widest text-[13px] py-4 mt-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg flex justify-center items-center gap-2 relative overflow-hidden group/btn"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                ) : (
                  <>
                    <span>Đăng ký tài khoản</span>
                    <span className="material-symbols-outlined text-xl transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                  </>
                )}
              </button>

            </form>
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
            <p className="text-gray-500 font-medium text-sm m-0">
              Bạn đã có tài khoản?
              <Link to="/login" className="text-primary hover:text-primary-hover font-heading font-black uppercase tracking-wider no-underline hover:underline ml-1">
                Đăng nhập ngay
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
