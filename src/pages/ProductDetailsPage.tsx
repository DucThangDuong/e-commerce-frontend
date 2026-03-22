import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../untils/apiClient";
import { type ProductDTO } from "../interfaces/product";
import DashboardLayout from "../layouts/HomeLayout";
import { useStore } from "../zustand/store";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const showNotification = useStore((state) => state.showNotification);
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const result = await apiClient.get<ProductDTO>(
          `/product/detail?productId=${id}`,
        );
        setProduct(result);
      } catch (error) {
        console.error("Failed to fetch product details:", error);
      }
    };
    if (id) {
      fetchProduct();
    }
  }, [id]);
  const handleAddToCart = async (productId: number) => {
    try {
      await apiClient.post(`/cart`, {
        product_id: productId,
        quantity: itemQuantity,
      });
      showNotification("Đã thêm vào giỏ hàng!");
    } catch {
      showNotification("Thêm thất bại!");
    }
  };

  const adjustQuantity = (delta: number) => {
    if (!product) return;
    setItemQuantity((prev) => {
      const next = prev + delta;

      if (next < 1) {
        return 1;
      }

      if (next > product.stockQuantity) {
        return product.stockQuantity;
      }

      return next;
    });
  };
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light text-slate-900 ">
        Product not found.
      </div>
    );
  }
  return (
    <DashboardLayout>
      <div className="bg-background-light font-display text-slate-900 antialiased min-h-screen flex flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          {/* Product Section */}
          <main className="flex-1 px-6 md:px-20 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Product Image Gallery */}
              <div className="space-y-4">
                <div className="aspect-[4/5] rounded-xl overflow-hidden bg-slate-200 relative">
                  <img
                    alt={product.name}
                    className={`w-full h-full object-cover transition-opacity duration-300`}
                    src={product.imageUrl?.[activeImageIndex]}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {product.imageUrl &&
                    product.imageUrl.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${activeImageIndex === index ? "border-primary" : "border-transparent"}`}
                      >
                        <img
                          className="w-full h-full object-cover"
                          src={img}
                          alt={`${product.name} thumbnail ${index + 1}`}
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Product Details */}
              <div className="flex flex-col space-y-8 lg:pt-10">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-light text-slate-900">
                      {product.basePrice.toFixed(3)} VND
                    </span>
                  </div>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-bold">
                    Số lượng: {product.stockQuantity}
                  </span>
                </div>
                <div className="h-px bg-slate-200 w-full"></div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Thông tin sản phẩm
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>
                {/* Nút tăng/giảm số lượng */}
                <div className="flex-1 flex justify-start min-w-[100px]">
                  <div className="flex items-center border border-gray-300 rounded h-7 bg-white">
                    <button
                      onClick={() => adjustQuantity(-1)}
                      type="button"
                      className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors rounded-l"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        remove
                      </span>
                    </button>

                    <span className="w-8 text-center text-xs font-medium text-gray-900 border-x border-gray-200 leading-7">
                      {itemQuantity}
                    </span>

                    <button
                      onClick={() => adjustQuantity(1)}
                      type="button"
                      className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors rounded-r"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        add
                      </span>
                    </button>
                  </div>
                </div>
                <div className="space-y-6 pt-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => {
                        handleAddToCart(product.productId);
                      }}
                      className=" bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-3 "
                    >
                      <span className="material-symbols-outlined">
                        add_shopping_cart
                      </span>
                      Thêm vào giỏ hàng
                    </button>

                    <button className="border-2 border-blue-600 hover:bg-blue-100 text-blue-600 font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-3 ">
                      Mua ngay
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100">
                    <span className="material-symbols-outlined text-slate-500">
                      local_shipping
                    </span>
                    <div className="text-xs">
                      <p className="font-bold">Free Shipping</p>
                      <p className="text-slate-500">On all orders over $150</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100">
                    <span className="material-symbols-outlined text-slate-500">
                      verified_user
                    </span>
                    <div className="text-xs">
                      <p className="font-bold">2-Year Warranty</p>
                      <p className="text-slate-500">Guaranteed quality</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <section className="mt-20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  You Might Also Like
                </h2>
                <a
                  className="text-primary font-semibold text-sm hover:underline"
                  href="#"
                >
                  View All
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Related Product 1 */}
                <div className="group bg-white border border-slate-200 rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-4 relative">
                    <img
                      alt="Silver Classic"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBetYJ4xE32bq5bOcuEavfTCp4I4UaXKi6eSOy73OvzPYoB0Uq3h__hB-S1tMTskqSLH53ZLiXhYkt6puy8Hx_zUBkHr2Nsetgq0ro4VJbZz7XAxV3vBDKsi_HzEvFpFYw41e9r_MtqvbZMM9YzDE40NIwjKD7Vl8dkhOrvLmidX8QTdpN5aWzzNid_-DX7-vbn3VyOFPyzViIDEYl9GOD16YJaQgUCyoGLIT3E0SkwoUfX-yhgW3kNvQP0-SL8PTsdq9JQoxvzqT4"
                    />
                    <button className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 py-2 rounded-lg text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200">
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                      Quick Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Silver Classic Edition
                    </h3>
                    <p className="text-xs text-slate-500">Steel / Mesh Strap</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      $175.00
                    </p>
                  </div>
                </div>

                {/* Related Product 2 */}
                <div className="group bg-white border border-slate-200 rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-4 relative">
                    <img
                      alt="Midnight Chrono"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0Pak1c8q2nkgXv6cHL46JARJ-OvwNNkhA_5colNIAJM3aTaq0uD_gxqlj5pnWJWC7J0QdwlBhAI6fimFeMKYIku5PzksDpE9ekOBuqG8ldPfmcQ-pP9BWSu_LxXf-n0CMJiUIE3fhjrXcCeHoU_esvDz4PScrgTqVan3GwdWe9oG5Cf-Kax7NDLqyNVgwA6lWPGuxeTi14U2WSoZKKnYukFSAsUaiz1CJUF6hDCmidooidYLhGlTHAphoF89G0sAF3x9ghZP1M4o"
                    />
                    <button className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 py-2 rounded-lg text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200">
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                      Quick Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Midnight Chronograph
                    </h3>
                    <p className="text-xs text-slate-500">PVD Black / Sport</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      $225.00
                    </p>
                  </div>
                </div>

                {/* Related Product 3 */}
                <div className="group bg-white border border-slate-200 rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-4 relative">
                    <img
                      alt="The Nomad"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGp35-pOA6kl2Gx_5znTU-b1ySKQ26QjanuBZf_BIX5NZwXIzQQw6n-uEvIMCDGDJGzn9Usw2jQuHSt2aycpvSsXyfMM6veX0coO8QMCs6vQ2OX8-v8jspWh3e_N9CT9NiT7AQkreMRH3xyax1YhTEuPq3uLbrKBU0gBbvZo6vXqnsuF1aHgOdTiyoaWY9_zYJcBWmbFxvqBFeVrL5DRpcEgfdbseMpfBSJElPMPgK013EhqtiWKZKHzi1p1YjG3qEg2A60yzT-DE"
                    />
                    <button className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 py-2 rounded-lg text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200">
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                      Quick Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      The Nomad Automatic
                    </h3>
                    <p className="text-xs text-slate-500">Titanium / Canvas</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      $310.00
                    </p>
                  </div>
                </div>

                {/* Related Product 4 */}
                <div className="group bg-white border border-slate-200 rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-4 relative">
                    <img
                      alt="Rose Gold Luxe"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOarujMqtqvhzqcmcakOfQI-UUt6Q1m83fvWORiNEEi4V4EHJUSoCpg8D4-OhLavAa9iBohVC44nL9crdGt0WnSRUFR8OBxKtfSURt2gEAF81sHPxf-JdT80fhupFC1gbARCUXPdi6MnIV3l5h6nlBYowXVANvGCZuGQ8xbOCLovmrx1yDZF3ca-FFL9hC6q22zf03zW_ITNRyIEnqYvnpxF2p1CRZbUaFxkO_psHr10eciSESkdSIrpWe7rG-qW-LE_FZamd3gw8"
                    />
                    <button className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 py-2 rounded-lg text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200">
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                      Quick Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Rose Gold Luxe
                    </h3>
                    <p className="text-xs text-slate-500">
                      18k Plated / Leather
                    </p>
                    <p className="text-sm font-medium text-primary mt-1">
                      $215.00
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductDetailsPage;
