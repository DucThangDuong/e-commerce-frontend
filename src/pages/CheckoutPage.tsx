import React, { useState, useCallback } from "react";
import DashboardLayout from "../layouts/HomeLayout";
import { useLocation, useNavigate } from "react-router-dom";
import type { CartItemType } from "../interfaces/cart";
import { useStore } from "../zustand/store";
import { apiClient } from "../untils/apiClient";

// ── Validation helpers ──────────────────────────────────────────
const PHONE_REGEX = /^(0[2-9])\d{7,9}$/; // Vietnamese phone: starts with 0x, 9-11 digits

interface FieldErrors {
  address?: string;
  phone?: string;
  items?: string;
}

const validate = (
  address: string,
  phone: string,
  items: CartItemType[],
): FieldErrors => {
  const errors: FieldErrors = {};

  // Address
  const trimmedAddress = address.trim();
  if (!trimmedAddress) {
    errors.address = "Vui lòng nhập địa chỉ giao hàng.";
  } else if (trimmedAddress.length < 5) {
    errors.address = "Địa chỉ phải có ít nhất 5 ký tự.";
  }

  // Phone
  const digits = phone.replace(/[\s\-().]/g, "");
  if (!digits) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!PHONE_REGEX.test(digits)) {
    errors.phone = "Số điện thoại không hợp lệ (VD: 0901234567).";
  }

  // Items
  if (!items || items.length === 0) {
    errors.items = "Đơn hàng không có sản phẩm nào.";
  } else {
    const invalidItem = items.find((i) => i.quantity <= 0);
    if (invalidItem) {
      errors.items = `Sản phẩm "${invalidItem.name}" có số lượng không hợp lệ (phải > 0).`;
    }
  }

  return errors;
};

