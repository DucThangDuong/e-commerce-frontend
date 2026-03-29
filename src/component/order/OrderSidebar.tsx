import React from 'react';

const OrderSidebar: React.FC = () => {
  return (
    <aside className="fixed z-1 left-0 top-16 bottom-0 flex flex-col p-4 space-y-2 h-screen w-64 border-r-0 bg-slate-50  text-sm tracking-tight z-10">
      <div className="px-4 py-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
            <img className="w-full h-full object-cover"
              alt="Manager Avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-9by7q7ZlTMEuzOcXf6AV4iI_RZ2Lt2F9c1wnZstJ57xmtP8Z6NR9uuih6YWVil7A4tPwSlS5qBpxoGCWgWrz3WM5XuIhs2ngIVjDY8J48kOlrfaxNXDOGzaMZir5QVh8AqMaOk2FrNjypk-t5HtmQ6g_WNOVkmw-N_RtUhtXM6Fq15jK9-gm3wVw_WovbH0aV_0o35nkjrNlKUUNtCWaHbiVvIK0lb7dhKhx0YbxNSgS1bk-uBvAxZ3qMxzD3yreLy78su3tVnI" />
          </div>
          <div>
            <p className="font-bold text-on-surface">Order Manager</p>
            <p className="text-xs text-on-surface-variant">Global Fulfillment</p>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:translate-x-1 transition-transform duration-200"
          href="#">
          <span className="material-symbols-outlined">pending_actions</span>
          <span>Pending Orders</span>
        </a>
        <a className="flex items-center gap-3 px-4 py-3 text-orange-600 font-bold bg-white rounded-lg hover:translate-x-1 transition-transform duration-200 shadow-sm"
          href="#">
          <span className="material-symbols-outlined">task_alt</span>
          <span>Completed Orders</span>
        </a>
      </div>
    </aside>
  );
};

export default OrderSidebar;
