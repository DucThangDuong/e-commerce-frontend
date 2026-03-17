import React, { useState } from "react";
import OrderSummary from "../component/cart/OrderSummary";
import type { CartItemType } from "../interfaces/cart";
import { apiClient } from "../untils/apiClient";
import CartItem from "../component/cart/CartItem";
import DashboardLayout from "../layouts/HomeLayout";
// --- Main Page Component ---
const ShoppingCartPage: React.FC = () => {
  const [CartItemm, setCartItem] = useState<CartItemType[]>([]);
  const handleGet = async () => {
    try {
      const result = await apiClient.get<CartItemType[]>(
        "/cart ",
      );
      setCartItem(result);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setCartItem([]);
    }
  };

  React.useEffect(() => {
    handleGet();
  }, []);
  return (
    <DashboardLayout>

      <div className="bg-gray-50 font-sans text-slate-900 min-h-screen flex flex-col">
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">
            Your Shopping Cart
          </h1>

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            {/* Cart Items List */}
            <section className="lg:col-span-7">
              <ul className="border-t border-b border-gray-200 divide-y divide-gray-200">
                {CartItemm.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </ul>
            </section>

            {/* Order Summary */}
            <OrderSummary subtotal={419.0} shipping={5.0} tax={33.52} />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default ShoppingCartPage;
