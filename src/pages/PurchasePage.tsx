import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import { useStore } from '../zustand/store';
import type { ResOrder } from '../interfaces/order';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const PurchasePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pending';
  const { showNotification } = useStore();

  const [orders, setOrders] = useState<ResOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State cho cập nhật thông tin
  const [selectedOrder, setSelectedOrder] = useState<ResOrder | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Map tab to API status param if needed. Here we assume backend accepts status query param
      let statusParam = '';
      if (currentTab === 'pending') statusParam = 'Pending';
      if (currentTab === 'completed') statusParam = 'Completed'; // or 'Delivered'
      if (currentTab === 'cancelled') statusParam = 'Cancelled';

      // NOTE: Update API endpoint according to your backend
      const res = await apiClient.get<ApiResponse<ResOrder[]>>(`/purchase?status=${statusParam}`);
      if (res && res.data) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      // Giả lập dữ liệu nếu chưa có API thật
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentTab]);

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      // NOTE: Update API endpoint according to your backend
      await apiClient.post(`/order/cancel`, { orderId });
      showNotification('Đã hủy đơn hàng thành công', 'success');
      fetchOrders();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Không thể hủy đơn hàng', 'danger');
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      // NOTE: Update API endpoint according to your backend
      await apiClient.put(`/order/update-info`, {
        orderId: selectedOrder.orderId,
        address,
        phoneNumber: phone
      });
      showNotification('Cập nhật thông tin thành công', 'success');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Không thể cập nhật thông tin', 'danger');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">Đang chờ</span>;
      case 'paid': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">Đã thanh toán</span>;
      case 'shipping': return <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-semibold">Đang giao</span>;
      case 'delivered':
      case 'completed': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Hoàn thành</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">Đã hủy</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const pendingCount = 0; // Replace with real count if available

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pt-[70px]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-white border-r border-gray-200 p-4 sticky top-[70px] h-fit md:min-h-[calc(100vh-70px)] z-10">
        <div className="flex flex-col gap-2">
          <Link 
            to="?tab=pending" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentTab === 'pending' ? 'bg-orange-50 text-[#a63b00] font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <span className="material-symbols-outlined">pending_actions</span>
            <span className="text-sm">Đơn hàng chờ xử lý</span>
            {pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </Link>
          <Link 
            to="?tab=completed" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentTab === 'completed' ? 'bg-orange-50 text-[#a63b00] font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <span className="material-symbols-outlined">task_alt</span>
            <span className="text-sm">Đơn hàng đã hoàn thành</span>
          </Link>
          <Link 
            to="?tab=cancelled" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentTab === 'cancelled' ? 'bg-orange-50 text-[#a63b00] font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <span className="material-symbols-outlined">cancel</span>
            <span className="text-sm">Đơn hàng đã hủy</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">
            {currentTab === 'pending' ? 'Đơn hàng chờ xử lý' : currentTab === 'completed' ? 'Đơn hàng đã hoàn thành' : 'Đơn hàng đã hủy'}
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-2xl">
            Lịch sử chi tiết của các lô hàng toàn cầu đã giao và kho lưu trữ đơn hàng.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {loading ? (
             <div className="flex justify-center items-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a63b00]"></div>
             </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">receipt_long</span>
              <h4 className="text-xl text-gray-900 font-bold mb-2">Không có đơn hàng nào</h4>
              <p className="text-gray-500 text-sm">Bạn chưa có đơn hàng nào trong mục này.</p>
            </div>
          ) : (
            orders.map(order => (
              <section key={order.orderId} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="bg-gray-50/50 border-b border-gray-100 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap gap-6 md:gap-10">
                    <div>
                      <p className="text-gray-500 font-bold uppercase text-[0.65rem] tracking-wider mb-1">Mã đơn hàng</p>
                      <p className="font-bold text-gray-900 text-sm">#ORD-{order.orderId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-bold uppercase text-[0.65rem] tracking-wider mb-1">Ngày mua</p>
                      <p className="font-bold text-gray-900 text-sm">{order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-bold uppercase text-[0.65rem] tracking-wider mb-1">Trạng thái</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto">
                    <p className="text-gray-500 font-bold uppercase text-[0.65rem] tracking-wider mb-1">Tổng đơn hàng</p>
                    <p className="text-xl font-black text-[#a63b00] m-0">{order.totalAmount?.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 md:p-6 flex flex-col gap-4">
                  {order.orderItems?.map((item, idx) => {
                    const imgUrl = item.imageUrl && item.imageUrl.length > 0 ? item.imageUrl[0] : "https://via.placeholder.com/150";
                    return (
                      <div key={idx} className="bg-gray-50/50 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 border border-gray-50">
                        <div className="rounded-xl overflow-hidden flex-shrink-0 w-20 h-24 bg-white border border-gray-100">
                          <img className="w-full h-full object-cover" src={imgUrl} alt={item.name} />
                        </div>
                        <div className="flex-grow flex flex-col md:flex-row w-full justify-between items-center gap-4">
                          <div className="w-full md:w-2/5 text-center md:text-left">
                            <h3 className="font-bold text-gray-900 text-sm mb-1">{item.name}</h3>
                            <p className="text-gray-500 text-xs">Màu {item.colorName}</p>
                          </div>
                          <div className="w-full md:w-1/5 text-center">
                            <p className="text-gray-500 text-xs mb-1">Giá mua</p>
                            <p className="font-medium text-gray-900 text-sm">{item.unitPriceAtPurchase?.toLocaleString('vi-VN')} VNĐ</p>
                          </div>
                          <div className="w-full md:w-1/5 text-center">
                            <p className="text-gray-500 text-xs mb-1">SL</p>
                            <p className="font-medium text-gray-900 text-sm">{item.quantity}</p>
                          </div>
                          <div className="w-full md:w-1/5 text-center md:text-right">
                            <p className="text-gray-500 text-xs mb-1">Tổng con</p>
                            <p className="font-bold text-gray-900 text-sm">{(item.unitPriceAtPurchase * item.quantity).toLocaleString('vi-VN')} VNĐ</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions (Pending only) */}
                {order.status?.toLowerCase() === 'pending' && (
                  <div className="bg-gray-50/50 p-4 md:px-6 md:py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setAddress(order.address || '');
                        setPhone(order.phoneNumber || '');
                      }}
                      className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cập nhật thông tin
                    </button>
                    <button 
                      onClick={() => handleCancelOrder(order.orderId)}
                      className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm"
                    >
                      Hủy đơn hàng
                    </button>
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      </main>

      {/* Modal Cập nhật thông tin */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Cập nhật thông tin giao hàng</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateInfo}>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-gray-500 font-bold uppercase text-[0.65rem] tracking-wider mb-2">Địa chỉ mới</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#a63b00] focus:border-[#a63b00] outline-none transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold uppercase text-[0.65rem] tracking-wider mb-2">Số điện thoại mới</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    pattern="(0|\+84)[35789][0-9]{8}"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#a63b00] focus:border-[#a63b00] outline-none transition-all text-sm"
                    required
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button 
                  type="button" 
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm"
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-[#a63b00] text-white rounded-xl font-bold hover:bg-orange-900 transition-colors text-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePage;
