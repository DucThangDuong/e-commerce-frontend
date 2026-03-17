import React, { useState } from "react";
import ProductCard from "../component/cart/ProductCard";
import { type ProductDTO } from "../interfaces/product";
import DashboardLayout from "../layouts/HomeLayout";
import { apiClient } from "../untils/apiClient";

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);

  const handleGet = async () => {
    try {
      const result = await apiClient.get<ProductDTO[]>(
        "/product?skip=0&take=10",
      );
      setProducts(result);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    }
  };

  React.useEffect(() => {
    handleGet();
  }, []);

  return (
    <DashboardLayout>
      <div className="bg-background-light text-slate-900 antialiased min-h-screen font-display">
        <main className="max-w-[1440px] mx-auto px-6 py-8 flex gap-8">
          <section className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.isArray(products) ? (
                products.map((product) => (
                  <ProductCard key={product.productId} product={product} />
                ))
              ) : (
                <p>No products found or invalid data format.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default ShopPage;
