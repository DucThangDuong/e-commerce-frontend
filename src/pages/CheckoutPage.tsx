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
      <div className="pt-[56px] min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#a63b00]"></div>
      </div>
    );
  }

  return (
    <div className="pt-[56px] bg-gray-50 font-sans text-[#1a1c1b] min-h-screen flex flex-col overflow-x-hidden">
      <main className="flex-grow container mx-auto py-8 md:py-12 px-4 max-w-7xl">
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1c1b] mb-2 tracking-tight">Thanh toán</h1>
          <p className="text-[#594138] text-sm">Vui lòng kiểm tra lại thông tin và xác nhận đơn hàng của bạn.</p>
        </div>

        <form onSubmit={handleCheckout} className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
          
          {/* Left Column */}
          <div className="w-full lg:w-3/5 flex flex-col gap-6 lg:gap-10">
            
            {/* 1. Kiểm tra đơn hàng */}
            <section>
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
                <span className="material-symbols-outlined text-[#a63b00]">shopping_cart</span>
                <h3 className="text-xl font-bold tracking-tight m-0">Kiểm tra đơn hàng</h3>
              </div>
              <div className="flex flex-col gap-4">
                {checkoutItems.map(item => {
                  const imgUrl = item.imageUrl && item.imageUrl.length > 0 ? item.imageUrl[0] : "https://via.placeholder.com/150";
                  
                  // Use validated price if available
                  const validatedItem = validatedOrder?.items.find(v => v.colorId === item.colorId);
                  const price = validatedItem ? validatedItem.unitPrice : item.discountedPrice;
                  const lineTotal = validatedItem ? validatedItem.lineTotal : (price * item.quantity);

                  return (
                    <div key={item.cartId} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 w-20 h-20 border border-gray-100">
                        <img loading="lazy" decoding="async" src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-[#1a1c1b] text-sm mb-1 truncate">{item.name} - {item.colorName}</h4>
                        <p className="text-[#594138] text-xs">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="font-bold text-[#a63b00] text-sm flex-shrink-0">
                        {lineTotal.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. Thông tin giao hàng */}
            <section>
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
                <span className="material-symbols-outlined text-[#a63b00]">location_on</span>
                <h3 className="text-xl font-bold tracking-tight m-0">Thông tin giao hàng</h3>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider">Địa chỉ</label>
                    <button type="button" onClick={() => { setTempPosition(mapPosition ? new L.LatLng(mapPosition[0], mapPosition[1]) : null); setShowMapModal(true); }} className="text-[#a63b00] text-xs font-bold hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">map</span>
                      Mở bản đồ
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
                      className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.address && touched.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 focus:ring-[#a63b00] focus:border-[#a63b00]'} focus:ring-2 outline-none transition-all`}
                      placeholder="123 Đường Lê Lợi, Quận 1, TP. HCM"
                    />
                    
                    {mapPosition && (
                      <div className="w-full h-40 rounded-xl overflow-hidden border border-gray-200 relative shadow-sm pointer-events-none">
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
                  {fieldErrors.address && touched.address && (
                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1 animate-fade-in-down">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {fieldErrors.address}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider mb-2">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (touched.phone) validateField('phone', e.target.value);
                    }}
                    onBlur={() => handleBlur('phone', phone)}
                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.phone && touched.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 focus:ring-[#a63b00] focus:border-[#a63b00]'} focus:ring-2 outline-none transition-all`}
                    placeholder="0901234567"
                  />
                  {fieldErrors.phone && touched.phone && (
                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1 animate-fade-in-down">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Phương thức thanh toán */}
            <section>
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
                <span className="material-symbols-outlined text-[#a63b00]">payments</span>
                <h3 className="text-xl font-bold tracking-tight m-0">Phương thức thanh toán</h3>
              </div>
              <div className="flex flex-col gap-4">
                
                {/* COD */}
                <label className="relative cursor-pointer mb-0">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="cod" 
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="peer hidden"
                  />
                  <div className="flex items-center p-4 border-2 rounded-2xl bg-white transition-all peer-checked:border-[#a63b00] peer-checked:bg-orange-50/30 border-gray-200">
                    <div className="flex-grow flex items-center gap-4">
                      <span className="material-symbols-outlined text-gray-400 peer-checked:text-[#a63b00] text-3xl">payments</span>
                      <div>
                        <span className="block font-bold text-[#1a1c1b] text-sm">Tiền mặt</span>
                        <span className="block text-[#594138] text-xs mt-0.5">Thanh toán khi nhận xe (COD)</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#a63b00]' : 'border-gray-300'}`}>
                      {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[#a63b00]"></div>}
                    </div>
                  </div>
                </label>

                {/* VNPAY */}
                <label className="relative cursor-pointer mb-0">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="vnpay" 
                    checked={paymentMethod === 'vnpay'}
                    onChange={() => setPaymentMethod('vnpay')}
                    className="peer hidden"
                  />
                  <div className="flex items-center p-4 border-2 rounded-2xl bg-white transition-all peer-checked:border-[#a63b00] peer-checked:bg-orange-50/30 border-gray-200">
                    <div className="flex-grow flex items-center gap-4">
                      <span className="material-symbols-outlined text-gray-400 peer-checked:text-[#a63b00] text-3xl">account_balance</span>
                      <div>
                        <span className="block font-bold text-[#1a1c1b] text-sm">Chuyển khoản (VNPAY)</span>
                        <span className="block text-[#594138] text-xs mt-0.5">Thanh toán an toàn qua cổng VNPAY</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'vnpay' ? 'border-[#a63b00]' : 'border-gray-300'}`}>
                      {paymentMethod === 'vnpay' && <div className="w-2.5 h-2.5 rounded-full bg-[#a63b00]"></div>}
                    </div>
                  </div>
                </label>

                {/* VNPAY Notice */}
                {paymentMethod === 'vnpay' && (
                  <div className="p-4 border rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 mt-2 bg-blue-50 border-blue-100 animate-fade-in-down">
                    <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 w-16 h-16">
                      <img loading="lazy" decoding="async" src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" alt="VNPAY Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center md:text-left">
                      <h4 className="font-bold text-[#1a1c1b] text-sm m-0">Thanh toán trực tuyến an toàn</h4>
                      <p className="text-[#594138] text-xs mt-1.5 leading-relaxed">
                        Sau khi nhấn <strong>"Xác nhận đặt hàng"</strong>, hệ thống sẽ tự động chuyển hướng bạn qua cổng thanh toán <strong>VNPAY</strong> để hoàn tất.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Summary */}
          <div className="w-full lg:w-2/5 sticky top-24">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6">
              
              {/* Mã giảm giá */}
              <div className="flex flex-col gap-2">
                <label className="text-[#594138] font-bold uppercase text-[0.65rem] tracking-wider">Mã giảm giá</label>
                <div className="flex gap-2 w-full">
                  <select 
                    value={selectedCoupon}
                    onChange={e => {
                      setSelectedCoupon(e.target.value);
                      setCouponError('');
                    }}
                    className="min-w-0 flex-1 px-3 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#a63b00] focus:border-[#a63b00] outline-none text-sm bg-white cursor-pointer truncate"
                  >
                    <option value="">-- Chọn mã giảm giá --</option>
                    {coupons.map(coupon => (
                      <option key={coupon.code} value={coupon.code} title={`${coupon.name} (Giảm ${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('vi-VN')}đ`})`}>
                        {coupon.name} (Giảm {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('vi-VN')}đ`})
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !selectedCoupon}
                    className="flex-shrink-0 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? 'Đang xử lý...' : 'Áp dụng'}
                  </button>
                </div>
                {couponError && (
                  <div className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1 animate-fade-in-down">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {couponError}
                  </div>
                )}
              </div>

              {/* Thông tin mã đã áp dụng */}
              {appliedCouponInfo && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-2xl animate-fade-in-down">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-600 text-lg">local_offer</span>
                    <span className="font-bold text-[#1a1c1b] text-sm uppercase">{appliedCouponInfo.couponCode}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-[#594138]">
                    <div className="flex justify-between">
                      <span className="font-medium">Mã ưu đãi:</span>
                      <span>{appliedCouponInfo.couponName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Được giảm:</span>
                      <span className="font-bold text-green-600">
                        -{appliedCouponInfo.discountAmount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tính tiền */}
              <div className="flex flex-col gap-4 text-sm mt-2">
                <div className="flex justify-between text-[#594138]">
                  <span>Tạm tính</span>
                  <span className="font-medium text-[#1a1c1b]">{subtotal.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                {appliedCouponInfo && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span className="font-bold">-{appliedCouponInfo.discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                )}
                <div className="flex justify-between text-[#594138]">
                  <span>Phí vận chuyển</span>
                  {shippingFee === 0 ? (
                    <span className="text-green-600 font-bold">Miễn phí</span>
                  ) : (
                    <span className="font-medium text-[#1a1c1b]">{shippingFee.toLocaleString('vi-VN')} VNĐ</span>
                  )}
                </div>
                <div className="flex justify-between text-[#594138]">
                  <span>Thuế ước tính</span>
                  <span className="font-medium text-[#1a1c1b]">0 VNĐ</span>
                </div>

                <hr className="border-gray-100 my-2" />

                <div className="flex justify-between items-center">
                  <span className="text-[#1a1c1b] font-bold text-base">Tổng cộng</span>
                  <span className="text-[#a63b00] font-bold text-2xl">{grandTotal.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#a63b00] text-white py-4 rounded-xl font-bold shadow-sm hover:bg-[#8a3100] transition-colors flex justify-center items-center gap-2 mt-2">
                <span>Xác nhận đặt hàng</span>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </div>
          </div>

        </form>
      </main>

      {/* Map Picker Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
                center={tempPosition || [10.8231, 106.6297]} // Default to Ho Chi Minh City
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

      {/* Center Success Toast */}
      {showSuccess && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-8 py-6 rounded-2xl shadow-2xl z-[9999] flex flex-col items-center gap-3 transition-opacity duration-1000 ${fadeSuccess ? 'opacity-0' : 'opacity-100'}`}>
          <span className="material-symbols-outlined text-6xl text-green-400">check_circle</span>
          <span className="font-bold text-xl tracking-tight">Đặt hàng thành công!</span>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
