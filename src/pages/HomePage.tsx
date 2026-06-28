import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import type { ResCategoryDto } from '../interfaces/category';
import type { ResBrandDto } from '../interfaces/brand';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ResSimpleFeaturedProductDto {
  productId: number;
  displayOrder?: number;
  firstColorImageUrl?: string;
}

export interface ResPromotionProductItemDto {
  productId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  discountedPrice: number;
  totalSlots: number;
  remainingSlots: number;
}

export interface ResPromotionWithProductsDto {
  promotionId: number;
  name: string;
  startDate: string;
  endDate: string;
  discountType: string;
  discountValue: number;
  products: ResPromotionProductItemDto[];
}

const Countdown = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(endDate).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="flex items-center gap-2 text-white font-bold text-sm md:text-base">
      <span className="hidden md:inline">Kết thúc sau:</span>
      <div className="flex gap-1 items-center">
        <span className="bg-white/20 px-2 py-1 rounded">{timeLeft.days}</span> ngày
        <span className="bg-white/20 px-2 py-1 rounded">{timeLeft.hours}</span> giờ
        <span className="bg-white/20 px-2 py-1 rounded">{timeLeft.minutes}</span> phút
        <span className="bg-white/20 px-2 py-1 rounded">{timeLeft.seconds}</span> giây
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ResSimpleFeaturedProductDto[]>([]);
  const [promotions, setPromotions] = useState<ResPromotionWithProductsDto[]>([]);
  const [categories, setCategories] = useState<ResCategoryDto[]>([]);
  const [brands, setBrands] = useState<ResBrandDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [categoriesRes, brandsRes, featuredRes, promotionRes] = await Promise.allSettled([
          apiClient.get<ApiResponse<ResCategoryDto[]>>('/category'),
          apiClient.get<ApiResponse<ResBrandDto[]>>('/brand'),
          apiClient.get<ApiResponse<ResSimpleFeaturedProductDto[]>>('/product/featured').catch(() => null),
          apiClient.get<ApiResponse<ResPromotionWithProductsDto[]>>('/promotion/active').catch(() => null)
        ]);

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.data) setCategories(categoriesRes.value.data);
        if (brandsRes.status === 'fulfilled' && brandsRes.value?.data) setBrands(brandsRes.value.data);
        if (featuredRes.status === 'fulfilled' && featuredRes.value?.data) {
           const sorted = featuredRes.value.data.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
           setFeaturedProducts(sorted);
        }
        if (promotionRes.status === 'fulfilled' && promotionRes.value?.data) {
           setPromotions(promotionRes.value.data);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f9f9f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#a63b00]"></div>
      </div>
    );
  }

  const currentProduct = featuredProducts.length > 0 ? featuredProducts[currentSlide] : null;

  return (
    <main className="font-sans bg-[#f9f9f7] text-[#1a1c1b]">
      <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
           <img src="https://imageshare13.blob.core.windows.net/logo/backgroup.webp" alt="Background" className="w-full h-full object-cover opacity-80" />
        </div>
        <div 
          className="absolute inset-0 z-10 bg-[#06182c]"
          style={{ clipPath: 'polygon(0 0, 60% 0, 40% 100%, 0 100%)' }}
        ></div>
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          {/* Left Text Content */}
          <div className="w-full md:w-[55%] text-white pt-20 md:pt-0 pl-0 md:pl-8 relative z-20">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              XE MÁY - ĐAM MÊ XE,<br/> DẪN ĐẦU TỐC ĐỘ
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mb-6 md:mb-10 max-w-lg">
              Hàng ngàn mẫu xe mới, phụ kiện chính hãng & dịch vụ bảo dưỡng chuyên nghiệp.
            </p>
            <Link 
              to="/categories" 
              className="inline-block bg-[#a63b00] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#8a3100] transition-colors shadow-sm"
            >
              XEM TẤT CẢ XE
            </Link>
          </div>

          {/* Right Image Content */}
          <div className="absolute bottom-0 md:top-0 right-0 w-full md:w-[65%] h-[55%] md:h-full flex items-end md:items-center justify-center pb-12 md:pb-0 z-30 pointer-events-none">
             {currentProduct ? (
               <Link to={`/product/${currentProduct.productId}`} className="w-full h-full flex items-end md:items-center justify-center group relative cursor-pointer pointer-events-auto">
                  <img src={currentProduct.firstColorImageUrl || "https://via.placeholder.com/600x400?text=No+Image"} 
                    alt="Featured Motorcycle" 
                    className="relative w-[110%] sm:w-[90%] md:w-[130%] h-auto max-h-[100%] md:max-h-[85%] object-contain transition-transform duration-500 ease-out group-hover:scale-105 mix-blend-multiply drop-shadow-2xl"
                  />
               </Link>
             ) : (
                <div className="text-white text-xl mb-10 md:mb-0">Đang cập nhật...</div>
             )}

             {/* Slider Dots */}
             {featuredProducts.length > 1 && (
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                 {featuredProducts.map((_, idx) => (
                   <button
                     key={idx}
                     onClick={() => setCurrentSlide(idx)}
                     className={`w-12 h-1.5 rounded-full transition-colors ${idx === currentSlide ? 'bg-[#a63b00]' : 'bg-white/30 hover:bg-white/60'}`}
                     aria-label={`Go to slide ${idx + 1}`}
                   ></button>
                 ))}
               </div>
             )}
          </div>

        </div>
      </section>

      {/* Explore Categories */}
      <section className="py-12 md:py-20 bg-[#f4f4f2]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-[#1a1c1b] tracking-tight">Danh Mục Sản Phẩm</h2>
            <p className="text-[#594138] mt-2 text-lg">Lọc và tìm kiếm nhanh chóng theo phân khúc.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link key={category.categoryId} to={`/categories?categoryIds=${category.categoryId}`} className="block group">
                <div className="h-full rounded-2xl bg-white p-4 md:p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="w-full h-20 md:h-24 mb-4 md:mb-6 flex items-center justify-center md:justify-start">
                    <img loading="lazy" decoding="async" 
                      src={category.picture || "https://via.placeholder.com/150?text=No+Image"} 
                      alt={category.name} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-105" 
                    />
                  </div>
                  <h3 className="font-bold text-[#1a1c1b] text-lg tracking-tight">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1a1c1b] tracking-tight mb-6">Thương Hiệu Đồng Hành</h2>
              <p className="text-lg text-[#594138] mb-6 md:mb-10 leading-relaxed max-w-lg">
                Chúng tôi tự hào là đối tác của những thương hiệu xe máy hàng đầu thế giới, mang đến cho bạn sự an tâm tuyệt đối về chất lượng.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6">
                {brands.map((brand) => (
                  <Link key={brand.brandId} to={`/categories?brandIds=${brand.brandId}`} className="block group cursor-pointer text-center md:text-left">
                    <div className="bg-[#f9f9f7] border border-gray-100 rounded-2xl flex items-center justify-center mb-2 md:mb-3 overflow-hidden w-20 h-20 md:w-24 md:h-24 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm mx-auto md:mx-0">
                      {brand.logoUrl ? (
                        <img loading="lazy" decoding="async" src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-4 mix-blend-multiply" />
                      ) : (
                        <span className="font-bold text-[#594138] uppercase text-xs">{brand.name}</span>
                      )}
                    </div>
                    <p className="font-bold text-[#1a1c1b] text-sm mt-2">{brand.name}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img loading="lazy" decoding="async" src="https://media.techz.vn/media2019/upload2019/2022/08/26/honda_26082022150734.jpg" alt="Motorcycle showroom" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-0 bg-[#a63b00] p-6 rounded-2xl shadow-xl m-6 hidden md:block animate-[fadeInSlideUp_0.8s_ease-out_forwards]">
                <p className="text-5xl font-bold m-0 text-white mb-1">100%</p>
                <p className="m-0 text-white/80 font-medium">Chính hãng &amp; Bảo hành</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions / Flash Sale Section replacing Top Products */}
      {promotions.map(promo => (
        <section key={promo.promotionId} className="w-full bg-gradient-to-r from-[#8a3100] to-[#a63b00] py-12 md:py-20 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-yellow-300 text-5xl animate-pulse">bolt</span>
                <h2 className="text-3xl md:text-4xl font-black text-yellow-300 italic tracking-wider uppercase">
                  {promo.name}
                </h2>
              </div>
              <Countdown endDate={promo.endDate} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {promo.products.map(item => {
                const usedSlots = item.totalSlots - item.remainingSlots;
                const progressPercent = item.totalSlots > 0 ? Math.min(100, Math.round((usedSlots / item.totalSlots) * 100)) : 0;
                const displayImage = item.imageUrl || "https://via.placeholder.com/300";

                return (
                  <Link key={item.productId} to={`/product/${item.productId}`} className="bg-white rounded-xl shadow-md p-3 flex flex-col hover:-translate-y-1 transition-transform group relative">
                    <div className="absolute top-2 left-2 z-10 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      {promo.name}
                    </div>
                    <div className="h-40 w-full mb-3 flex items-center justify-center p-2 bg-gray-50 rounded-lg">
                      <img src={displayImage} alt={item.name} className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <h3 className="font-bold text-sm text-[#1a1c1b] line-clamp-2 mb-2 leading-tight flex-grow">{item.name}</h3>
                      <div className="mb-2">
                        <span className="text-[#a63b00] font-black text-lg block leading-none">{item.discountedPrice.toLocaleString('vi-VN')}₫</span>
                        <span className="text-gray-400 line-through text-xs">{item.basePrice.toLocaleString('vi-VN')}₫</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-auto pt-2">
                        <div className="relative w-full h-5 bg-red-200 rounded-full overflow-hidden flex items-center justify-center">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center gap-1 z-10 text-white text-[10px] font-bold drop-shadow-md uppercase">
                            <span className="material-symbols-outlined text-[12px] text-yellow-300">local_fire_department</span>
                            Còn {item.remainingSlots}/{item.totalSlots} suất
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="mt-8 text-center">
              <Link to="/categories" className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors border border-white/50">
                Xem tất cả
              </Link>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
};
export default HomePage;