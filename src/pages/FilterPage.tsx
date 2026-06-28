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
            <header className="flex flex-col md:flex-row items-center justify-between mb-2 pb-4 border-b border-gray-200 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-[350px]">
                  <input 
                    type="text" 
                    placeholder="Nhập tên loại xe" 
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    className="w-full border border-gray-300 bg-white py-3 px-5 pr-12 focus:outline-none focus:border-[#a63b00] text-gray-700"
                  />
                  <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#a63b00]">
                    <span className="material-symbols-outlined text-[24px]">search</span>
                  </button>
                </form>
                
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className="w-[48px] h-[48px] shrink-0 rounded-full border-[1.5px] border-[#e02b27] flex items-center justify-center text-[#e02b27] hover:bg-[#e02b27] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">filter_alt</span>
                </button>

                <div className="hidden md:flex flex-col pl-4 border-l border-gray-200">
                  <span className="text-gray-500 text-sm">Kết quả:</span>
                  <span className="font-bold text-lg leading-tight">{pagination.totalItems} sản phẩm</span>
                </div>
              </div>
            </header>

            <div className="md:hidden mb-4">
              <span className="text-gray-500 text-sm">Kết quả:</span> <span className="font-bold">{pagination.totalItems} sản phẩm</span>
            </div>

            {/* Filter Drawer Overlay */}
            {isFilterOpen && (
              <div 
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={() => setIsFilterOpen(false)}
              />
            )}

            {/* Filter Drawer */}
            <div className={`fixed top-0 right-0 h-full w-[85%] sm:w-[400px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-8">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-[#e02b27] text-3xl font-black italic uppercase m-0 tracking-tight leading-none max-w-[80%]">Lọc theo thông số xe</h2>
                  <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-[#e02b27] transition-colors mt-1">
                    <span className="material-symbols-outlined text-[28px]">close</span>
                  </button>
                </div>

                <div>
                  <h4 className="text-[#1a1c1b] mb-4 text-[15px] font-medium">Loại xe</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => {
                      const isSelected = selectedCategoryIds.includes(cat.categoryId.toString());
                      return (
                        <button 
                          key={cat.categoryId}
                          onClick={() => handleCategoryChange(cat.categoryId.toString())}
                          className={`px-4 py-2 font-bold flex items-center gap-2 transition-colors ${isSelected ? 'bg-[#333] text-white' : 'bg-gray-100 text-[#1a1c1b] hover:bg-[#333] hover:text-white'}`}
                        >
                          {cat.name}
                          {isSelected && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-[#1a1c1b] mb-4 text-[15px] font-medium">Hãng xe</h4>
                  <div className="flex flex-wrap gap-2">
                    {brands.map(brand => {
                      const isSelected = selectedBrandIds.includes(brand.brandId.toString());
                      return (
                        <button 
                          key={brand.brandId}
                          onClick={() => handleBrandChange(brand.brandId.toString())}
                          className={`px-4 py-2 font-bold flex items-center gap-2 transition-colors ${isSelected ? 'bg-[#333] text-white' : 'bg-gray-100 text-[#1a1c1b] hover:bg-[#333] hover:text-white'}`}
                        >
                          {brand.name}
                          {isSelected && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-[#1a1c1b] mb-4 text-[15px] font-medium">Mức giá</h4>
                  
                  {/* Dual Slider Visual */}
                  <div className="relative w-full h-1 bg-gray-200 rounded my-8 flex items-center">
                    <div 
                      className="absolute h-full bg-[#e02b27] rounded"
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
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[1.5px] [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
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
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[1.5px] [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                      style={{ zIndex: 4 }}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <input 
                      type="text"
                      placeholder="0"
                      value={formatPrice(minPrice)}
                      onChange={handleMinPriceChange}
                      className="w-full border border-gray-300 rounded py-2 px-3 text-center font-bold focus:outline-none focus:border-[#e02b27]"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input 
                      type="text"
                      placeholder="2.000.000.000"
                      value={formatPrice(maxPrice)}
                      onChange={handleMaxPriceChange}
                      className="w-full border border-gray-300 rounded py-2 px-3 text-center font-bold focus:outline-none focus:border-[#e02b27]"
                    />
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      resetFilters();
                    }} 
                    className="w-full py-3 mb-2 rounded border border-gray-300 bg-white text-[#1a1c1b] font-bold hover:bg-gray-50 transition-colors"
                  >
                    LÀM MỚI BỘ LỌC
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={validateAndApplyPrice}
                  className="flex items-center gap-2 border-[1.5px] border-[#e02b27] text-[#e02b27] px-8 py-2.5 font-bold hover:bg-[#e02b27] hover:text-white transition-colors uppercase"
                >
                  Lọc <span className="material-symbols-outlined font-bold text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <section className="w-full flex flex-col mt-2">

              {loading ? (
                <div className="flex justify-center py-12 md:py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#a63b00]"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 md:py-20 text-center flex flex-col items-center justify-center text-[#594138]">
                  <span className="material-symbols-outlined text-6xl mb-4 text-gray-300">
                    inventory_2
                  </span>
                  <p className="font-bold text-[#1a1c1b] text-lg">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc
                  </p>
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
                      <div key={product.productId} className="h-full bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden relative flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 group">
                        {product.appliedPromotion && (
                          <div className="absolute top-4 right-4 z-10 bg-red-600 text-white shadow-sm px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wide">
                            {product.appliedPromotion.promotionName}
                          </div>
                        )}
                        <div className="h-[220px] overflow-hidden p-4 bg-gray-50 flex items-center justify-center">
                          <img loading="lazy" decoding="async" 
                            src={displayImage} 
                            alt={product.name} 
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <div className="flex flex-col p-6 flex-grow">
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-gray-100 text-[#594138] border border-gray-200 font-bold uppercase px-2 py-1 rounded text-[10px]">
                              {categories.find(c => c.categoryId === product.categoryId)?.name || 'Category'}
                            </span>
                            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                              {brands.find(b => b.brandId === product.brandId)?.name || 'Brand'}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-lg text-[#1a1c1b] mb-2 leading-tight">
                            {product.name}
                          </h5>
                          <p className="text-[#594138] mb-6 flex-grow text-sm leading-relaxed line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                            <div>
                              <span className="block text-gray-400 uppercase font-bold mb-1 text-[10px] tracking-wider">Giá bán</span>
                              {product.appliedPromotion ? (
                                <div>
                                  <span className="text-[#594138] line-through block text-xs mb-0.5">
                                    {product.basePrice.toLocaleString('vi-VN')} ₫
                                  </span>
                                  <span className="font-bold text-xl text-[#a63b00]">
                                    {discountedPrice.toLocaleString('vi-VN')} ₫
                                  </span>
                                </div>
                              ) : (
                                <span className="font-bold text-xl text-[#1a1c1b]">
                                  {product.basePrice.toLocaleString('vi-VN')} ₫
                                </span>
                              )}
                            </div>
                            <Link to={`/product/${product.productId}`} className="bg-gray-900 hover:bg-[#a63b00] text-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm transition-colors">
                              <span className="material-symbols-outlined text-xl">arrow_forward</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-6 gap-4">
                  <div className="flex items-center gap-2 text-sm text-[#594138] font-medium">
                    <span>Hiển thị</span>
                    <select 
                      value={pageSizeParam}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#a63b00] font-bold text-[#1a1c1b] cursor-pointer"
                    >
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                    <span>sản phẩm mỗi trang</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors text-[#1a1c1b]"
                    >
                      Trước
                    </button>
                    
                    <span className="text-sm font-bold text-[#1a1c1b] px-4">
                      Trang {pagination.currentPage} / {pagination.totalPages}
                    </span>

                    <button 
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors text-[#1a1c1b]"
                    >
                      Tiếp
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
