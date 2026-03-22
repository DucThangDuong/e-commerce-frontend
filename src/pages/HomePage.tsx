import React, { useState, useEffect } from "react";
import ProductCard from "../component/cart/ProductCard";
import { type ProductDTO } from "../interfaces/product";
import DashboardLayout from "../layouts/HomeLayout";
import { apiClient } from "../untils/apiClient";

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");

  const types = [
    { id: "Superbike" },
    { id: "Naked" },
    { id: "Adventure" },
    { id: "Touring" },
    { id: "Electric" },
  ];

  const brands = ["DUCATI", "BMW", "YAMAHA", "HONDA"];

  const handleGet = async () => {
    try {
      const params = new URLSearchParams({
        skip: "0",
        take: "10",
      });

      if (selectedTypes.length > 0) {
        params.append("type", selectedTypes.join(","));
      }
      if (selectedBrands.length > 0) {
        params.append("brands", selectedBrands.join(","));
      }
      if (sortBy === "price_asc") {
        params.append("sortBy", "basePrice");
        params.append("sortOrder", "asc");
      } else if (sortBy === "price_desc") {
        params.append("sortBy", "basePrice");
        params.append("sortOrder", "desc");
      }

      const result = await apiClient.get<ProductDTO[]>(
        `/product?${params.toString()}`
      );
      
      let sortedResult = [...result];
      if (sortBy === "price_asc") {
        sortedResult.sort((a, b) => a.basePrice - b.basePrice);
      } else if (sortBy === "price_desc") {
        sortedResult.sort((a, b) => b.basePrice - a.basePrice);
      }
      
      setProducts(sortedResult);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    handleGet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, selectedBrands, sortBy]);

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleResetFilters = () => {
    setSelectedTypes([]);
    setSelectedBrands([]);
    setSortBy("newest");
  };

  return (
    <DashboardLayout>
      <div className="bg-background-light text-slate-900 antialiased min-h-screen font-display">
        <main className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-12 items-start">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-8 lg:sticky lg:top-24">
            <div className="flex flex-col gap-4">
              <div className="mb-2">
                <h3 className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-slate-400">
                  FILTER BY TYPE
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Precision Performance
                </p>
              </div>
              <nav className="flex flex-col gap-1">
                {types.map((t) => (
                  <label
                    key={t.id}
                    className="py-2 flex items-center justify-between text-slate-600 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold tracking-tight group-hover:text-primary transition-colors uppercase">
                        {t.id}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(t.id)}
                      onChange={() => handleTypeChange(t.id)}
                      className="w-4 h-4 border-slate-300 rounded-sm text-primary focus:ring-primary cursor-pointer transition-colors"
                    />
                  </label>
                ))}
              </nav>

              <div className="mt-8 mb-2">
                <h3 className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-slate-400">
                  BRANDS
                </h3>
              </div>
              <nav className="flex flex-col gap-1">
                {brands.map((brand) => (
                  <label
                    key={brand}
                    className="py-2 flex items-center justify-between text-slate-600 cursor-pointer group"
                  >
                    <span className="text-xs font-bold tracking-tight group-hover:text-primary transition-colors">
                      {brand}
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
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
                  Reset Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Main List */}
          <section className="flex-1 flex flex-col w-full">
            {/* Header / Sort */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-200 pb-8">
              <div>
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-none">
                  THE KINETIC<br />
                  <span className="text-primary">GALLERY</span>
                </h1>
                <p className="text-sm font-body text-slate-500 mt-4 max-w-lg">
                  Engineering perfection meets aerodynamic art. Browse our curated
                  selection of high-performance machines designed for the apex.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-sm border border-slate-200 h-14 shrink-0 px-2 mt-4 md:mt-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-4">
                  SORT BY:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase tracking-widest pr-10 py-2 cursor-pointer outline-none"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </header>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.isArray(products) && products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.productId} product={product} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">
                    inventory_2
                  </span>
                  <p className="font-bold">No products found matching filters</p>
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
