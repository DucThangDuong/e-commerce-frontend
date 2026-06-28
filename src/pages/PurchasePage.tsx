import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import { useStore } from '../zustand/store';
import type { ResOrder, ResCancellationReasonDto, CancelOrderReqDto } from '../interfaces/order';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const PurchasePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pending';
  const { showNotification } = useStore();

  const [orders, setOrders] = useState<ResOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State cho cập nhật thông tin
  const [selectedOrder, setSelectedOrder] = useState<ResOrder | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Map Picker State
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [tempPosition, setTempPosition] = useState<L.LatLng | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const confirmMapLocation = async () => {
    if (!tempPosition) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempPosition.lat}&lon=${tempPosition.lng}&accept-language=vi`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        setMapPosition([tempPosition.lat, tempPosition.lng]);
        setShowMapModal(false);
      } else {
        showNotification('Không tìm thấy địa chỉ cho vị trí này', 'warning');
      }
    } catch (err) {
      console.error(err);
      showNotification('Lỗi khi lấy địa chỉ', 'danger');
    } finally {
      setIsGeocoding(false);
    }
  };
  // Viewing Order State
  const [viewingOrder, setViewingOrder] = useState<ResOrder | null>(null);

  // Cancel Order Modal State
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [cancellationReasons, setCancellationReasons] = useState<ResCancellationReasonDto[]>([]);

  useEffect(() => {
    const fetchCancellationReasons = async () => {
      try {
        const res = await apiClient.get<ApiResponse<ResCancellationReasonDto[]>>('/cancellation-reasons');
        if (res && res.data) {
          const sorted = [...res.data].sort((a, b) => a.displayOrder - b.displayOrder);
          setCancellationReasons(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch cancellation reasons", err);
      }
    };
    fetchCancellationReasons();
  }, []);

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

  const paymentStatus = searchParams.get('payment');
  const orderIdParam = searchParams.get('orderId');

  useEffect(() => {
    fetchOrders();

    if (paymentStatus === 'success') {
      showNotification(`Thanh toán thành công cho đơn hàng #${orderIdParam}!`, 'success');
      // Xóa params để không hiện lại khi refresh
      window.history.replaceState({}, '', '/purchase?tab=completed');
    } else if (paymentStatus === 'failed') {
      showNotification(`Thanh toán thất bại hoặc đã bị hủy!`, 'danger');
      window.history.replaceState({}, '', '/purchase?tab=pending');
    }
  }, [currentTab, paymentStatus, orderIdParam]);

  const submitCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      let finalReason = cancelReason;
      if (cancelReason === 'OTHER') {
        finalReason = otherReason;
      } else {
        const found = cancellationReasons.find(r => r.code === cancelReason);
        if (found) finalReason = found.content;
      }
      
      const payload: CancelOrderReqDto = {
        orderId: orderToCancel,
        reason: finalReason
      };
      await apiClient.post(`/order/cancel`, payload);
      showNotification('Đã hủy đơn hàng thành công', 'success');
      setOrderToCancel(null);
      setCancelReason('');
      setOtherReason('');
      setViewingOrder(null); // Close details modal if open
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
      default: return <span className="bg-gray-100 text-[#1a1c1b] px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentTab === 'pending' ? 'bg-orange-50 text-[#a63b00] font-bold shadow-sm' : 'text-[#594138] hover:bg-gray-100'}`}
          >
            <span className="material-symbols-outlined">pending_actions</span>
            <span className="text-sm">Đơn hàng chờ xử lý</span>
            {pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </Link>
          <Link 
            to="?tab=completed" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentTab === 'completed' ? 'bg-orange-50 text-[#a63b00] font-bold shadow-sm' : 'text-[#594138] hover:bg-gray-100'}`}
          >
            <span className="material-symbols-outlined">task_alt</span>
            <span className="text-sm">Đơn hàng đã hoàn thành</span>
          </Link>
          <Link 
            to="?tab=cancelled" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentTab === 'cancelled' ? 'bg-orange-50 text-[#a63b00] font-bold shadow-sm' : 'text-[#594138] hover:bg-gray-100'}`}
          >
            <span className="material-symbols-outlined">cancel</span>
            <span className="text-sm">Đơn hàng đã hủy</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1c1b] mb-2 tracking-tight">
            {currentTab === 'pending' ? 'Đơn hàng chờ xử lý' : currentTab === 'completed' ? 'Đơn hàng đã hoàn thành' : 'Đơn hàng đã hủy'}
          </h1>
          <p className="text-[#594138] text-sm md:text-base max-w-2xl">
            Lịch sử chi tiết của các lô hàng toàn cầu đã giao và kho lưu trữ đơn hàng.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {loading ? (
             <div className="flex justify-center items-center py-12 md:py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#a63b00]"></div>
             </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">receipt_long</span>
              <h4 className="text-xl text-[#1a1c1b] font-bold mb-2">Không có đơn hàng nào</h4>
              <p className="text-[#594138] text-sm">Bạn chưa có đơn hàng nào trong mục này.</p>
            </div>
          ) : (
            orders.map(order => (
              <section key={order.orderId} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header Summary */}
                <div className="bg-white p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap gap-6 md:gap-6 lg:gap-10">
                    <div>
                      <p className="text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider mb-1">Mã đơn hàng</p>
                      <p className="font-bold text-[#1a1c1b] text-sm">#ORD-{order.orderId}</p>
                    </div>
                    <div>
                      <p className="text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider mb-1">Ngày mua</p>
                      <p className="font-bold text-[#1a1c1b] text-sm">{order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider mb-1">Trạng thái</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider mb-1">Tổng đơn hàng</p>
                      <p className="text-xl font-bold text-[#a63b00] m-0">{order.totalAmount?.toLocaleString('vi-VN')} đ</p>
                    </div>
                    <button 
                      onClick={() => setViewingOrder(order)}
                      className="ml-auto md:ml-0 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1a1c1b] border border-gray-200 rounded-xl font-bold transition-colors text-sm whitespace-nowrap"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {/* Modal Cập nhật thông tin */}
      {selectedOrder && !showMapModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-[#1a1c1b]">Cập nhật thông tin giao hàng</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-[#594138] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateInfo}>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider">Địa chỉ mới</label>
                    <button type="button" onClick={() => { setTempPosition(mapPosition ? new L.LatLng(mapPosition[0], mapPosition[1]) : null); setShowMapModal(true); }} className="text-[#a63b00] text-xs font-bold hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">map</span>
                      Mở bản đồ
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#a63b00] focus:border-[#a63b00] outline-none transition-all text-sm"
                      required
                    />
                    {mapPosition && (
                      <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-200 relative shadow-sm pointer-events-none">
                        <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }} dragging={false} zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={mapPosition} />
                        </MapContainer>
                        <div className="absolute top-2 right-2 z-[400] pointer-events-auto">
                          <button type="button" onClick={(e) => { e.preventDefault(); setMapPosition(null); }} className="w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white shadow-sm">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider mb-2">Số điện thoại mới</label>
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
                  className="px-5 py-2.5 bg-white border border-gray-300 text-[#1a1c1b] rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm"
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

      {/* Cancel Order Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
              <h3 className="font-bold text-lg text-[#1a1c1b]">Bạn chắc chắn muốn hủy đơn hàng này chứ?</h3>
              <button 
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelReason('');
                  setOtherReason('');
                }}
                className="text-gray-400 hover:text-[#594138] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-[#594138] text-sm mb-4">
                Để giúp Gia Phát cải thiện dịch vụ, xin cho chúng tôi biết lý do bạn hủy đơn nhé (Không bắt buộc):
              </p>
              
              <div className="flex flex-col gap-3 mb-4">
                {cancellationReasons.map((reason) => (
                  <label key={reason.code} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${cancelReason === reason.code ? 'border-[#a63b00] bg-orange-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cancelReason === reason.code ? 'border-[#a63b00]' : 'border-gray-300'}`}>
                      {cancelReason === reason.code && <div className="w-2.5 h-2.5 rounded-full bg-[#a63b00]"></div>}
                    </div>
                    <input 
                      type="radio" 
                      name="cancelReason" 
                      value={reason.code} 
                      className="hidden" 
                      checked={cancelReason === reason.code}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <span className="text-sm font-medium text-[#1a1c1b]">{reason.content}</span>
                  </label>
                ))}
              </div>

              {cancelReason === 'OTHER' && (
                <div className="animate-fade-in-down mt-2">
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Vui lòng chia sẻ lý do của bạn (Không bắt buộc)..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#a63b00] focus:border-[#a63b00] outline-none transition-all text-sm resize-none"
                    rows={3}
                  ></textarea>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-gray-50">
              <button 
                type="button" 
                onClick={submitCancelOrder}
                className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm w-full sm:w-auto"
              >
                VẪN HỦY ĐƠN
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelReason('');
                  setOtherReason('');
                }}
                className="px-5 py-2.5 bg-[#a63b00] text-white rounded-xl font-bold hover:bg-[#8a3100] shadow-sm transition-colors text-sm w-full sm:w-auto"
              >
                KHÔNG, TÔI SẼ SUY NGHĨ LẠI
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Order Details Modal (Dynamic Product Mindset UI) */}
  {viewingOrder && !selectedOrder && !orderToCancel && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <h3 className="font-bold text-xl text-[#1a1c1b]">Chi tiết đơn hàng #ORD-{viewingOrder.orderId}</h3>
          <button onClick={() => setViewingOrder(null)} className="text-gray-400 hover:text-[#594138] transition-colors w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow p-6 flex flex-col gap-8 bg-white">
          {/* Order Dates & Info */}
          <div className="flex flex-col gap-1.5 text-sm text-[#594138] bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-gray-500">calendar_today</span>
              <span className="font-medium">Ngày đặt hàng:</span>
              <span className="text-[#1a1c1b]">{viewingOrder.orderDate ? new Date(viewingOrder.orderDate).toLocaleString('vi-VN') : 'Không có thông tin'}</span>
            </div>
            {viewingOrder.updatedAt && viewingOrder.orderDate && Math.abs(new Date(viewingOrder.updatedAt).getTime() - new Date(viewingOrder.orderDate).getTime()) > 2000 && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-gray-500">update</span>
                <span className="font-medium">Cập nhật lần cuối:</span>
                <span className="text-[#1a1c1b]">{new Date(viewingOrder.updatedAt).toLocaleString('vi-VN')}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 border-t border-gray-200 pt-2">
              <span className="material-symbols-outlined text-[18px] text-gray-500">payments</span>
              <span className="font-medium">Thanh toán:</span>
              <span className={`font-bold ${viewingOrder.paymentStatus === 'Paid' ? 'text-green-600' : viewingOrder.paymentStatus === 'Failed' ? 'text-red-500' : 'text-yellow-600'}`}>
                {viewingOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' : viewingOrder.paymentStatus === 'Failed' ? 'Thất bại' : 'Chưa thanh toán'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-[18px] text-gray-500">local_shipping</span>
              <span className="font-medium">Trạng thái giao hàng:</span>
              <div className="ml-1">{getStatusBadge(viewingOrder.status)}</div>
            </div>
          </div>

          {/* Dynamic Status UI */}
          {(() => {
            const status = viewingOrder.status?.toLowerCase();
            if (status === 'pending') {
              return (
                <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-start md:items-center gap-3">
                    <span className="material-symbols-outlined text-yellow-600 mt-1 md:mt-0">warning</span>
                    <p className="text-yellow-800 text-sm font-medium">Đơn hàng sẽ tự động hủy sau 24h nếu không thanh toán.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-4 py-2.5 bg-[#a63b00] text-white rounded-xl font-bold text-sm">Thanh toán ngay</button>
                    <button onClick={() => setOrderToCancel(viewingOrder.orderId)} className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-sm">Hủy đơn hàng</button>
                  </div>
                </div>
              );
            } else if (status === 'processing' || status === 'paid') {
              return (
                <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col gap-6">
                   <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600">info</span>
                      <div>
                        <p className="text-blue-800 text-sm font-bold">Cửa hàng đang kiểm tra xe và chuẩn bị hồ sơ.</p>
                        <p className="text-blue-700 text-xs mt-1">Đơn hàng của bạn đã được ghi nhận thành công.</p>
                      </div>
                      <button className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors whitespace-nowrap">Liên hệ hỗ trợ</button>
                   </div>
                   {/* Stepper */}
                   <div className="flex items-center justify-between mt-2 max-w-sm mx-auto w-full relative">
                      <div className="absolute top-4 left-4 right-4 h-[2px] bg-blue-200 -z-10"></div>
                      <div className="flex flex-col items-center gap-2 bg-blue-50 px-2 relative z-10">
                         <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">✓</div>
                         <span className="text-[0.65rem] uppercase tracking-wider text-blue-800 font-bold">Thanh toán</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 bg-blue-50 px-2 relative z-10">
                         <div className="w-8 h-8 rounded-full border-2 border-blue-600 bg-white text-blue-600 flex items-center justify-center font-bold shadow-sm">2</div>
                         <span className="text-[0.65rem] uppercase tracking-wider text-blue-800 font-bold">Xử lý</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 bg-blue-50 px-2 relative z-10">
                         <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center font-bold">3</div>
                         <span className="text-[0.65rem] uppercase tracking-wider text-gray-400 font-bold">Giao hàng</span>
                      </div>
                   </div>
                </div>
              );
            } else if (status === 'shipping') {
              return (
                <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-indigo-600">local_shipping</span>
                    <div>
                       <p className="text-indigo-800 text-sm font-bold">Đơn hàng đang trên đường giao đến bạn!</p>
                       <p className="text-indigo-700 text-xs mt-1">Đơn vị vận chuyển: Gia Phát Logistics - Vận đơn: GP-{viewingOrder.orderId}89</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">Theo dõi hành trình</button>
                  </div>
                </div>
              );
            } else if (status === 'completed' || status === 'delivered') {
              return (
                <div className="bg-green-50 border border-green-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                    <p className="text-green-800 text-sm font-bold">Chúc mừng bạn đã nhận xe thành công!</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors">Đánh giá sản phẩm</button>
                    <button className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-green-300 text-green-800 rounded-xl font-bold text-sm">Mua phụ kiện</button>
                  </div>
                </div>
              );
            } else if (status === 'cancelled') {
              return (
                <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-600">cancel</span>
                    <div>
                      <p className="text-red-800 text-sm font-bold">Đơn hàng đã bị hủy.</p>
                      <p className="text-red-700 text-xs mt-1">Cảm ơn bạn đã quan tâm. Hẹn gặp lại bạn lần sau!</p>
                    </div>
                  </div>
                  <button className="px-5 py-2.5 bg-[#1a1c1b] hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-colors">Mua lại ngay</button>
                </div>
              );
            }
            return null;
          })()}

          {/* Fixed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Shipping Info */}
             <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-[#1a1c1b] flex items-center gap-2"><span className="material-symbols-outlined text-[#a63b00] text-xl">location_on</span> Thông tin giao hàng</h4>
                  {(viewingOrder.status?.toLowerCase() !== 'cancelled' && viewingOrder.status?.toLowerCase() !== 'completed' && viewingOrder.status?.toLowerCase() !== 'delivered') && (
                    <button 
                      onClick={() => {
                        setSelectedOrder(viewingOrder);
                        setAddress(viewingOrder.address || '');
                        setPhone(viewingOrder.phoneNumber || '');
                      }} 
                      className="text-[#a63b00] text-xs font-bold hover:underline bg-orange-50 px-3 py-1 rounded-full"
                    >
                      Thay đổi
                    </button>
                  )}
                </div>
                <p className="text-sm text-[#1a1c1b] mb-2 font-medium">SĐT: <span className="font-normal text-[#594138]">{viewingOrder.phoneNumber || 'N/A'}</span></p>
                <p className="text-sm text-[#1a1c1b] font-medium leading-relaxed">Địa chỉ: <span className="font-normal text-[#594138]">{viewingOrder.address || 'N/A'}</span></p>
             </div>
             
             {/* Order Summary */}
             <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col h-full">
                <h4 className="font-bold text-[#1a1c1b] flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-[#a63b00] text-xl">receipt_long</span> Tóm tắt thanh toán</h4>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#594138]">Tạm tính:</span>
                  <span className="font-medium text-[#1a1c1b]">{viewingOrder.originalAmount?.toLocaleString('vi-VN')} đ</span>
                </div>
                {viewingOrder.discountAmount ? (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-600">Giảm giá:</span>
                    <span className="font-bold text-green-600">-{viewingOrder.discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-[#594138]">Phí vận chuyển/Giấy tờ:</span>
                  <span className="font-medium text-[#1a1c1b]">{(30000).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-4 mt-auto">
                  <span className="font-bold text-[#1a1c1b]">Thành tiền:</span>
                  <span className="font-bold text-[#a63b00] text-lg lg:text-xl">{viewingOrder.totalAmount?.toLocaleString('vi-VN')} đ</span>
                </div>
             </div>
          </div>

          {/* Product Items List */}
          <div>
            <h4 className="font-bold text-[#1a1c1b] mb-4">Danh sách sản phẩm</h4>
            <div className="flex flex-col gap-3">
              {viewingOrder.orderItems?.map((item, idx) => {
                const imgUrl = item.imageUrl && item.imageUrl.length > 0 ? item.imageUrl[0] : "https://via.placeholder.com/150";
                return (
                  <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 hover:border-gray-200 transition-colors">
                    <img loading="lazy" decoding="async" src={imgUrl} alt={item.name} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <h5 className="font-bold text-sm md:text-base text-[#1a1c1b] line-clamp-2 leading-snug">{item.name}</h5>
                      <p className="text-xs text-[#594138] mt-1">Phân loại: <span className="font-medium text-[#1a1c1b]">{item.colorName}</span></p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm md:text-base text-[#a63b00]">{item.unitPriceAtPurchase?.toLocaleString('vi-VN')} đ</p>
                      <p className="text-xs font-medium text-[#594138] mt-1">SL: {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )}

  {/* Map Picker Modal */}
  {showMapModal && (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden animate-scale-up flex flex-col h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-lg text-[#1a1c1b] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a63b00]">pin_drop</span>
            Ghim vị trí giao hàng
          </h3>
          <button type="button" onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-[#594138] transition-colors w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-grow relative bg-gray-100 z-0">
          <MapContainer 
            center={tempPosition || [10.8231, 106.6297]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={setTempPosition} />
            {tempPosition && <Marker position={tempPosition} />}
          </MapContainer>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 text-sm font-bold text-[#1a1c1b] pointer-events-none">
            Chạm vào bản đồ để chọn vị trí
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
           <button 
             type="button"
             onClick={() => setShowMapModal(false)}
             className="px-5 py-2.5 bg-gray-50 border border-gray-200 text-[#1a1c1b] rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm"
           >
             Đóng
           </button>
           <button 
             type="button"
             disabled={!tempPosition || isGeocoding}
             onClick={confirmMapLocation}
             className="px-6 py-2.5 bg-[#a63b00] text-white rounded-xl font-bold hover:bg-orange-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             {isGeocoding ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : null}
             Xác nhận & Tự động điền
           </button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};

export default PurchasePage;
