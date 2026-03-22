import React from "react";
import Header from "../component/landing/Header";
import type { LayoutProps } from "../interfaces/product";
const DashboardLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="bg-background-light  text-[#111318] font-display h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 h-full overflow-y-auto bg-background-light p-6  scroll-smooth">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-10 py-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
