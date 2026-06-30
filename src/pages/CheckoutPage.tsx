import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import { useStore } from '../zustand/store';
import type { ResCartDto } from '../interfaces/cart';
import type { ValidateCartResponse, ActiveCouponResponse, ApplyCouponResponse } from '../interfaces/order';

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

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cartIdsParam = searchParams.get('cartIds');
  const navigate = useNavigate();
  const { isLogin, user, showNotification } = useStore();

  const [checkoutItems, setCheckoutItems] = useState<ResCartDto[]>([]);
  const [validatedOrder, setValidatedOrder] = useState<ValidateCartResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Coupon states
  const [coupons, setCoupons] = useState<ActiveCouponResponse[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [appliedCouponInfo, setAppliedCouponInfo] = useState<ApplyCouponResponse | null>(null);

  // Map Picker State
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
        if (touched.address) validateField('address', data.display_name);
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
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [fadeSuccess, setFadeSuccess] = useState(false);
  const successTimeout1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeout2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form states
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (user) {
      if (user.address && !address) setAddress(user.address);
      if (user.phoneNumber && !phone) setPhone(user.phoneNumber);
    }
  }, [user]);

  // Validation states
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = (field: string, value: string) => {
    let error = '';
    if (field === 'address') {
      if (!value.trim()) {
        error = 'Vui lòng nhập địa chỉ';
      }
    } else if (field === 'phone') {
      if (!value.trim()) {
        error = 'Vui lòng nhập số điện thoại';
      } else {
        const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
        if (!phoneRegex.test(value.trim())) {
          error = 'Số điện thoại không hợp lệ (10 số, bắt đầu 03,05,07,08,09)';
        }
      }
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  // Summary states
  const subtotal = validatedOrder ? validatedOrder.subTotal : checkoutItems.reduce((acc, item) => {
    return acc + item.discountedPrice * item.quantity;
  }, 0);
  const shippingFee = subtotal > 0 ? 30000 : 0;
  
  // Calculate Grand Total
  let finalSubtotal = subtotal;
  
  if (appliedCouponInfo) {
    finalSubtotal = appliedCouponInfo.finalAmount;
  }
  
  const grandTotal = finalSubtotal + shippingFee;

  useEffect(() => {
    if (!isLogin) {
      showNotification('Vui lòng đăng nhập để thanh toán', 'warning');
      navigate('/login');
      return;
    }

    if (!cartIdsParam) {
      navigate('/cart');
      return;
    }

    const fetchCheckoutData = async () => {
      try {
        setLoading(true);
        
        // Fetch active coupons
        try {
          const couponRes = await apiClient.get<any>('/coupons/active');
          const couponData = couponRes?.data || [];
          if (Array.isArray(couponData)) {
            setCoupons(couponData);
          }
        } catch (couponErr) {
          console.error('Failed to fetch coupons', couponErr);
        }

        // Lấy giỏ hàng và lọc theo cartIds được truyền từ URL
        const res = await apiClient.get<ApiResponse<ResCartDto[]>>('/cart');
        if (res && res.data) {
          const ids = cartIdsParam.split(',').map(Number);
          const selected = res.data.filter(item => ids.includes(item.cartId));
          if (selected.length === 0) {
            navigate('/cart');
            return;
          }
          setCheckoutItems(selected);

          const Items = selected.map(item => ({
            ColorId: item.colorId,
            Quantity: item.quantity
          }));
          
          try {
            const orderRes = await apiClient.post<ApiResponse<ValidateCartResponse>>('/order', { Items });
            if (orderRes && orderRes.data) {
              setValidatedOrder(orderRes.data);
            }
          } catch (validateErr) {
                showNotification('Có lỗi khi kiểm tra giá từ máy chủ!', 'warning');
          }
        }
      } catch (err) {
        console.error(err);
        showNotification('Không thể tải thông tin đơn hàng', 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [cartIdsParam, isLogin, navigate, showNotification]);

  const handleApplyCoupon = async () => {
    if (!selectedCoupon) return;
    
    try {
      setCouponLoading(true);
      setCouponError('');
      const payload = {
        CouponCode: selectedCoupon,
        Items: checkoutItems.map(item => ({
          ColorId: item.colorId,
          Quantity: item.quantity
        }))
      };
      
      const res = await apiClient.post<any>('/coupons/apply', payload);
      const data = res.data?.data || res.data;
      if (data && data.finalAmount !== undefined) {
         setAppliedCouponInfo(data);
         showNotification('Áp dụng mã giảm giá thành công!', 'success');
      } else {
         showNotification('Không thể áp dụng mã giảm giá', 'warning');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
      setCouponError(errorMsg);
      setAppliedCouponInfo(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ address: true, phone: true });
    const isAddressValid = validateField('address', address);
    const isPhoneValid = validateField('phone', phone);
    
    if (!isAddressValid || !isPhoneValid) {
      showNotification('Vui lòng kiểm tra lại thông tin giao hàng', 'warning');
      return;
    }

    try {
      const isVnpay = paymentMethod === 'vnpay';
      
      const payload = {
        Items: checkoutItems.map(item => ({
          ColorId: item.colorId,
          Quantity: item.quantity
        })),
        OrderDescription: 'Thanh toan don hang',
        FullName: 'thang', 
        Address: address,
        PhoneNumber: phone,
        TypePayment: isVnpay ? 1 : 0,
        ...(appliedCouponInfo ? { CouponCode: appliedCouponInfo.couponCode } : {})
      };

      // Nếu VNPAY, thêm Idempotency-Key header
      const headers: Record<string, string> = {};
      if (isVnpay) {
        headers['Idempotency-Key'] = typeof crypto.randomUUID === 'function' 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
      console.log(headers);
      const res = await apiClient.postWithHeaders<any>('/order/create-payment', payload, { headers });
      const data = res.data?.data || res.data;

      if (isVnpay && data?.paymentUrl) {
        // Chuyển hướng sang trang thanh toán VNPAY
        showNotification(data.message || 'Đang chuyển hướng đến VNPAY...', 'success');
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 500);
      } else {
        // COD - Đặt hàng thành công
        if (successTimeout1.current) clearTimeout(successTimeout1.current);
        if (successTimeout2.current) clearTimeout(successTimeout2.current);

        setShowSuccess(true);
        setFadeSuccess(false);
        successTimeout1.current = setTimeout(() => setFadeSuccess(true), 1500);
        successTimeout2.current = setTimeout(() => {
          setShowSuccess(false);
          navigate('/cart');
        }, 2500);
      }

    } catch (err: any) {
      console.error('Lỗi khi gọi API đặt hàng:', err);
      const apiErrors = err.response?.data?.Errors || err.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors)) {
        const newErrors: { [key: string]: string } = {};
        apiErrors.forEach((errItem: any) => {
          const field = errItem.field || errItem.name || errItem.Key || errItem.propertyName;
          const msg = errItem.message || errItem.Message || errItem.Value || errItem.errorMessage;
          if (field) {
            const key = field.toLowerCase();
            // Map API fields to UI fields
            if (key.includes('address')) newErrors.address = msg;
            else if (key.includes('phone')) newErrors.phone = msg;
            else newErrors[key] = msg;
          }
        });
        
        if (Object.keys(newErrors).length > 0) {
          setFieldErrors(prev => ({ ...prev, ...newErrors }));
          setTouched(prev => ({ ...prev, address: true, phone: true }));
          showNotification('Vui lòng kiểm tra lại các trường bị lỗi!', 'danger');
          return;
        }
      }
      
      showNotification(err.response?.data?.message || err.message || 'Đặt hàng thất bại!', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="pt-[80px] min-h-screen bg-[#f9f9f7] flex items-center justify-center">
        <div className="bg-white rounded-[2rem] p-20 flex justify-center items-center shadow-sm border border-gray-100">
           <div className="relative w-20 h-20">
             <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[80px] bg-[#f9f9f7] font-sans text-[#1a1c1b] min-h-screen flex flex-col overflow-x-hidden relative pb-20">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent pointer-events-none"></div>
      
      <main className="flex-grow container mx-auto py-8 md:py-12 px-4 max-w-7xl relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
             <span className="material-symbols-outlined text-[32px] text-primary drop-shadow-sm">local_shipping</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-heading font-black text-[#1a1c1b] tracking-tight uppercase">Thanh toán</h1>
            <p className="text-gray-500 text-sm md:text-base mt-2 max-w-2xl">Vui lòng kiểm tra lại thông tin và xác nhận đơn hàng của bạn.</p>
          </div>
        </header>

        <form onSubmit={handleCheckout} className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column */}
          <div className="w-full lg:w-3/5 flex flex-col gap-8">
            
            {/* 1. Kiểm tra đơn hàng */}
            <section className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">shopping_cart</span>
                <h3 className="text-xl font-heading font-black uppercase tracking-tight m-0">Đơn hàng của bạn</h3>
              </div>
              <div className="flex flex-col gap-4">
                {checkoutItems.map(item => {
                  const imgUrl = item.imageUrl && item.imageUrl.length > 0 ? item.imageUrl[0] : "https://via.placeholder.com/150";
                  
                  // Use validated price if available
                  const validatedItem = validatedOrder?.items.find(v => v.colorId === item.colorId);
                  const price = validatedItem ? validatedItem.unitPrice : item.discountedPrice;
                  const lineTotal = validatedItem ? validatedItem.lineTotal : (price * item.quantity);

                  return (
                    <div key={item.cartId} className="flex items-center gap-6 p-4 rounded-2xl border-2 border-gray-50 hover:border-gray-100 transition-colors group">
                      <div className="rounded-xl bg-gray-50 p-2 overflow-hidden flex-shrink-0 w-24 h-24 border border-gray-100 relative">
                        <img loading="lazy" decoding="async" src={imgUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-heading font-black text-[#1a1c1b] text-base mb-1 truncate uppercase">{item.name}</h4>
                        <div className="flex flex-col gap-1">
                          <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider w-fit">{item.colorName}</span>
                          <p className="text-gray-400 font-heading font-bold uppercase tracking-widest text-[10px] mt-1">Số lượng: <span className="text-[#1a1c1b]">{item.quantity}</span></p>
                        </div>
                      </div>
                      <div className="font-heading font-black text-primary text-lg flex-shrink-0 tracking-tight">
                        {lineTotal.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. Thông tin giao hàng */}
            <section className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 text-gray-50 pointer-events-none group-hover:text-primary/5 transition-colors">
                 <span className="material-symbols-outlined text-[150px]">location_on</span>
              </div>
              <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6 relative z-10">
                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
                <h3 className="text-xl font-heading font-black uppercase tracking-tight m-0">Thông tin giao hàng</h3>
              </div>
              <div className="flex flex-col gap-6 relative z-10">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest">Địa chỉ</label>
                    <button type="button" onClick={() => { setTempPosition(mapPosition ? new L.LatLng(mapPosition[0], mapPosition[1]) : null); setShowMapModal(true); }} className="text-primary text-[11px] font-heading font-bold uppercase tracking-wider hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[14px]">map</span> Mở bản đồ
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (touched.address) validateField('address', e.target.value);
                      }}
                      onBlur={() => handleBlur('address', address)}
                      className={`w-full px-5 py-4 rounded-xl border-2 ${fieldErrors.address && touched.address ? 'border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/50' : 'border-gray-100 focus:ring-4 focus:ring-primary/10 focus:border-primary'} outline-none transition-all text-sm font-medium hover:bg-white focus:bg-white ${(!fieldErrors.address && !touched.address) ? 'bg-gray-50/50' : ''}`}
                      placeholder="123 Đường Lê Lợi, Quận 1, TP. HCM"
                    />
                    
                    {mapPosition && (
                      <div className="w-full h-40 rounded-xl overflow-hidden border-2 border-primary/20 relative shadow-sm pointer-events-none">
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
                  {fieldErrors.address && touched.address && (
                    <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {fieldErrors.address}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest mb-3">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (touched.phone) validateField('phone', e.target.value);
                    }}
                    onBlur={() => handleBlur('phone', phone)}
                    className={`w-full px-5 py-4 rounded-xl border-2 ${fieldErrors.phone && touched.phone ? 'border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/50' : 'border-gray-100 focus:ring-4 focus:ring-primary/10 focus:border-primary'} outline-none transition-all text-sm font-medium hover:bg-white focus:bg-white ${(!fieldErrors.phone && !touched.phone) ? 'bg-gray-50/50' : ''}`}
                    placeholder="0901234567"
                  />
                  {fieldErrors.phone && touched.phone && (
                    <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Phương thức thanh toán */}
            <section className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">payments</span>
                <h3 className="text-xl font-heading font-black uppercase tracking-tight m-0">Phương thức thanh toán</h3>
              </div>
              <div className="flex flex-col gap-4">
                
                {/* COD */}
                <label className="relative cursor-pointer mb-0 group">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="cod" 
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="peer hidden"
                  />
                  <div className="flex items-center p-5 border-2 rounded-2xl bg-white transition-all peer-checked:border-primary peer-checked:bg-primary/5 border-gray-100 group-hover:border-gray-200 shadow-sm">
                    <div className="flex-grow flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center peer-checked:bg-primary/10 peer-checked:text-primary text-gray-400 transition-colors">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                      </div>
                      <div>
                        <span className="block font-heading font-black text-[#1a1c1b] text-base uppercase">Tiền mặt</span>
                        <span className="block text-gray-500 text-xs mt-0.5 font-medium">Thanh toán khi nhận xe (COD)</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-white' : 'border-gray-300'}`}>
                      {paymentMethod === 'cod' && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                    </div>
                  </div>
                </label>

                {/* VNPAY */}
                <label className="relative cursor-pointer mb-0 group">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="vnpay" 
                    checked={paymentMethod === 'vnpay'}
                    onChange={() => setPaymentMethod('vnpay')}
                    className="peer hidden"
                  />
                  <div className="flex items-center p-5 border-2 rounded-2xl bg-white transition-all peer-checked:border-primary peer-checked:bg-primary/5 border-gray-100 group-hover:border-gray-200 shadow-sm">
                    <div className="flex-grow flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center peer-checked:bg-primary/10 peer-checked:text-primary text-gray-400 transition-colors">
                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                      </div>
                      <div>
                        <span className="block font-heading font-black text-[#1a1c1b] text-base uppercase">Chuyển khoản (VNPAY)</span>
                        <span className="block text-gray-500 text-xs mt-0.5 font-medium">Thanh toán an toàn qua cổng VNPAY</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'vnpay' ? 'border-primary bg-white' : 'border-gray-300'}`}>
                      {paymentMethod === 'vnpay' && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                    </div>
                  </div>
                </label>

                {/* VNPAY Notice */}
                {paymentMethod === 'vnpay' && (
                  <div className="p-5 border-2 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-5 mt-2 bg-blue-50/50 border-blue-100">
                    <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 w-20 h-20">
                      <img loading="lazy" decoding="async" src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" alt="VNPAY Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center md:text-left">
                      <h4 className="font-heading font-black text-[#1a1c1b] text-base m-0 uppercase">Thanh toán trực tuyến an toàn</h4>
                      <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                        Sau khi nhấn <strong>"Xác nhận đặt hàng"</strong>, hệ thống sẽ tự động chuyển hướng bạn qua cổng thanh toán <strong>VNPAY</strong> để hoàn tất giao dịch.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Summary */}
          <div className="w-full lg:w-2/5 sticky top-28">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-8 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 text-gray-50 pointer-events-none group-hover:text-primary/5 transition-colors">
                 <span className="material-symbols-outlined text-[150px]">request_quote</span>
              </div>
              
              <h4 className="font-heading font-black uppercase tracking-tight text-[#1a1c1b] text-xl relative z-10 m-0">
                Tóm tắt thanh toán
              </h4>

              {/* Mã giảm giá */}
              <div className="flex flex-col gap-3 relative z-10">
                <label className="text-gray-500 font-heading font-bold uppercase text-[11px] tracking-widest">Mã giảm giá</label>
                <div className="flex gap-3 w-full">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                      <span className="material-symbols-outlined text-xl">loyalty</span>
                    </div>
                    <select 
                      value={selectedCoupon}
                      onChange={e => {
                        setSelectedCoupon(e.target.value);
                        setCouponError('');
                      }}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-medium bg-gray-50/50 hover:bg-white focus:bg-white cursor-pointer truncate transition-all appearance-none"
                    >
                      <option value="">-- Chọn mã giảm giá --</option>
                      {coupons.map(coupon => (
                        <option key={coupon.code} value={coupon.code} title={`${coupon.name} (Giảm ${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('vi-VN')}đ`})`}>
                          {coupon.name} (Giảm {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('vi-VN')}đ`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !selectedCoupon}
                    className="flex-shrink-0 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {couponLoading ? 'Xử lý...' : 'Áp dụng'}
                  </button>
                </div>
                {couponError && (
                  <div className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {couponError}
                  </div>
                )}
              </div>

              {/* Thông tin mã đã áp dụng */}
              {appliedCouponInfo && (
                <div className="p-5 border-2 border-green-100 bg-green-50/50 rounded-2xl relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
                    <span className="font-heading font-black text-green-700 text-sm uppercase tracking-tight">{appliedCouponInfo.couponCode}</span>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Mã ưu đãi:</span>
                      <span className="font-bold text-[#1a1c1b]">{appliedCouponInfo.couponName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Được giảm:</span>
                      <span className="font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs">
                        -{appliedCouponInfo.discountAmount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tính tiền */}
              <div className="flex flex-col gap-4 text-sm mt-2 relative z-10">
                <div className="flex justify-between text-gray-500">
                  <span className="font-medium">Tạm tính</span>
                  <span className="font-bold text-[#1a1c1b]">{subtotal.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                {appliedCouponInfo && (
                  <div className="flex justify-between text-gray-500">
                    <span className="font-medium">Giảm giá</span>
                    <span className="font-bold text-green-600">-{appliedCouponInfo.discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span className="font-medium">Phí giao xe / Giấy tờ</span>
                  {shippingFee === 0 ? (
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">Miễn phí</span>
                  ) : (
                    <span className="font-bold text-[#1a1c1b]">{shippingFee.toLocaleString('vi-VN')} VNĐ</span>
                  )}
                </div>

                <div className="flex justify-between items-end border-t-2 border-dashed border-gray-100 pt-6 mt-2 relative z-10">
                  <span className="font-heading font-bold uppercase tracking-widest text-xs text-gray-400">Tổng cộng</span>
                  <span className="font-heading font-black text-primary text-3xl tracking-tight leading-none">{grandTotal.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              <button type="submit" className="w-full bg-primary text-white py-5 rounded-2xl font-heading font-black uppercase tracking-widest text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-primary-hover transition-all flex justify-center items-center gap-3 mt-6 relative z-10 group/btn">
                <span>Xác nhận đặt hàng</span>
                <span className="material-symbols-outlined text-2xl transition-transform group-hover/btn:translate-x-2">arrow_forward</span>
              </button>
            </div>
          </div>

        </form>
      </main>

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

      {/* Center Success Toast */}
      {showSuccess && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-10 py-10 rounded-[2rem] shadow-2xl z-[9999] flex flex-col items-center gap-4 transition-opacity duration-1000 border border-gray-100 ${fadeSuccess ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center relative z-10 border-4 border-green-100">
            <span className="material-symbols-outlined text-[64px] text-green-500">check_circle</span>
          </div>
          <span className="font-heading font-black text-[#1a1c1b] text-2xl tracking-tight uppercase relative z-10">Đặt hàng thành công!</span>
          <p className="text-gray-500 text-sm relative z-10">Hệ thống đang chuyển bạn về giỏ hàng...</p>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
