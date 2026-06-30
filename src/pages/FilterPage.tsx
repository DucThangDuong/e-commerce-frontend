import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import type { ResProductDto, ResPagedProductDto } from '../interfaces/product';
import type { ResCategoryDto } from '../interfaces/category';
import type { ResBrandDto } from '../interfaces/brand';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
  </div>
);

const FilterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const q = searchParams.get('q') || '';
  const selectedCategoryIds = searchParams.getAll('categoryIds').flatMap(id => id.split(','));
  const selectedBrandIds = searchParams.getAll('brandIds').flatMap(id => id.split(','));
  const minPriceParam = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : null;
  const maxPriceParam = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : null;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') || '12', 10);

  const [products, setProducts] = useState<ResProductDto[]>([]);
  const [categories, setCategories] = useState<ResCategoryDto[]>([]);
  const [brands, setBrands] = useState<ResBrandDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(q);
  const [minPrice, setMinPrice] = useState<number | ''>(minPriceParam ?? '');
  const [maxPrice, setMaxPrice] = useState<number | ''>(maxPriceParam ?? '');
  
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 12
  });

  useEffect(() => {
    setLocalQuery(q);
  }, [q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localQuery.trim()) {
      newParams.set('q', localQuery.trim());
    } else {
      newParams.delete('q');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const skip = (pageParam - 1) * pageSizeParam;
        const take = pageSizeParam;
        let apiUrl = `/product/filter?skip=${skip}&take=${take}`;
        if (q) {
          apiUrl += `&Keyword=${encodeURIComponent(q)}`;
        }
        selectedCategoryIds.forEach(id => {
          apiUrl += `&CategoryIds=${id}`;
        });
        selectedBrandIds.forEach(id => {
          apiUrl += `&BrandIds=${id}`;
        });
        if (minPriceParam !== null) {
          apiUrl += `&MinPrice=${minPriceParam}`;
        }
        if (maxPriceParam !== null) {
          apiUrl += `&MaxPrice=${maxPriceParam}`;
        }

        const [categoriesRes, brandsRes, productsRes] = await Promise.allSettled([
          apiClient.get<ApiResponse<ResCategoryDto[]>>('/category'),
          apiClient.get<ApiResponse<ResBrandDto[]>>('/brand'),
          apiClient.get<ApiResponse<ResPagedProductDto>>(apiUrl)
        ]);

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.data) setCategories(categoriesRes.value.data);
        if (brandsRes.status === 'fulfilled' && brandsRes.value?.data) setBrands(brandsRes.value.data);
        
        if (productsRes.status === 'fulfilled' && productsRes.value?.data) {
          const pagedData = productsRes.value.data;
          setPagination({
            totalItems: pagedData.totalItems,
            totalPages: pagedData.totalPages,
            currentPage: pagedData.currentPage,
            pageSize: pagedData.pageSize
          });

          let filtered = pagedData.products;

          setProducts(filtered);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [q, searchParams]); // Re-fetch or re-filter when search params change

  const handleCategoryChange = (categoryId: string) => {
    const newParams = new URLSearchParams(searchParams);
    const current = newParams.getAll('categoryIds').flatMap(id => id.split(','));
    if (current.includes(categoryId)) {
      const filtered = current.filter(id => id !== categoryId);
      newParams.delete('categoryIds');
      filtered.forEach(id => newParams.append('categoryIds', id));
    } else {
      newParams.append('categoryIds', categoryId);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleBrandChange = (brandId: string) => {
    const newParams = new URLSearchParams(searchParams);
    const current = newParams.getAll('brandIds').flatMap(id => id.split(','));
    if (current.includes(brandId)) {
      const filtered = current.filter(id => id !== brandId);
      newParams.delete('brandIds');
      filtered.forEach(id => newParams.append('brandIds', id));
    } else {
      newParams.append('brandIds', brandId);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const MIN_PRICE_LIMIT = 0;
  const MAX_PRICE_LIMIT = 2000000000;

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setMinPrice('');
      return;
    }
    setMinPrice(Number(rawValue));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setMaxPrice('');
      return;
    }
    setMaxPrice(Number(rawValue));
  };

  const formatPrice = (val: number | '') => {
    if (val === '') return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const validateAndApplyPrice = () => {
    let finalMin = minPrice === '' ? MIN_PRICE_LIMIT : minPrice;
    let finalMax = maxPrice === '' ? MAX_PRICE_LIMIT : maxPrice;

    if (finalMin > MAX_PRICE_LIMIT) finalMin = MAX_PRICE_LIMIT;
    if (finalMax > MAX_PRICE_LIMIT) finalMax = MAX_PRICE_LIMIT;

    if (finalMin > finalMax) {
      const temp = finalMin;
      finalMin = finalMax;
      finalMax = temp;
    }

    setMinPrice(finalMin);
    setMaxPrice(finalMax);

    const newParams = new URLSearchParams(searchParams);
    
    if (finalMin > MIN_PRICE_LIMIT) {
      newParams.set('minPrice', finalMin.toString());
    } else {
      newParams.delete('minPrice');
    }

    if (finalMax < MAX_PRICE_LIMIT) {
      newParams.set('maxPrice', finalMax.toString());
    } else {
      newParams.delete('maxPrice');
    }
    
    newParams.set('page', '1');
    setSearchParams(newParams);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    navigate('/categories');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handlePageSizeChange = (newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('pageSize', newSize.toString());
    newParams.set('page', '1'); // Reset to page 1 on page size change
    setSearchParams(newParams);
  };

  return (
    <div className="bg-[#f9f9f7] text-[#1a1c1b] font-sans min-h-screen flex flex-col overflow-x-hidden pt-[56px]">
      <div className="flex-grow relative">
        <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          
          <div className="flex flex-col gap-6 w-full">
            
            {/* Header: Search, Filter Toggle, Result Count */}
            <header className="flex flex-col md:flex-row items-center justify-between mb-6 pb-6 border-b border-gray-200 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-[400px]">
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm dòng xe yêu thích..." 
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-full bg-white py-3 px-6 pr-14 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-gray-700 font-medium transition-all shadow-sm"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-primary hover:bg-primary-hover w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </button>
                </form>
                
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className="shrink-0 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center gap-2 px-5 py-3 text-primary hover:bg-primary hover:text-white transition-all font-heading font-bold tracking-wider uppercase text-sm shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">filter_alt</span>
                  <span className="hidden sm:inline">Bộ lọc</span>
                </button>

                <div className="hidden md:flex flex-col pl-6 border-l border-gray-200">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Kết quả tìm kiếm</span>
                  <span className="font-heading font-black text-2xl text-[#1a1c1b] leading-none">{pagination.totalItems} <span className="text-sm font-medium font-sans">sản phẩm</span></span>
                </div>
              </div>
            </header>

            <div className="md:hidden mb-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
              <span className="text-gray-500 font-medium">Kết quả tìm kiếm:</span> 
              <span className="font-heading font-black text-xl text-primary">{pagination.totalItems} sản phẩm</span>
            </div>

            {/* Filter Drawer Overlay */}
            {isFilterOpen && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
                onClick={() => setIsFilterOpen(false)}
              />
            )}

            {/* Filter Drawer */}
            <div className={`fixed top-0 right-0 h-full w-[90%] sm:w-[450px] bg-white z-50 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'} rounded-l-3xl`}>
              <div className="p-8 overflow-y-auto flex-grow flex flex-col gap-10">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-primary text-3xl font-heading font-black uppercase tracking-tight leading-none m-0">Bộ lọc thông số</h2>
                  <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">close</span>
                  </button>
                </div>

                {/* Loại xe */}
                <div>
                  <h4 className="font-heading font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Loại xe</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => {
                      const isSelected = selectedCategoryIds.includes(cat.categoryId.toString());
                      return (
                        <button 
                          key={cat.categoryId}
                          onClick={() => handleCategoryChange(cat.categoryId.toString())}
                          className={`px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all duration-300 ${isSelected ? 'bg-gray-900 text-white shadow-md scale-105' : 'bg-gray-100 text-[#1a1c1b] hover:bg-gray-200'}`}
                        >
                          {cat.name}
                          {isSelected && <span className="material-symbols-outlined text-[16px] font-black">check</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hãng xe */}
                <div>
                  <h4 className="font-heading font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Thương hiệu</h4>
                  <div className="flex flex-wrap gap-2">
                    {brands.map(brand => {
                      const isSelected = selectedBrandIds.includes(brand.brandId.toString());
                      return (
                        <button 
                          key={brand.brandId}
                          onClick={() => handleBrandChange(brand.brandId.toString())}
                          className={`px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all duration-300 ${isSelected ? 'bg-gray-900 text-white shadow-md scale-105' : 'bg-gray-100 text-[#1a1c1b] hover:bg-gray-200'}`}
                        >
                          {brand.name}
                          {isSelected && <span className="material-symbols-outlined text-[16px] font-black">check</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mức giá */}
                <div>
                  <h4 className="font-heading font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Mức giá</h4>
                  
                  {/* Dual Slider Visual */}
                  <div className="relative w-full h-1.5 bg-gray-200 rounded-full my-10 flex items-center">
                    <div 
                      className="absolute h-full bg-primary rounded-full shadow-[0_0_10px_rgba(166,59,0,0.5)]"
                      style={{ 
                        left: `${((minPrice === '' ? MIN_PRICE_LIMIT : Math.min(minPrice, MAX_PRICE_LIMIT)) / MAX_PRICE_LIMIT) * 100}%`,
                        right: `${100 - ((maxPrice === '' ? MAX_PRICE_LIMIT : Math.min(maxPrice, MAX_PRICE_LIMIT)) / MAX_PRICE_LIMIT) * 100}%` 
                      }}
                    ></div>
                    <input 
                      type="range" 
                      min={MIN_PRICE_LIMIT} 
                      max={MAX_PRICE_LIMIT} 
                      step="1000000"
                      value={minPrice === '' ? MIN_PRICE_LIMIT : minPrice}
                      onChange={(e) => {
                        const sMax = maxPrice === '' ? MAX_PRICE_LIMIT : maxPrice;
                        const val = Math.min(Number(e.target.value), sMax - 1000000);
                        setMinPrice(val);
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg cursor-pointer"
                      style={{ zIndex: (minPrice === '' ? MIN_PRICE_LIMIT : minPrice) > MAX_PRICE_LIMIT - 1000000 ? 3 : 4 }}
                    />
                    <input 
                      type="range" 
                      min={MIN_PRICE_LIMIT} 
                      max={MAX_PRICE_LIMIT} 
                      step="1000000"
                      value={maxPrice === '' ? MAX_PRICE_LIMIT : maxPrice}
                      onChange={(e) => {
                        const sMin = minPrice === '' ? MIN_PRICE_LIMIT : minPrice;
                        const val = Math.max(Number(e.target.value), sMin + 1000000);
                        setMaxPrice(val);
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg cursor-pointer"
                      style={{ zIndex: 4 }}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Từ</span>
                      <input 
                        type="text"
                        placeholder="0"
                        value={formatPrice(minPrice)}
                        onChange={handleMinPriceChange}
                        className="w-full border-2 border-gray-200 rounded-xl py-3 pl-10 pr-3 text-right font-heading font-bold text-lg focus:outline-none focus:border-primary transition-colors text-gray-700"
                      />
                    </div>
                    <span className="text-gray-300 font-black">-</span>
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Đến</span>
                      <input 
                        type="text"
                        placeholder="2.000.000.000"
                        value={formatPrice(maxPrice)}
                        onChange={handleMaxPriceChange}
                        className="w-full border-2 border-gray-200 rounded-xl py-3 pl-12 pr-3 text-right font-heading font-bold text-lg focus:outline-none focus:border-primary transition-colors text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <button 
                    type="button" 
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      resetFilters();
                    }} 
                    className="w-full py-4 mb-2 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-heading font-bold tracking-widest text-sm hover:bg-gray-50 hover:border-gray-300 transition-all uppercase shadow-sm"
                  >
                    Làm mới bộ lọc
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-bl-3xl">
                <button 
                  onClick={validateAndApplyPrice}
                  className="w-full flex justify-center items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-heading font-bold tracking-widest text-sm hover:bg-primary-hover hover:shadow-[0_8px_20px_rgba(166,59,0,0.3)] transition-all uppercase hover:-translate-y-1"
                >
                  Áp dụng bộ lọc <span className="material-symbols-outlined font-bold text-[20px]">check</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <section className="w-full flex flex-col mt-2">

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-[400px] bg-white rounded-3xl p-4 flex flex-col gap-4 border border-gray-100 shadow-sm">
                      <Skeleton className="w-full h-[200px] rounded-2xl" />
                      <div className="flex justify-between">
                        <Skeleton className="w-16 h-5 rounded" />
                        <Skeleton className="w-16 h-5 rounded" />
                      </div>
                      <Skeleton className="w-3/4 h-6 rounded" />
                      <Skeleton className="w-full h-12 rounded mt-2" />
                      <div className="flex justify-between items-end mt-auto">
                        <Skeleton className="w-24 h-8 rounded" />
                        <Skeleton className="w-10 h-10 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center text-[#594138] bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
                  <span className="material-symbols-outlined text-7xl mb-4 text-gray-200">
                    inventory_2
                  </span>
                  <p className="font-heading font-bold text-[#1a1c1b] text-2xl uppercase">
                    Không tìm thấy sản phẩm
                  </p>
                  <p className="text-gray-500 mt-2 text-base">Vui lòng thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map(product => {
                    const discountedPrice = product.discountedPrice;

                    const firstColorImage = product.colors && product.colors.length > 0 && product.colors[0].imageUrls && product.colors[0].imageUrls.length > 0 
                      ? product.colors[0].imageUrls[0] 
                      : null;
                    const displayImage = firstColorImage || (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : "https://via.placeholder.com/300");

                    return (
                      <Link to={`/product/${product.productId}`} key={product.productId} className="h-full bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 group">
                        {product.appliedPromotion && (
                          <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-red-600 to-primary text-white shadow-md px-3 py-1.5 rounded-full font-heading font-bold text-[10px] uppercase tracking-widest">
                            {product.appliedPromotion.promotionName}
                          </div>
                        )}
                        <div className="h-[220px] overflow-hidden p-6 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <img loading="lazy" decoding="async" 
                            src={displayImage} 
                            alt={product.name} 
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 relative z-10" 
                          />
                        </div>
                        <div className="flex flex-col p-6 flex-grow">
                          <div className="flex justify-between items-center mb-4">
                            <span className="bg-gray-100 text-[#594138] border border-gray-200 font-bold uppercase px-2.5 py-1 rounded-md text-[10px] tracking-wider">
                              {categories.find(c => c.categoryId === product.categoryId)?.name || 'Category'}
                            </span>
                            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                              {brands.find(b => b.brandId === product.brandId)?.name || 'Brand'}
                            </span>
                          </div>
                          <h5 className="font-heading font-black text-xl text-[#1a1c1b] mb-2 leading-tight uppercase line-clamp-2">
                            {product.name}
                          </h5>
                          <p className="text-gray-500 mb-6 flex-grow text-sm leading-relaxed line-clamp-2">
                            {product.description || "Không có mô tả chi tiết."}
                          </p>
                          <div className="flex justify-between items-end mt-auto pt-5 border-t border-gray-100">
                            <div>
                              <span className="block text-gray-400 uppercase font-heading font-bold mb-1 text-[10px] tracking-widest">Giá bán</span>
                              {product.appliedPromotion ? (
                                <div>
                                  <span className="text-gray-400 line-through block text-xs mb-0.5">
                                    {product.basePrice.toLocaleString('vi-VN')} ₫
                                  </span>
                                  <span className="font-heading font-black text-2xl text-primary drop-shadow-sm">
                                    {discountedPrice.toLocaleString('vi-VN')} ₫
                                  </span>
                                </div>
                              ) : (
                                <span className="font-heading font-black text-2xl text-[#1a1c1b]">
                                  {product.basePrice.toLocaleString('vi-VN')} ₫
                                </span>
                              )}
                            </div>
                            <div className="bg-gray-100 group-hover:bg-primary text-gray-400 group-hover:text-white rounded-full w-12 h-12 flex items-center justify-center shadow-sm transition-all duration-300">
                              <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-16 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-8 gap-6">
                  <div className="flex items-center gap-3 text-sm text-[#594138] font-medium bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                    <span>Hiển thị</span>
                    <select 
                      value={pageSizeParam}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="bg-transparent font-heading font-bold text-lg text-primary focus:outline-none cursor-pointer"
                    >
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                    <span>/ trang</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                    <button 
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-700"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    
                    <span className="text-sm font-heading font-bold text-[#1a1c1b] px-4 tracking-widest uppercase">
                      <span className="text-primary">{pagination.currentPage}</span> / {pagination.totalPages}
                    </span>

                    <button 
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-700"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}

            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FilterPage;
