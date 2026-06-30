import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiClient, setCookie } from '../untils/apiClient';
import { useStore } from '../zustand/store';


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
    <div className="min-h-screen pt-[80px] flex flex-col bg-[#f9f9f7] text-[#1a1c1b] font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <main className="flex-grow flex items-center justify-center p-4 relative z-10 pb-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white w-full overflow-hidden max-w-[480px] relative">
          <div className="p-8 md:p-10 flex flex-col gap-6 relative z-10">
            
            <div className="text-center mb-2">
              <h1 className="text-3xl font-heading font-black tracking-tight text-[#1a1c1b] uppercase">
                Chào mừng trở lại
              </h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">
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

            <div className="flex items-center gap-3 py-2">
              <hr className="flex-grow m-0 border-t-2 border-dashed border-gray-100" />
              <span className="text-gray-400 font-heading font-bold uppercase text-[10px] tracking-widest">Hoặc</span>
              <hr className="flex-grow m-0 border-t-2 border-dashed border-gray-100" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {registered && (
                <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Đăng ký thành công! Vui lòng đăng nhập.
                </div>
              )}
              {message && (
                <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">info</span>
                  {message}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              )}

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
                    placeholder="name@example.com" 
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
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white hover:bg-white transition-all text-sm font-medium [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      id="rememberMe" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer hidden" 
                    />
                    <div className="w-5 h-5 rounded border-2 border-gray-200 peer-checked:border-primary peer-checked:bg-primary transition-colors flex items-center justify-center group-hover:border-primary/50">
                      <span className="material-symbols-outlined text-white text-[14px] opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-[#1a1c1b] transition-colors">Nhớ tôi</span>
                </label>
                <Link to="/forgot-password" className="text-primary hover:text-primary-hover font-bold hover:underline text-sm transition-colors">
                  Quên mật khẩu?
                </Link>
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
                    <span>Đăng nhập</span>
                    <span className="material-symbols-outlined text-xl transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
            <p className="text-gray-500 font-medium text-sm m-0">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary hover:text-primary-hover font-heading font-black uppercase tracking-wider no-underline hover:underline ml-1">
                Đăng ký ngay
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default LoginPage;
