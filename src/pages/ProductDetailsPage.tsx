import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../untils/apiClient";
import { type ProductDTO } from "../interfaces/product";
import DashboardLayout from "../layouts/HomeLayout";
import { useStore } from "../zustand/store";
import RelatedProducts from "../component/productdetail/related";
import { isLoggedIn } from "../untils/auth";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    const islogin = isLoggedIn();
    if (!islogin) {
      navigate("/login");
      return;
    }
    try {
      await apiClient.post(`/cart`, {
        product_id: productId,
        quantity: itemQuantity,
      });
      showNotification("Đã thêm vào giỏ hàng!", "success");
    } catch {
      showNotification("Thêm thất bại!", "error");
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
      <div className="bg-background-light font-display text-black min-h-screen flex flex-col overflow-x-hidden">
        <div className="layout-container flex h-full flex-col">
          {/* Product Section */}
          <main className="flex-1 px-6 pb-20">
            <div className="grid grid-cols-2 gap-12 items-start">
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
              <div className="flex flex-col space-y-8 pt-5">
                <div>
                  <h1 className="text-5xl font-black text-slate-900 leading-tight mb-4">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-light ">
                      {product.basePrice.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-bold">
                    Số lượng: {product.stockQuantity}
                  </span>
                </div>
                <div className="h-px bg-slate-200 w-full"></div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase">
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
                  <div className=" gap-4">
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
            <RelatedProducts />
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductDetailsPage;
