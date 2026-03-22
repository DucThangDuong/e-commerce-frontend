import React from "react";
import { useNavigate } from "react-router-dom";
import type { CartItemType } from "../../interfaces/cart";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  isCheckoutValid: boolean;
  totalQuantity: number;
  selectedItems: CartItemType[];
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  shipping,
  isCheckoutValid,
  totalQuantity,
  selectedItems,
}) => {
  const total = subtotal + shipping;
  const navigate = useNavigate();

  return (
    <section className="mt-0 bg-white rounded-lg px-4 py-6  col-span-4 border border-gray-200 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">
            Subtotal ({totalQuantity} items)
          </dt>
          <dd className="text-sm font-medium text-gray-900">
            {subtotal.toLocaleString("vi-VN")} VNĐ
          </dd>
        </div>

        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <dt className="flex items-center text-sm text-gray-600">
            <span>Shipping estimate</span>
          </dt>
          <dd className="text-sm font-medium text-gray-900">
            {shipping.toLocaleString('vi-VN')} VNĐ
          </dd>
        </div>

        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <dt className="text-base font-bold text-gray-900">Order Total</dt>
          <dd className="text-base font-bold text-gray-900">
            {total.toLocaleString("vi-VN")} VNĐ
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <button
          type="button"
          disabled={!isCheckoutValid}
          onClick={() =>
            navigate("/checkout", {
              state: { selectedItems, subtotal, shipping },
            })
          }
          className={`w-full border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-bold text-white transition-all 
                        duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isCheckoutValid
              ? "bg-primary hover:bg-primary/90 focus:ring-primary shadow-lg shadow-primary/25 cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          THANH TOÁN
        </button>
      </div>
    </section>
  );
};

export default OrderSummary;
