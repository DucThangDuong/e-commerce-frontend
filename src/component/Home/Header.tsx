import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../zustand/store";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { isLogin } = useStore((state) => state);

  return (
    <header className="flex items-center whitespace-nowrap border-b border-solid border-[#dbdfe6] px-6 py-3 bg-white z-20 sticky top-0 h-16 shrink-0">
      <div className="flex items-center gap-8 w-full">
        <div className="flex items-center gap-3 text-black min-w-fit md:min-w-[240px]">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 text-muted transition-colors focus:outline-none"
            title="Mở menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <h2 className="text-xl font-bold cursor-pointer">BrandLogo</h2>
        </div>
{/* 
        <div className="input flex max-w-[400px]">
          <div className="text-muted flex items-center justify-center pl-4 rounded-l-lg border-r-0">
            <span className="material-symbols-outlined text-[20px]">
              search
            </span>
          </div>
          <input
            className="text-l font-bold text-left outline-none bg-transparent w-full p-2"
            placeholder="Tìm kiếm nội dung, danh mục..."
          />
        </div> */}

        <div className="flex flex-1 justify-end gap-4">
          {isLogin ? (
            <></>
            // <div className="flex items-center gap-3">
            //   <button
            //     className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 text-muted transition-colors"
            //     title="Thông báo"
            //   >
            //     <span className="material-symbols-outlined relative">
            //       notifications
            //       <span className="absolute -top-1 font-bold right-0 h-2 w-2 rounded-full bg-red-700"></span>
            //     </span>
            //   </button>
            //   <div className="hidden md:flex flex-col items-end">
            //     <span className="text-sm font-bold text-body leading-tight">
            //       {user.fullname || "Người dùng"}
            //     </span>
            //     <span className="text-xs text-muted">{user.email}</span>
            //   </div>

            //   <Link
            //     to={"/profile"}
            //     className="w-10 h-10 rounded-lg overflow-hidden border border-[#dbdfe6] hover:ring-2 hover:ring-primary/20 transition-all"
            //   >
            //     <img
            //       src={`${user.avatarUrl}?t=${Date.now}`}
            //       alt="Avatar"
            //       className="w-full h-full object-cover"
            //     />
            //   </Link>

            //   <button
            //     onClick={logout}
            //     className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
            //     title="Đăng xuất"
            //   >
            //     <span className="material-symbols-outlined">logout</span>
            //   </button>
            // </div>
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
    </header>
  );
};

export default Header;