// ── Component ───────────────────────────────────────────────────
const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const showNotification = useStore((state) => state.showNotification);
  const { user } = useStore((state) => state);
  const navigate = useNavigate();
  const state = location.state as {
    selectedItems?: CartItemType[];
    subtotal?: number;
    shipping?: number;
    tax?: number;
  } | null;

  // ── Editable shipping fields ────────────────────────────────
  const [address, setAddress] = useState(user?.address || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");

  // ── Validation / API state ──────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Redirect if no items ────────────────────────────────────
  if (!state || !state.selectedItems || state.selectedItems.length === 0) {
    navigate("/cart");
    return;
  }

  const { selectedItems, subtotal = 0, shipping = 0, tax = 0 } = state;
  const total = subtotal + shipping + tax;

  // ── Submit handler ──────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    // 1. Client-side validation
    const errors = validate(address, phone, selectedItems);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    // 2. Call API
    setIsSubmitting(true);

    try {
      await apiClient.post("/order", {
        address: address.trim(),
        phoneNumber: phone.replace(/[\s\-().]/g, ""),
        items: selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      showNotification("Đặt hàng thành công!", "success");
      navigate("/cart");
    } catch (err: unknown) {
      showNotification("Đặt hàng thất bại!", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [address, phone, selectedItems]);

  // ── Helper: input ring color based on error ─────────────────
  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg bg-white text-slate-900 px-4 py-3 text-sm placeholder:text-slate-400 border transition-colors outline-none
     ${hasError
      ? "border-red-400 focus:ring-1 focus:ring-red-400 focus:border-red-400"
      : "border-slate-200 focus:ring-1 focus:ring-primary focus:border-primary"
    }`;

  return (
    <DashboardLayout>
      <div className="bg-background-light font-display text-slate-900 min-h-screen">
        <main className="flex-1 flex flex-col items-center py-10 px-4 md:px-0">
          <div className="w-full max-w-7xl flex flex-col gap-10 mx-auto">
            {/* Page Title */}
            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 text-3xl font-extrabold tracking-tight">
                Thanh toán
              </h1>
              <p className="text-slate-500 text-sm">
                Vui lòng kiểm tra lại thông tin và xác nhận đơn hàng của bạn.
              </p>
            </div>

            {/* Checkout Content */}
            <div className="grid grid-cols-12 lg:gap-x-12 items-start">
              <div className="lg:col-span-7 flex flex-col gap-10">
                {/* Section 1: Review Items */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                    <span className="material-symbols-outlined text-primary">
                      shopping_cart
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Kiểm tra đơn hàng
                    </h3>
                  </div>

                  {fieldErrors.items && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                      <span className="material-symbols-outlined text-red-500 text-base">
                        warning
                      </span>
                      {fieldErrors.items}
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    {selectedItems.map((item) => (
                      <div
                        key={item.productId}
                        className={`flex items-center gap-4 p-3 bg-white rounded-xl border ${item.quantity <= 0
                          ? "border-red-300 bg-red-50/40"
                          : "border-slate-100"
                          }`}
                      >
                        <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          <img
                            alt={item.name}
                            className="w-full h-full object-cover"
                            src={
                              item.imageUrl?.[0] ||
                              "https://via.placeholder.com/150"
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900">
                            {item.name}
                          </h4>
                          <p
                            className={`text-xs ${item.quantity <= 0
                              ? "text-red-500 font-semibold"
                              : "text-slate-500"
                              }`}
                          >
                            Số lượng: {item.quantity}
                            {item.quantity <= 0 && " (không hợp lệ)"}
                          </p>
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {item.basePrice.toLocaleString("vi-VN")} VNĐ
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section 2: Contact & Shipping */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                    <span className="material-symbols-outlined text-primary">
                      location_on
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Thông tin giao hàng
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    {/* Address */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Địa chỉ
                      </label>
                      <input
                        className={inputClass(!!fieldErrors.address)}
                        placeholder="123 Đường Lê Lợi, Quận 1, TP. HCM"
                        type="text"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (fieldErrors.address)
                            setFieldErrors((prev) => ({ ...prev, address: undefined }));
                        }}
                      />
                      {fieldErrors.address && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-sm">
                            info
                          </span>
                          {fieldErrors.address}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Số điện thoại
                      </label>
                      <input
                        className={inputClass(!!fieldErrors.phone)}
                        placeholder="090 123 4567"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone)
                            setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                      />
                      {fieldErrors.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-sm">
                            info
                          </span>
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 3: Payment Method */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                    <span className="material-symbols-outlined text-primary">
                      payments
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Phương thức thanh toán
                    </h3>
                  </div>
                  <div className="flex flex-col gap-4">
                    {/* Cash Option */}
                    <label className="relative flex items-center p-4 border border-primary bg-primary/5 rounded-xl cursor-pointer">
                      <input
                        defaultChecked
                        className="hidden"
                        name="payment"
                        type="radio"
                        value="cod"
                      />
                      <div className="flex-1 flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-700">
                          payments
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            Tiền mặt
                          </span>
                          <span className="text-xs text-slate-500">
                            Thanh toán khi nhận hàng (COD)
                          </span>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                      </div>
                    </label>

                    {/* Bank Transfer Option */}
                    <label className="relative flex items-center p-4 border border-slate-200 bg-white rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                      <input
                        className="hidden"
                        name="payment"
                        type="radio"
                        value="bank"
                      />
                      <div className="flex-1 flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-400">
                          account_balance
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">
                            Chuyển khoản
                          </span>
                          <span className="text-xs text-slate-500">
                            Chuyển khoản qua ngân hàng hoặc ví điện tử
                          </span>
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
                    <span>{subtotal.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Phí vận chuyển</span>
                    <span className="text-emerald-600 font-medium">
                      {shipping === 0
                        ? "Miễn phí"
                        : `${shipping.toLocaleString("vi-VN")} VNĐ`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Thuế ước tính</span>
                    <span>{tax.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <div className="flex justify-between text-xl font-black text-slate-900">
                    <span>Tổng cộng</span>
                    <span>{total.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác nhận đặt hàng</span>
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </section>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default CheckoutPage;
