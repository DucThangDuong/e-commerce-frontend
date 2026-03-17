import React from "react";
import type { LayoutProps } from "../interfaces/CommonTypes";

const LoginLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="bg-background-light  font-display text-black dark:text-white">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid   bg-white px-6 py-4 ">
          <div className="flex items-center gap-4 text-black cursor-pointer">
            <h2 className="text-xl font-bold leading-tight">BrandLogo</h2>
          </div>

          <div className="flex flex-1 justify-end gap-4  items-center">
            <div className="hidden md:flex items-center gap-9">
              {["Trang chủ", "Giới thiệu", "Liên hệ"].map((item) => (
                <a
                  key={item}
                  className="text-black text-sm font-medium leading-normal hover:text-primary transition-colors"
                  href="/"
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="flex min-w-[84px] cursor-pointer items-center rounded-lg h-10 px-4 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold ">
                <a href="/register" className="truncate">
                  Đăng ký
                </a>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 py-12">
          {children}
        </main>

        <footer className="py-6 text-center text-sm text-gray-500 ">
          © 2024 BrandName. Bảo lưu mọi quyền.
        </footer>
      </div>
    </div>
  );
};

export default LoginLayout;
