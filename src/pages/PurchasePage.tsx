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
    <div className="pt-[80px] min-h-screen bg-[#f9f9f7] font-sans relative overflow-hidden pb-20">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
             <span className="material-symbols-outlined text-[32px] text-primary drop-shadow-sm">local_mall</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-heading font-black text-[#1a1c1b] tracking-tight uppercase">
              Quản lý đơn hàng
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-2 max-w-2xl">
              Lịch sử chi tiết của các lô hàng toàn cầu đã giao và kho lưu trữ đơn hàng.
            </p>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Island */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 sticky top-28">
              <div className="flex flex-col gap-3">
                <Link 
                  to="?tab=pending" 
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-heading font-bold uppercase tracking-wider text-sm ${currentTab === 'pending' ? 'bg-gray-900 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className={`material-symbols-outlined ${currentTab === 'pending' ? 'text-primary' : ''}`}>pending_actions</span>
                  <span>Đang chờ</span>
                  {pendingCount > 0 && (
                    <span className="ml-auto bg-primary text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{pendingCount}</span>
                  )}
                </Link>
                <Link 
                  to="?tab=completed" 
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-heading font-bold uppercase tracking-wider text-sm ${currentTab === 'completed' ? 'bg-gray-900 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className={`material-symbols-outlined ${currentTab === 'completed' ? 'text-primary' : ''}`}>task_alt</span>
                  <span>Hoàn thành</span>
                </Link>
                <Link 
                  to="?tab=cancelled" 
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-heading font-bold uppercase tracking-wider text-sm ${currentTab === 'cancelled' ? 'bg-gray-900 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className={`material-symbols-outlined ${currentTab === 'cancelled' ? 'text-primary' : ''}`}>cancel</span>
                  <span>Đã hủy</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-grow min-w-0">

        <div className="flex flex-col gap-6">
          {loading ? (
             <div className="bg-white rounded-[2rem] p-20 flex justify-center items-center shadow-sm border border-gray-100">
               <div className="relative w-20 h-20">
                 <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
               </div>
             </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gray-50 rounded-full blur-3xl pointer-events-none"></div>
              <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative border-4 border-white shadow-xl z-10">
                <span className="material-symbols-outlined text-[64px] text-gray-300 drop-shadow-sm">receipt_long</span>
              </div>
              <h4 className="text-2xl font-heading font-black tracking-tight text-[#1a1c1b] mb-3 uppercase relative z-10">Không có đơn hàng</h4>
              <p className="text-gray-500 text-sm max-w-md leading-relaxed relative z-10">Bạn chưa có đơn hàng nào trong mục này. Hãy tiếp tục mua sắm để lấp đầy lịch sử nhé!</p>
            </div>
          ) : (
            orders.map(order => (
              <section key={order.orderId} className="bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>
                
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                  <div className="flex flex-wrap gap-8 lg:gap-12 w-full lg:w-auto">
                    <div>
                      <p className="text-gray-400 font-heading font-bold uppercase text-[10px] tracking-widest mb-1.5">Mã đơn hàng</p>
                      <p className="font-black text-[#1a1c1b] text-base tracking-tight">#ORD-{order.orderId}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-heading font-bold uppercase text-[10px] tracking-widest mb-1.5">Ngày mua</p>
                      <p className="font-bold text-[#1a1c1b] text-sm">{order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-heading font-bold uppercase text-[10px] tracking-widest mb-1.5">Trạng thái</p>
                      <div className="mt-1">{getStatusBadge(order.status)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 border-gray-100 pt-5 lg:pt-0">
                    <div className="text-left lg:text-right shrink-0">
                      <p className="text-gray-400 font-heading font-bold uppercase text-[10px] tracking-widest mb-1.5">Tổng thanh toán</p>
                      <p className="text-2xl font-heading font-black text-primary m-0 tracking-tight">{order.totalAmount?.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <button 
                      onClick={() => setViewingOrder(order)}
                      className="px-6 py-3 bg-gray-50 hover:bg-primary hover:text-white text-[#1a1c1b] rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      </div>
      </div>

      {/* Modal Cập nhật thông tin */}
      {selectedOrder && !showMapModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-8 py-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="font-heading font-black uppercase tracking-tight text-[#1a1c1b] text-xl relative z-10">Cập nhật giao hàng</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors relative z-10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateInfo}>
              <div className="px-8 pb-6 flex flex-col gap-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest">Địa chỉ mới</label>
                    <button type="button" onClick={() => { setTempPosition(mapPosition ? new L.LatLng(mapPosition[0], mapPosition[1]) : null); setShowMapModal(true); }} className="text-primary text-[11px] font-heading font-bold uppercase tracking-wider hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[14px]">map</span> Bản đồ
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border-2 border-gray-100 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium bg-gray-50/50 hover:bg-white focus:bg-white"
                      placeholder="Nhập địa chỉ giao hàng..."
                      required
                    />
                    {mapPosition && (
                      <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-primary/20 relative shadow-sm pointer-events-none">
                        <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }} dragging={false} zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={mapPosition} />
                        </MapContainer>
                        <div className="absolute top-2 right-2 z-[400] pointer-events-auto">
                          <button type="button" onClick={(e) => { e.preventDefault(); setMapPosition(null); }} className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest mb-3">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    pattern="(0|\+84)[35789][0-9]{8}"
                    className="w-full px-5 py-4 rounded-xl border-2 border-gray-100 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium bg-gray-50/50 hover:bg-white focus:bg-white"
                    placeholder="Nhập số điện thoại liên hệ..."
                    required
                  />
                </div>
              </div>
              <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button 
                  type="button" 
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-3 bg-white border border-gray-200 text-[#1a1c1b] rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-primary text-white rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-primary-hover shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-8 py-6 relative overflow-hidden bg-red-50/30 border-b border-red-50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <h3 className="font-heading font-black uppercase tracking-tight text-red-600 text-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl">warning</span>
                  Hủy đơn hàng?
                </h3>
                <button 
                  onClick={() => {
                    setOrderToCancel(null);
                    setCancelReason('');
                    setOtherReason('');
                  }}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>
            
            <div className="px-8 py-6 bg-white">
              <p className="text-gray-500 text-sm mb-6 font-medium">
                Để giúp chúng tôi cải thiện dịch vụ, xin cho biết lý do bạn hủy đơn nhé (Tùy chọn):
              </p>
              
              <div className="flex flex-col gap-3 mb-6">
                {cancellationReasons.map((reason) => (
                  <label key={reason.code} className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${cancelReason === reason.code ? 'border-red-400 bg-red-50/50 shadow-sm scale-[1.01]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${cancelReason === reason.code ? 'border-red-500 bg-white' : 'border-gray-300'}`}>
                      {cancelReason === reason.code && <div className="w-3 h-3 rounded-full bg-red-500 animate-scale-in"></div>}
                    </div>
                    <input 
                      type="radio" 
                      name="cancelReason" 
                      value={reason.code} 
                      className="hidden" 
                      checked={cancelReason === reason.code}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <span className={`text-sm font-medium ${cancelReason === reason.code ? 'text-red-900 font-bold' : 'text-[#1a1c1b]'}`}>{reason.content}</span>
                  </label>
                ))}
              </div>

              {cancelReason === 'OTHER' && (
                <div className="animate-fade-in-down">
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Vui lòng chia sẻ lý do chi tiết..."
                    className="w-full px-5 py-4 rounded-xl border-2 border-red-100 focus:ring-4 focus:ring-red-500/10 focus:border-red-400 outline-none transition-all text-sm font-medium bg-white resize-none shadow-inner"
                    rows={3}
                  ></textarea>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 bg-gray-50/50">
              <button 
                type="button" 
                onClick={submitCancelOrder}
                className="px-6 py-3.5 bg-white border-2 border-red-100 text-red-600 rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-red-50 transition-all shadow-sm w-full sm:w-auto text-center"
              >
                Vẫn hủy đơn
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelReason('');
                  setOtherReason('');
                }}
                className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto text-center"
              >
                Không, suy nghĩ lại
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Order Details Modal (Dynamic Product Mindset UI) */}
  {viewingOrder && !selectedOrder && !orderToCancel && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#f9f9f7] rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden my-auto border border-gray-100">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <h3 className="font-heading font-black uppercase tracking-tight text-[#1a1c1b] text-xl md:text-2xl flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
             Chi tiết đơn hàng <span className="text-primary">#{viewingOrder.orderId}</span>
          </h3>
          <button onClick={() => setViewingOrder(null)} className="text-gray-400 hover:text-primary transition-colors w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-primary/10 rounded-full">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow p-6 md:p-8 flex flex-col gap-8 bg-transparent">
          {/* Order Dates & Info - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col justify-center gap-1 shadow-sm">
                <span className="text-gray-400 font-heading font-bold uppercase tracking-widest text-[10px]">Ngày đặt hàng</span>
                <span className="font-bold text-[#1a1c1b] text-sm">{viewingOrder.orderDate ? new Date(viewingOrder.orderDate).toLocaleString('vi-VN') : 'Không có thông tin'}</span>
             </div>
             
             {viewingOrder.updatedAt && viewingOrder.orderDate && Math.abs(new Date(viewingOrder.updatedAt).getTime() - new Date(viewingOrder.orderDate).getTime()) > 2000 ? (
               <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col justify-center gap-1 shadow-sm">
                  <span className="text-gray-400 font-heading font-bold uppercase tracking-widest text-[10px]">Cập nhật lần cuối</span>
                  <span className="font-bold text-[#1a1c1b] text-sm">{new Date(viewingOrder.updatedAt).toLocaleString('vi-VN')}</span>
               </div>
             ) : (
               <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col justify-center gap-1 shadow-sm">
                  <span className="text-gray-400 font-heading font-bold uppercase tracking-widest text-[10px]">Trạng thái giao</span>
                  <div>{getStatusBadge(viewingOrder.status)}</div>
               </div>
             )}

             <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col justify-center gap-1 shadow-sm">
                <span className="text-gray-400 font-heading font-bold uppercase tracking-widest text-[10px]">Thanh toán</span>
                <span className={`font-bold text-sm ${viewingOrder.paymentStatus === 'Paid' ? 'text-green-600' : viewingOrder.paymentStatus === 'Failed' ? 'text-red-500' : 'text-yellow-600'}`}>
                  {viewingOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' : viewingOrder.paymentStatus === 'Failed' ? 'Thất bại' : 'Chưa thanh toán'}
                </span>
             </div>

             <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col justify-center gap-1 shadow-sm">
                <span className="text-gray-400 font-heading font-bold uppercase tracking-widest text-[10px]">Tổng tiền</span>
                <span className="font-black font-heading text-primary text-xl tracking-tight leading-none">{viewingOrder.totalAmount?.toLocaleString('vi-VN')} đ</span>
             </div>
          </div>

          {/* Dynamic Status UI */}
          {(() => {
            const status = viewingOrder.status?.toLowerCase();
            if (status === 'pending') {
              return (
                <div className="bg-yellow-500/10 border-2 border-yellow-500/20 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 text-yellow-500/20">
                     <span className="material-symbols-outlined text-[150px]">hourglass_empty</span>
                  </div>
                  <div className="flex items-start md:items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div>
                      <h4 className="text-yellow-900 font-heading font-black uppercase tracking-tight text-lg">Chờ thanh toán</h4>
                      <p className="text-yellow-800 text-sm font-medium mt-1">Đơn hàng sẽ tự động hủy sau 24h nếu không thanh toán.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto relative z-10">
                    <button onClick={() => setOrderToCancel(viewingOrder.orderId)} className="flex-1 md:flex-none px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] shadow-sm transition-colors">Hủy đơn</button>
                    <button className="flex-1 md:flex-none px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] shadow-lg transition-colors">Thanh toán ngay</button>
                  </div>
                </div>
              );
            } else if (status === 'processing' || status === 'paid') {
              return (
                <div className="bg-blue-600 border-2 border-blue-500 p-6 md:p-8 rounded-[2rem] flex flex-col gap-8 relative overflow-hidden text-white shadow-lg">
                   <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                   <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                           <span className="material-symbols-outlined">manufacturing</span>
                        </div>
                        <div>
                          <h4 className="font-heading font-black uppercase tracking-tight text-xl">Đang xử lý đơn hàng</h4>
                          <p className="text-blue-100 text-sm mt-1">Cửa hàng đang kiểm tra xe, chuẩn bị hồ sơ và các thủ tục cần thiết.</p>
                        </div>
                      </div>
                      <button className="hidden md:flex px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] transition-colors whitespace-nowrap">Liên hệ hỗ trợ</button>
                   </div>
                   {/* Stepper */}
                   <div className="flex items-center justify-between mt-2 mx-auto w-full max-w-2xl relative z-10">
                      <div className="absolute top-5 left-4 right-4 h-[2px] bg-blue-400/50 -z-10"></div>
                      <div className="flex flex-col items-center gap-3 relative z-10">
                         <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold shadow-md">✓</div>
                         <span className="text-[10px] uppercase font-heading tracking-widest font-bold text-blue-100">Thanh toán</span>
                      </div>
                      <div className="flex flex-col items-center gap-3 relative z-10">
                         <div className="w-10 h-10 rounded-full bg-blue-400 text-white border-2 border-white flex items-center justify-center font-bold shadow-md animate-pulse">2</div>
                         <span className="text-[10px] uppercase font-heading tracking-widest font-bold text-white">Xử lý</span>
                      </div>
                      <div className="flex flex-col items-center gap-3 relative z-10">
                         <div className="w-10 h-10 rounded-full bg-blue-800 text-blue-400 flex items-center justify-center font-bold">3</div>
                         <span className="text-[10px] uppercase font-heading tracking-widest font-bold text-blue-300">Giao hàng</span>
                      </div>
                   </div>
                </div>
              );
            } else if (status === 'shipping') {
              return (
                <div className="bg-indigo-600 border-2 border-indigo-500 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden text-white shadow-lg">
                  <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                       <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    <div>
                       <h4 className="font-heading font-black uppercase tracking-tight text-xl">Đang giao hàng</h4>
                       <p className="text-indigo-100 text-sm mt-1">Đơn vị vận chuyển: Gia Phát Logistics • Vận đơn: GP-{viewingOrder.orderId}89</p>
                    </div>
                  </div>
                  <button className="w-full md:w-auto px-6 py-3.5 bg-white text-indigo-600 hover:bg-gray-50 rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] shadow-lg transition-colors relative z-10">Theo dõi hành trình</button>
                </div>
              );
            } else if (status === 'completed' || status === 'delivered') {
              return (
                <div className="bg-green-600 border-2 border-green-500 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden text-white shadow-lg">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-white text-green-600 flex items-center justify-center shrink-0 shadow-sm">
                       <span className="material-symbols-outlined text-2xl">verified</span>
                    </div>
                    <div>
                       <h4 className="font-heading font-black uppercase tracking-tight text-xl">Giao hàng thành công</h4>
                       <p className="text-green-100 text-sm mt-1">Chúc mừng bạn đã nhận xe thành công! Cảm ơn bạn đã tin tưởng Gia Phát.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto relative z-10">
                    <button className="flex-1 md:flex-none px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] transition-colors whitespace-nowrap border border-white/30">Mua phụ kiện</button>
                    <button className="flex-1 md:flex-none px-6 py-3 bg-white text-green-700 hover:bg-gray-50 rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] shadow-lg transition-colors whitespace-nowrap">Đánh giá ngay</button>
                  </div>
                </div>
              );
            } else if (status === 'cancelled') {
              return (
                <div className="bg-gray-100 border border-gray-200 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined">cancel</span>
                    </div>
                    <div>
                      <h4 className="font-heading font-black uppercase tracking-tight text-xl text-gray-600">Đơn hàng đã hủy</h4>
                      <p className="text-gray-500 text-sm mt-1">Cảm ơn bạn đã quan tâm. Hẹn gặp lại bạn lần sau!</p>
                    </div>
                  </div>
                  <button className="w-full md:w-auto px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] transition-colors shadow-lg">Mua lại ngay</button>
                </div>
              );
            }
            return null;
          })()}

          {/* Fixed Information - Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Shipping Info */}
             <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 flex flex-col h-full shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 text-gray-50 pointer-events-none group-hover:text-primary/5 transition-colors">
                   <span className="material-symbols-outlined text-[120px]">location_on</span>
                </div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h4 className="font-heading font-black uppercase tracking-tight text-[#1a1c1b] text-lg flex items-center gap-2">
                    Giao hàng tới
                  </h4>
                  {(viewingOrder.status?.toLowerCase() !== 'cancelled' && viewingOrder.status?.toLowerCase() !== 'completed' && viewingOrder.status?.toLowerCase() !== 'delivered') && (
                    <button 
                      onClick={() => {
                        setSelectedOrder(viewingOrder);
                        setAddress(viewingOrder.address || '');
                        setPhone(viewingOrder.phoneNumber || '');
                      }} 
                      className="text-primary text-[10px] font-heading font-bold uppercase tracking-widest hover:underline bg-primary/10 px-4 py-2 rounded-full transition-colors hover:bg-primary/20"
                    >
                      Thay đổi
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4 relative z-10">
                  <div>
                    <p className="text-gray-400 font-heading font-bold uppercase tracking-widest text-[10px] mb-1">Số điện thoại liên hệ</p>
                    <p className="text-[#1a1c1b] font-bold text-lg">{viewingOrder.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-heading font-bold uppercase tracking-widest text-[10px] mb-1">Địa chỉ nhận xe</p>
                    <p className="text-[#1a1c1b] font-medium leading-relaxed">{viewingOrder.address || 'N/A'}</p>
                  </div>
                </div>
             </div>
             
             {/* Order Summary */}
             <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 flex flex-col h-full shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 text-gray-50 pointer-events-none group-hover:text-primary/5 transition-colors">
                   <span className="material-symbols-outlined text-[120px]">request_quote</span>
                </div>
                <h4 className="font-heading font-black uppercase tracking-tight text-[#1a1c1b] text-lg mb-6 relative z-10">
                  Tóm tắt thanh toán
                </h4>
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Tạm tính:</span>
                    <span className="font-bold text-[#1a1c1b]">{viewingOrder.originalAmount?.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {viewingOrder.discountAmount ? (
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-sm">Khuyến mãi:</span>
                      <span className="font-bold text-green-600">-{viewingOrder.discountAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Phí giao xe / Giấy tờ:</span>
                    <span className="font-bold text-[#1a1c1b]">{(30000).toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
                <div className="flex justify-between items-end border-t-2 border-dashed border-gray-100 pt-5 mt-auto relative z-10">
                  <span className="font-heading font-bold uppercase tracking-widest text-xs text-gray-400">Tổng cộng</span>
                  <span className="font-heading font-black text-primary text-3xl tracking-tight leading-none">{viewingOrder.totalAmount?.toLocaleString('vi-VN')} ₫</span>
                </div>
             </div>
          </div>

          {/* Product Items List */}
          <div>
            <h4 className="font-heading font-black uppercase tracking-tight text-[#1a1c1b] text-xl mb-6">Sản phẩm đã chọn</h4>
            <div className="grid grid-cols-1 gap-4">
              {viewingOrder.orderItems?.map((item, idx) => {
                const imgUrl = item.imageUrl && item.imageUrl.length > 0 ? item.imageUrl[0] : "https://via.placeholder.com/150";
                return (
                  <div key={idx} className="bg-white border border-gray-100 p-4 md:p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 hover:shadow-md transition-all group">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-50 p-2 shrink-0 border border-gray-100 overflow-hidden">
                      <img loading="lazy" decoding="async" src={imgUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-grow text-center sm:text-left min-w-0">
                      <h5 className="font-heading font-black text-lg text-[#1a1c1b] line-clamp-2 leading-tight tracking-tight mb-2 uppercase">{item.name}</h5>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{item.colorName}</span>
                    </div>
                    <div className="text-center sm:text-right shrink-0 mt-4 sm:mt-0">
                      <p className="font-heading font-black text-xl text-primary">{item.unitPriceAtPurchase?.toLocaleString('vi-VN')} ₫</p>
                      <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-400 mt-2">Số lượng: <span className="text-[#1a1c1b]">{item.quantity}</span></p>
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="font-heading font-black uppercase tracking-tight text-[#1a1c1b] text-xl flex items-center gap-3 relative z-10">
            <span className="material-symbols-outlined text-primary text-3xl">pin_drop</span>
            Ghim vị trí giao hàng
          </h3>
          <button type="button" onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-red-500 transition-colors w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-red-50 rounded-full relative z-10">
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
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 text-white flex items-center gap-3 pointer-events-none animate-bounce">
            <span className="material-symbols-outlined text-yellow-400">touch_app</span>
            <span className="font-heading font-bold uppercase tracking-widest text-[11px]">Chạm vào bản đồ để chọn vị trí</span>
          </div>
        </div>
        
        <div className="px-8 py-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-end gap-3 shrink-0">
           <button 
             type="button"
             onClick={() => setShowMapModal(false)}
             className="px-8 py-3.5 bg-white border border-gray-200 text-[#1a1c1b] rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto text-center"
           >
             Đóng bản đồ
           </button>
           <button 
             type="button"
             disabled={!tempPosition || isGeocoding}
             onClick={confirmMapLocation}
             className="px-8 py-3.5 bg-primary text-white rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
           >
             {isGeocoding ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : null}
             Xác nhận vị trí này
           </button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};

export default PurchasePage;
