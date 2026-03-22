import React from 'react';
import DashboardLayout from '../layouts/HomeLayout';
import { useLocation, Navigate } from 'react-router-dom';
import type { CartItemType } from '../interfaces/cart';

const CheckoutPage: React.FC = () => {
    const location = useLocation();
    const state = location.state as { selectedItems?: CartItemType[], subtotal?: number, shipping?: number, tax?: number } | null;

    if (!state || !state.selectedItems || state.selectedItems.length === 0) {
        return <Navigate to="/cart" replace />;
    }

    const { selectedItems, subtotal = 0, shipping = 0, tax = 0 } = state;
    const total = subtotal + shipping + tax;

    return (
        <DashboardLayout>
            <div className="bg-background-light font-display text-slate-900 min-h-screen">
                <main className="flex-1 flex flex-col items-center py-10 px-4 md:px-0">
                    <div className="w-full max-w-7xl flex flex-col gap-10 mx-auto">
                        {/* Page Title */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-slate-900 text-3xl font-extrabold tracking-tight">Thanh toán
                            </h1>
                            <p className="text-slate-500 text-sm">Vui lòng kiểm tra lại thông tin và xác nhận đơn hàng của bạn.</p>
                        </div>

                        {/* Checkout Content */}
                        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">

                            <div className="lg:col-span-7 flex flex-col gap-10">
                                {/* Section 1: Review Items */}
                                <section className="flex flex-col gap-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                                        <span className="material-symbols-outlined text-primary">shopping_cart</span>
                                        <h3 className="text-lg font-bold text-slate-900">Kiểm tra đơn hàng</h3>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {selectedItems.map((item) => (
                                            <div key={item.productId} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100">
                                                <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                                    <img alt={item.name} className="w-full h-full object-cover" src={item.imageUrl?.[0] || 'https://via.placeholder.com/150'} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                                                    <p className="text-xs text-slate-500">Số lượng: {item.quantity}</p>
                                                </div>
                                                <div className="text-sm font-bold text-slate-900">{item.basePrice.toLocaleString('vi-VN')} VNĐ</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Section 2: Contact & Shipping */}
                                <section className="flex flex-col gap-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                                        <span className="material-symbols-outlined text-primary">location_on</span>
                                        <h3 className="text-lg font-bold text-slate-900">Thông tin giao hàng</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Địa chỉ</label>
                                            <input className="w-full rounded-lg border-slate-200 bg-white text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary px-4 py-3 text-sm placeholder:text-slate-400" placeholder="123 Đường Lê Lợi, Quận 1, TP. HCM" type="text" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Số điện thoại</label>
                                            <input className="w-full rounded-lg border-slate-200 bg-white text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary px-4 py-3 text-sm placeholder:text-slate-400" placeholder="090 123 4567" type="tel" />
                                        </div>
                                    </div>
                                </section>

                                {/* Section 3: Payment Method */}
                                <section className="flex flex-col gap-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                                        <span className="material-symbols-outlined text-primary">payments</span>
                                        <h3 className="text-lg font-bold text-slate-900">Phương thức thanh toán</h3>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {/* Cash Option */}
                                        <label className="relative flex items-center p-4 border border-primary bg-primary/5 rounded-xl cursor-pointer">
                                            <input defaultChecked className="hidden" name="payment" type="radio" value="cod" />
                                            <div className="flex-1 flex items-center gap-4">
                                                <span className="material-symbols-outlined text-slate-700">payments</span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900">Tiền mặt</span>
                                                    <span className="text-xs text-slate-500">Thanh toán khi nhận hàng (COD)</span>
                                                </div>
                                            </div>
                                            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                                            </div>
                                        </label>

                                        {/* Bank Transfer Option */}
                                        <label className="relative flex items-center p-4 border border-slate-200 bg-white rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                                            <input className="hidden" name="payment" type="radio" value="bank" />
                                            <div className="flex-1 flex items-center gap-4">
                                                <span className="material-symbols-outlined text-slate-400">account_balance</span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700">Chuyển khoản</span>
                                                    <span className="text-xs text-slate-500">Chuyển khoản qua ngân hàng hoặc ví điện tử</span>
                                                </div>
                                            </div>
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>
                                        </label>
                                    </div>
                                </section>
                            </div>
                            {/* Order Summary & CTA */}
                            <section className="lg:col-span-5 lg:sticky lg:top-28 mt-4 lg:mt-0 flex flex-col gap-6 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex flex-col gap-3 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Tạm tính</span>
                                        <span>{subtotal.toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Phí vận chuyển</span>
                                        <span className="text-emerald-600 font-medium">{shipping === 0 ? "Miễn phí" : `${shipping.toLocaleString('vi-VN')} VNĐ`}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Thuế ước tính</span>
                                        <span>{tax.toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-2"></div>
                                    <div className="flex justify-between text-xl font-black text-slate-900">
                                        <span>Tổng cộng</span>
                                        <span>{total.toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                </div>
                                <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group">
                                    <span>Xác nhận đặt hàng</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                                <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">Thanh toán an toàn &amp; bảo mật
                                </p>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
};

export default CheckoutPage;
