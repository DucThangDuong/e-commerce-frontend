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
  const sort = searchParams.get('sort') || 'price_asc';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') || '12', 10);

  const [products, setProducts] = useState<ResProductDto[]>([]);
  const [categories, setCategories] = useState<ResCategoryDto[]>([]);
  const [brands, setBrands] = useState<ResBrandDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 12
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const skip = (pageParam - 1) * pageSizeParam;
        const take = pageSizeParam;
        let apiUrl = `/product/filter?skip=${skip}&take=${take}`;
        selectedCategoryIds.forEach(id => {
          apiUrl += `&CategoryIds=${id}`;
        });
        selectedBrandIds.forEach(id => {
          apiUrl += `&BrandIds=${id}`;
        });

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

          // Client-side filtering (applied to the current fetched page)
          let filtered = pagedData.products;
          
          if (q) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.description?.toLowerCase().includes(q.toLowerCase()));
          }
          
          if (selectedCategoryIds.length > 0) {
            filtered = filtered.filter(p => selectedCategoryIds.includes(p.categoryId.toString()));
          }
          
          if (selectedBrandIds.length > 0) {
            filtered = filtered.filter(p => p.brandId != null && selectedBrandIds.includes(p.brandId.toString()));
          }
          
          if (sort === 'price_asc') {
            filtered.sort((a, b) => {
              const priceA = a.activePromotion ? a.basePrice - (a.basePrice * a.activePromotion.discountPercentage / 100) : a.basePrice;
              const priceB = b.activePromotion ? b.basePrice - (b.basePrice * b.activePromotion.discountPercentage / 100) : b.basePrice;
              return priceA - priceB;
            });
          } else if (sort === 'price_desc') {
            filtered.sort((a, b) => {
              const priceA = a.activePromotion ? a.basePrice - (a.basePrice * a.activePromotion.discountPercentage / 100) : a.basePrice;
              const priceB = b.activePromotion ? b.basePrice - (b.basePrice * b.activePromotion.discountPercentage / 100) : b.basePrice;
              return priceB - priceA;
            });
          }

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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', e.target.value);
    newParams.set('page', '1');
    setSearchParams(newParams);
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
    <div className="bg-[#f9f9f7] text-gray-900 font-['Plus_Jakarta_Sans',sans-serif] min-h-screen flex flex-col overflow-x-hidden pt-[56px]">
      <div className="flex-grow relative">
        <main className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar */}
            <aside className="w-full lg:w-1/4 lg:sticky lg:top-24">
              <div className="flex flex-col gap-8 bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">

                <div>
                  <h3 className="uppercase text-xl font-bold m-0">Bộ lọc</h3>
                </div>

                <div>
                  <h4 className="text-gray-500 uppercase font-bold mb-4 text-xs tracking-widest">
                    Loại xe
                  </h4>
                  <div className="flex flex-col gap-3">
                    {categories.map(cat => (
                      <label key={cat.categoryId} className="flex justify-between items-center text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                        <span className="text-sm font-bold uppercase">{cat.name}</span>
                        <input 
                          type="checkbox" 
                          checked={selectedCategoryIds.includes(cat.categoryId.toString())}
                          onChange={() => handleCategoryChange(cat.categoryId.toString())}
                          className="w-4 h-4 text-[#a63b00] rounded border-gray-300 focus:ring-[#a63b00] cursor-pointer" 
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-gray-500 uppercase font-bold mb-4 text-xs tracking-widest">
                    Hãng xe
                  </h4>
                  <div className="flex flex-col gap-3">
                    {brands.map(brand => (
                      <label key={brand.brandId} className="flex justify-between items-center text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                        <span className="text-sm font-bold uppercase">{brand.name}</span>
                        <input 
                          type="checkbox" 
                          checked={selectedBrandIds.includes(brand.brandId.toString())}
                          onChange={() => handleBrandChange(brand.brandId.toString())}
                          className="w-4 h-4 text-[#a63b00] rounded border-gray-300 focus:ring-[#a63b00] cursor-pointer" 
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <button 
                    type="button" 
                    onClick={resetFilters} 
                    className="w-full py-3 rounded-xl uppercase border border-gray-200 bg-gray-50 text-gray-900 font-bold hover:bg-[#a63b00] hover:text-white hover:border-[#a63b00] transition-colors"
                  >
                    Làm mới bộ lọc
                  </button>
                </div>

              </div>
            </aside>

            {/* Main Content */}
            <section className="w-full lg:w-3/4 flex flex-col">

              <header className="flex justify-end mb-6 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm">
                  <span className="uppercase font-bold text-gray-500 text-xs tracking-wider">
                    Lọc theo:
                  </span>
                  <select 
                    value={sort}
                    onChange={handleSortChange}
                    className="border-0 focus:ring-0 uppercase font-bold text-xs cursor-pointer bg-transparent text-gray-900 p-0"
                  >
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                  </select>
                </div>
              </header>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a63b00]"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center text-gray-500">
                  <span className="material-symbols-outlined text-6xl mb-4 text-gray-300">
                    inventory_2
                  </span>
                  <p className="font-bold text-gray-900 text-lg">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => {
                    const discountedPrice = product.activePromotion 
                      ? product.basePrice - (product.basePrice * product.activePromotion.discountPercentage / 100) 
                      : product.basePrice;

                    const firstColorImage = product.colors && product.colors.length > 0 && product.colors[0].imageUrls && product.colors[0].imageUrls.length > 0 
                      ? product.colors[0].imageUrls[0] 
                      : null;
                    const displayImage = firstColorImage || (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : "https://via.placeholder.com/300");

                    return (
                      <div key={product.productId} className="h-full bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden relative flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 group">
                        {product.activePromotion && (
                          <div className="absolute top-4 right-4 z-10 bg-red-600 text-white shadow-sm px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wide">
                            {product.activePromotion.name}
                          </div>
                        )}
                        <div className="h-[220px] overflow-hidden p-4 bg-gray-50 flex items-center justify-center">
                          <img 
                            src={displayImage} 
                            alt={product.name} 
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <div className="flex flex-col p-6 flex-grow">
                          <div className="flex justify-between items-center mb-3">
                            <span className="bg-gray-100 text-gray-600 border border-gray-200 font-bold uppercase px-2 py-1 rounded text-[10px]">
                              {categories.find(c => c.categoryId === product.categoryId)?.name || 'Category'}
                            </span>
                            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                              {brands.find(b => b.brandId === product.brandId)?.name || 'Brand'}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-lg text-gray-900 mb-2 leading-tight">
                            {product.name}
                          </h5>
                          <p className="text-gray-500 mb-6 flex-grow text-sm leading-relaxed line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                            <div>
                              <span className="block text-gray-400 uppercase font-bold mb-1 text-[10px] tracking-wider">Giá bán</span>
                              {product.activePromotion ? (
                                <div>
                                  <span className="text-gray-400 line-through block text-xs mb-0.5">
                                    {product.basePrice.toLocaleString('vi-VN')} ₫
                                  </span>
                                  <span className="font-black text-xl text-[#a63b00]">
                                    {discountedPrice.toLocaleString('vi-VN')} ₫
                                  </span>
                                </div>
                              ) : (
                                <span className="font-black text-xl text-gray-900">
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
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <span>Hiển thị</span>
                    <select 
                      value={pageSizeParam}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#a63b00] font-bold text-gray-700 cursor-pointer"
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
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors text-gray-700"
                    >
                      Trước
                    </button>
                    
                    <span className="text-sm font-bold text-gray-700 px-4">
                      Trang {pagination.currentPage} / {pagination.totalPages}
                    </span>

                    <button 
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors text-gray-700"
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
