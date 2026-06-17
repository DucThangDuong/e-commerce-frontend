import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiClient, setCookie } from '../untils/apiClient';
import { useStore } from '../zustand/store';
import type { LoginResponse } from '../interfaces/auth';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const registered = searchParams.get('registered');
  const message = searchParams.get('message');
  const tokenFromUrl = searchParams.get('token') || searchParams.get('accessToken');
  
  const navigate = useNavigate();
  const { setIsLogin, setUser, showNotification } = useStore();

  const handleGoogleLogin = async (credential: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await apiClient.post<any>(
        `/google`,
        {
          IdToken: credential,
        }
      );
      
      let token = '';
      if (typeof response === 'string') token = response;
      else if (typeof response?.data === 'string') token = response.data;
      else if (typeof response?.accessToken === 'string') token = response.accessToken;
      else if (typeof response?.data?.accessToken === 'string') token = response.data.accessToken;
      
      if (token && typeof token === 'string') {
        setCookie("accessToken", token);
        const profileRes = await apiClient.get<ApiResponse<any>>("/customer/profile");
        if (profileRes && profileRes.data) {
          setUser(profileRes.data);
        }
        setIsLogin(true);
        showNotification('Đăng nhập bằng Google thành công!', 'success');
        navigate('/');
      } else {
        setError("Không nhận được token từ Google.");
      }
    } catch (err: any) {
      setError("Đăng nhập bằng Google thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('rememberMe') === 'true') {
      setEmail(localStorage.getItem('email') || '');
      setPassword(localStorage.getItem('password') || '');
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (tokenFromUrl) {
      setCookie('accessToken', tokenFromUrl);
      
      apiClient.get<ApiResponse<any>>('/customer/profile')
        .then(profileRes => {
          if (profileRes && profileRes.data) {
            setUser(profileRes.data);
          }
          setIsLogin(true);
          showNotification('Đăng nhập thành công!', 'success');
          navigate('/');
        })
        .catch(err => {
          console.error("Không thể lấy thông tin profile:", err);
          setError('Đăng nhập Google thất bại hoặc không lấy được thông tin.');
        });
    }
  }, [tokenFromUrl, navigate, setIsLogin, setUser, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (rememberMe) {
      localStorage.setItem('email', email);
      localStorage.setItem('password', password);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('email');
      localStorage.removeItem('password');
      localStorage.removeItem('rememberMe');
    }

    try {
      const response = await apiClient.postnodata<ApiResponse<string>>('/login', { email, password });
      
      const resData = response.data;
      const token = resData?.data || (resData as unknown as string);

      if (token && typeof token === 'string') {
        setCookie('accessToken', token);

        try {
          const profileRes = await apiClient.get<ApiResponse<any>>('/customer/profile');
          if (profileRes && profileRes.data) {
            setUser(profileRes.data);
          }
        } catch (profileErr) {
          console.error("Không thể lấy thông tin profile:", profileErr);
        }

        setIsLogin(true);
        showNotification('Đăng nhập thành công!', 'success');
        navigate('/');
      } else {
        setError('Không nhận được token xác thực.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.title || 'Email hoặc mật khẩu không chính xác!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-[56px] flex flex-col overflow-hidden bg-gray-50 text-gray-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex flex-grow overflow-hidden relative">
        <main className="flex-grow h-full overflow-y-auto p-4 scroll-smooth">
          <div className="container mx-auto flex items-center justify-center h-full py-12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden max-w-[480px]">
              <div className="p-6 md:p-10 flex flex-col gap-6">
                
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                    Chào mừng trở lại
                  </h1>
                  <p className="text-gray-500 mb-0">
                    Vui lòng nhập thông tin đăng nhập của bạn.
                  </p>
                </div>

                <div className="flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        handleGoogleLogin(credentialResponse.credential);
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

                <div className="flex items-center gap-2 py-1">
                  <hr className="flex-grow m-0 border-t border-gray-200" />
                  <span className="text-gray-400 text-sm">Hoặc</span>
                  <hr className="flex-grow m-0 border-t border-gray-200" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {registered && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center">
                      Đăng ký thành công! Vui lòng đăng nhập.
                    </div>
                  )}
                  {message && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center">
                      {message}
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-sm mb-1 text-gray-700">Email</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 flex items-center">
                        <span className="material-symbols-outlined text-xl">mail</span>
                      </span>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a63b00] focus:border-transparent transition-all" 
                        placeholder="name@example.com" 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-sm mb-1 text-gray-700">Mật khẩu</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 flex items-center">
                        <span className="material-symbols-outlined text-xl">lock</span>
                      </span>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a63b00] focus:border-transparent transition-all" 
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="rememberMe" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-[#a63b00] rounded border-gray-300 focus:ring-[#a63b00] cursor-pointer" 
                      />
                      <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
                        Nhớ tôi
                      </label>
                    </div>
                    <Link to="/forgot-password" className="text-[#a63b00] hover:text-[#8a3100] font-medium hover:underline text-sm">
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-[#a63b00] hover:bg-[#8a3100] text-white font-bold py-3 mt-2 rounded-lg shadow-sm transition-colors h-12 disabled:opacity-70 flex justify-center items-center"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      "Đăng nhập"
                    )}
                  </button>
                </form>

              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                <p className="text-gray-500 text-sm mb-0">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="text-[#a63b00] hover:text-[#8a3100] font-bold no-underline">
                    Đăng ký ngay
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

export default LoginPage;
