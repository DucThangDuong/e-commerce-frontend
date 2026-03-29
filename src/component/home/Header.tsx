import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../zustand/store';
import { logout } from '../../untils/auth';

const Navigation: React.FC = () => {
  const { isLogin, user } = useStore((state) => state);

  const isActive = (pathname: string, url: string) => {
    if (url === "/") return pathname === "/";
    return pathname === url || pathname.startsWith(url + "/");
  };
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-8 py-4">
        <div className="text-2xl font-black italic tracking-tighter text-zinc-900 font-['Space_Grotesk'] uppercase">
          PRECISION MOTORS
        </div>
        <div className="flex items-center space-x-8 font-bold tracking-tighter uppercase">
          <NavItem label="Shop" url="/" active={isActive(location.pathname, "/")} onClick={() => { }} />
          <NavItem label="Categories" url="/categories" active={isActive(location.pathname, "/categories")} onClick={() => { }} />
          <NavItem label="Service" url="/service" active={isActive(location.pathname, "/service")} onClick={() => { }} />
          <NavItem label="Purchase" url="/purchase" active={isActive(location.pathname, "/purchase")} onClick={() => { }} />
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/cart" className="scale-95 active:scale-90 transition-transform text-zinc-900 relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute -top-2 -right-2 bg-[#b90014] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
          </Link>
          <div className="flex flex-1 justify-end gap-4">
            {isLogin && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-body leading-tight">
                    {user.name || "Người dùng"}
                  </span>
                  <span className="text-xs text-muted">{user.email}</span>
                </div>

                <Link
                  to={"/profile"}
                  className="w-10 h-10 rounded-lg overflow-hidden border border-[#dbdfe6] hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer block"
                >
                  <img
                    src={`${user.avatarUrl}?t=${Date.now()}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
                  title="Đăng xuất"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent hover:bg-gray-100 text-body text-sm font-bold leading-normal tracking-[0.015em] transition-colors"
                >
                  <span className="truncate">Đăng nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm"
                >
                  <span className="truncate">Đăng ký</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bg-zinc-100 h-[1px] w-full"></div>
    </nav>
  );
};
interface NavItemProps {
  label: string;
  active?: boolean;
  url: string;
  onClick: () => void;
}
const NavItem = ({
  label,
  active = false,
  url,
  onClick,
}: NavItemProps) => {
  return (
    <Link
      to={url}
      onClick={onClick}
      className={` ${active ? "text-red-600 border-b-2 border-red-600 pb-1" :
        "text-zinc-600 hover:text-zinc-900 transition-colors"}`}
    >
      {label}
    </Link>
  );
};
export default Navigation;
