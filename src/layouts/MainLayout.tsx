import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../zustand/store';
import { apiClient, removeCookie } from '../untils/apiClient';

const MainLayout: React.FC = () => {
  const { isLogin, user, setIsLogin, setUser } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.postnodata('/logout');
    } catch (err) {
      console.error('Lỗi khi đăng xuất API', err);
    } finally {
      // Clear all possible tokens and states regardless of API result
      removeCookie('accessToken');
      localStorage.removeItem('accessToken');
      setUser(null);
      setIsLogin(false);
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f9f7] font-['Plus_Jakarta_Sans',sans-serif] text-[#1a1c1b]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-white/75 backdrop-blur-xl border-b border-gray-200 shadow-sm z-50">
        <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center py-3">
          
          <Link to="/" className="text-2xl font-black italic text-gray-900 uppercase tracking-tighter hover:text-gray-700 transition-colors font-['Space_Grotesk',sans-serif]">
            PRECISION MOTORS
          </Link>

          <div className="hidden lg:flex items-center gap-8 font-bold uppercase tracking-tight text-sm">
            <Link to="/" className="text-gray-900 hover:text-[#0d6efd] transition-colors">Trang chủ</Link>
            <Link to="/categories" className="text-gray-900 hover:text-[#0d6efd] transition-colors">Danh mục</Link>
            {isLogin && <Link to="/purchase" className="text-gray-900 hover:text-[#0d6efd] transition-colors">Đơn hàng</Link>}
            {/* TODO: Add Admin check using your role system */}
            {/* <Link to="/admin" className="text-[#0d6efd] hover:text-blue-700 transition-colors">Quản lý</Link> */}
          </div>

          <div className="flex items-center gap-6">
            <form action="/categories" method="GET" className="hidden md:flex relative m-0">
              <input type="text" name="q" className="rounded-full pl-4 pr-10 py-2 border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent text-sm w-56" placeholder="Tìm kiếm xe..." />
              <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pr-3 hover:text-gray-700 flex items-center">
                <span className="material-symbols-outlined text-xl">search</span>
              </button>
            </form>

            {isLogin && (
              <Link to="/cart" className="text-gray-900 hover:text-gray-700 relative flex items-center">
                <span className="material-symbols-outlined text-3xl">shopping_cart</span>
              </Link>
            )}

            <div className="flex justify-end gap-3">
              {isLogin ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="font-bold text-gray-900 text-sm leading-tight">{user?.name || "Người dùng"}</span>
                    <span className="text-gray-500 text-xs">{user?.email || "email@domain.com"}</span>
                  </div>
                  <Link to="/profile" className="rounded border border-gray-300 overflow-hidden block shadow-sm w-10 h-10 shrink-0">
                    <img src={user?.avatarUrl || "https://ui-avatars.com/api/?name=User&background=random"} alt="Avatar" className="w-full h-full object-cover" />
                  </Link>
                  <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 flex items-center justify-center p-2 text-gray-500 rounded transition-colors" title="Đăng xuất">
                    <span className="material-symbols-outlined">logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="bg-gray-100 hover:bg-gray-200 font-bold px-4 py-2 text-sm rounded text-gray-900 transition-colors">Đăng nhập</Link>
                  <Link to="/register" className="bg-[#0d6efd] hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded shadow-sm transition-colors">Đăng ký</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 relative text-white pt-16 pb-8 mt-12 z-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <h4 className="uppercase font-bold mb-6 tracking-wide text-xl">Precision Motors</h4>
              <p className="text-gray-400 mb-8 leading-relaxed">Đại lý phân phối xe máy chính hãng hàng đầu, mang đến cho bạn trải nghiệm mua sắm tuyệt vời và dịch vụ hậu mãi đẳng cấp.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#a63b00]">build</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Bảo trì 5 sao</h4>
                    <p className="m-0 text-gray-400 text-sm">Quy trình chuyên nghiệp</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#a63b00]">verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Bảo hành 3 năm</h4>
                    <p className="m-0 text-gray-400 text-sm">An tâm sử dụng</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#a63b00]">support_agent</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Cứu hộ 24/7</h4>
                    <p className="m-0 text-gray-400 text-sm">Luôn bên cạnh bạn</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#a63b00]">local_shipping</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Giao xe tận nhà</h4>
                    <p className="m-0 text-gray-400 text-sm">Tiện lợi & Nhanh chóng</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <h5 className="uppercase font-bold mb-6 text-lg">Liên hệ</h5>
              <ul className="flex flex-col gap-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl text-[#a63b00] shrink-0">location_on</span>
                  <span className="leading-relaxed">140 Lê Trọng Tấn, Tây Thạnh, Hồ Chí Minh, Việt Nam</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-[#a63b00] shrink-0">call</span>
                  <span>02862706275</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-[#a63b00] shrink-0">mail</span>
                  <span>ts.huit.edu.vn</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-5">
              <h5 className="uppercase font-bold mb-6 text-lg">Bản đồ vị trí</h5>
              <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-700 h-[250px] w-full">
                <iframe src="https://www.google.com/maps?q=Trường+Đại+học+Công+Thương+TP.HCM&output=embed"
                        className="w-full h-full border-0" allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade">
                </iframe>
              </div>
            </div>
          </div>
          <hr className="mt-12 mb-6 border-gray-800" />
          <div className="text-center text-gray-500 text-sm">
            &copy; 2026 Precision Motors. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
