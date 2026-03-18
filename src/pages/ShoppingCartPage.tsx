import React, { useState } from "react";
import OrderSummary from "../component/cart/OrderSummary";
import type { CartItemType } from "../interfaces/cart";
import { apiClient } from "../untils/apiClient";
import CartItem from "../component/cart/CartItem";
import DashboardLayout from "../layouts/HomeLayout";

const ShoppingCartPage: React.FC = () => {
  const [CartItemm, setCartItem] = useState<CartItemType[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleGet = async () => {
    try {
      const result = await apiClient.get<CartItemType[]>("/cart ");
      setCartItem(result);
    } catch {
      setCartItem([]);
    }
  };

  React.useEffect(() => {
    handleGet();
  }, []);

  const handleToggleSelect = (productId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedIds(newSelected);
  };

  const handleIncrease = (productId: number) => {
    setCartItem((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const nextQuantity = Math.min(item.quantity + 1, item.stockQuantity);
        return {
          ...item,
          quantity: nextQuantity,
        };
      }),
    );
  };

  const handleDecrease = (productId: number) => {
    setCartItem((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const nextQuantity = Math.max(item.quantity - 1, 1);
        return {
          ...item,
          quantity: nextQuantity,
        };
      }),
    );
  };
  const handleDeleteItemCart = async (id: number) => {
    try {
      await apiClient.deleteQuery(`/cart?productId=${id}`);
      setCartItem((prev) => prev.filter((i) => i.productId !== id));
    } catch {
      setCartItem((prev) => prev);
    }
  };

  // Calculate Subtotal for SELECTED items only
  const selectedItems = CartItemm.filter((item) =>
    selectedIds.has(item.productId),
  );
  const subtotal = selectedItems.reduce(
    (acc, item) => acc + item.basePrice * item.quantity,
    0,
  );
  const totalQuantity = selectedItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const shipping = selectedItems.length > 0 ? 5.0 : 0;

  const isCheckoutValid = selectedItems.length > 0;
  return (
    <DashboardLayout>
      <div className="bg-gray-50 font-sans text-slate-900 min-h-screen flex flex-col">
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">
            Your Shopping Cart
          </h1>

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            {/* Cart Items List */}
            <section className="lg:col-span-8">
              <ul className="border-t border-b border-gray-200 divide-y divide-gray-200">
                {CartItemm.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    isSelected={selectedIds.has(item.productId)}
                    onToggleSelect={handleToggleSelect}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                    onRemove={(id) => handleDeleteItemCart(id)}
                  />
                ))}
              </ul>
            </section>

            {/* Order Summary */}
            <OrderSummary
              subtotal={subtotal}
              shipping={shipping}
              isCheckoutValid={isCheckoutValid}
              totalQuantity={totalQuantity}
              selectedItems={selectedItems}
            />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default ShoppingCartPage;
