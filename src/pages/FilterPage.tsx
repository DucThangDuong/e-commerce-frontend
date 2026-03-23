import React, { useState, useEffect } from "react";
import ProductCard from "../component/filter/ProductCard";
import { type ProductDTO } from "../interfaces/product";
import DashboardLayout from "../layouts/HomeLayout";
import { apiClient } from "../untils/apiClient";
import type { BrandDTO } from "../interfaces/brand";
import type { Category } from "../interfaces/category";

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("price_asc");
  const [types, setTypes] = useState<Category[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);

  const sortProducts = (products: ProductDTO[], sortMode: string) => {
    const sorted = [...products];
    if (sortMode === "price_asc") {
      sorted.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortMode === "price_desc") {
      sorted.sort((a, b) => b.basePrice - a.basePrice);
    }
    return sorted;
  };

  // Effect để fetch categories và brands - chạy một lần
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesResult, brandsResult] = await Promise.all([
          apiClient.get<Category[]>(`/category`),
          apiClient.get<BrandDTO[]>(`/brand`),
        ]);
        setTypes(categoriesResult);
        setBrands(brandsResult);
      } catch (error) {
        console.error("Failed to fetch filters:", error);
        setTypes([]);
        setBrands([]);
      }
    };

    fetchFilters();
  }, []);

  // Effect để fetch products khi filters thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (selectedTypes.length > 0 || selectedBrands.length > 0) {
          const result = await apiClient.post<ProductDTO[]>(
            `/product/filter?skip=0&take=20`,
            {
              categoryIds: selectedTypes,
              brandIds: selectedBrands,
            },
          );
          const sortedResult = sortProducts(result, sortBy);
          setProducts(sortedResult);
        } else {
          const result = await apiClient.get<ProductDTO[]>(
            `/product?skip=0&take=20`,
          );
          const sortedResult = sortProducts(result, sortBy);
          setProducts(sortedResult);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, [selectedTypes, selectedBrands, sortBy]);

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand],
    );
  };

  const handleResetFilters = () => {
    setSelectedTypes([]);
    setSelectedBrands([]);
    setSortBy("price_asc");
  };

  return (
    <DashboardLayout>
      <div className="bg-background-light text-slate-900 antialiased min-h-screen font-display">
        <main className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-12 items-start">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-8 lg:sticky lg:top-24">
            <div className="flex flex-col gap-4">
              <div className="mb-2">
                <h3 className="font-['Inter'] uppercase  text-[20px] font-bold ">
                  Bộ lọc
                </h3>
              </div>
              <div className="mt-8 mb-2">
                <h3 className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-slate-400">
                  Loại xe
                </h3>
              </div>
              <nav className="flex flex-col gap-1">
                {types.map((t) => (
                  <label
                    key={t.categoryId}
                    className="py-2 flex items-center justify-between text-slate-600 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold tracking-tight group-hover:text-primary transition-colors uppercase">
                        {t.name}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(t.categoryId.toString())}
                      onChange={() => handleTypeChange(t.categoryId.toString())}
                      className="w-4 h-4 border-slate-300 rounded-sm text-primary focus:ring-primary cursor-pointer transition-colors"
                    />
                  </label>
                ))}
              </nav>

              <div className="mt-8 mb-2">
                <h3 className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-slate-400">
                  Hãng xe
                </h3>
              </div>
              <nav className="flex flex-col gap-1">
                {brands.map((brand) => (
                  <label
                    key={brand.brandId}
                    className="py-2 flex items-center justify-between text-slate-600 cursor-pointer group"
                  >
                    <span className="text-xs font-bold tracking-tight group-hover:text-primary transition-colors">
                      {brand.name}
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(
                        brand.brandId.toString(),
                      )}
                      onChange={() =>
                        handleBrandChange(brand.brandId.toString())
                      }
                      className="w-4 h-4 border-slate-300 rounded-sm text-primary focus:ring-primary cursor-pointer transition-colors"
                    />
                  </label>
                ))}
              </nav>

              <div className="mt-8">
                <button
                  onClick={handleResetFilters}
                  className="w-full bg-slate-900 text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-colors duration-300 rounded-sm"
                >
                  Làm mới bộ lọc
                </button>
              </div>
            </div>
          </aside>

          {/* Main List */}
          <section className="flex-1 flex flex-col w-full">
            <header className="flex flex-row justify-between gap-6 mb-12 border-b pb-8">
              <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-sm border border-slate-200 h-14 shrink-0 px-2 mt-4 md:mt-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-4">
                  Lọc theo:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-bold uppercase pr-10 py-2 cursor-pointer outline-none"
                >
                  <option value="price_asc">Giá : Thấp đến Cao</option>
                  <option value="price_desc">Giá : Cao đến Thấp</option>
                </select>
              </div>
            </header>

            {/* Product Grid */}
            <div className="grid grid-cols-4 gap-6">
              {Array.isArray(products) && products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.productId} product={product} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">
                    inventory_2
                  </span>
                  <p className="font-bold">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default ShopPage;
