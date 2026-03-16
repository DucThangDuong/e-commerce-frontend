import React, { useState } from "react";
import Header from "../component/Home/Header";
import Sidebar from "../component/Home/Sidebar";
import type { LayoutProps } from "../interfaces/product";
const DashboardLayout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="bg-background-light  text-[#111318] font-display h-screen flex flex-col overflow-hidden">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 h-full overflow-y-auto bg-background-light p-6 md:p-10 scroll-smooth">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-10 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
