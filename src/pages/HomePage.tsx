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

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ResSimpleFeaturedProductDto[]>([]);
  const [categories, setCategories] = useState<ResCategoryDto[]>([]);
  const [brands, setBrands] = useState<ResBrandDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [categoriesRes, brandsRes, featuredRes] = await Promise.allSettled([
          apiClient.get<ApiResponse<ResCategoryDto[]>>('/category'),
          apiClient.get<ApiResponse<ResBrandDto[]>>('/brand'),
          apiClient.get<ApiResponse<ResSimpleFeaturedProductDto[]>>('/product/featured').catch(() => null)
        ]);

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.data) setCategories(categoriesRes.value.data);
        if (brandsRes.status === 'fulfilled' && brandsRes.value?.data) setBrands(brandsRes.value.data);
        if (featuredRes.status === 'fulfilled' && featuredRes.value?.data) {
           const sorted = featuredRes.value.data.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
           setFeaturedProducts(sorted);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ea580c]"></div>
      </div>
    );
  }

  const currentProduct = featuredProducts.length > 0 ? featuredProducts[currentSlide] : null;

  return (
    <main className="font-['Plus_Jakarta_Sans',sans-serif] bg-[#f9f9f7] text-[#1a1c1b]">
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
            <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-lg">
              Hàng ngàn mẫu xe mới, phụ kiện chính hãng & dịch vụ bảo dưỡng chuyên nghiệp.
            </p>
            <Link 
              to="/categories" 
              className="inline-block bg-[#ea580c] text-white font-bold px-8 py-3 rounded hover:bg-[#c24100] transition-colors"
            >
              XEM TẤT CẢ XE
            </Link>
          </div>

          {/* Right Image Content */}
          <div className="absolute top-0 right-0 w-full md:w-[65%] h-full flex items-center justify-center mt-10 md:mt-0 z-30 pointer-events-none">
             {currentProduct ? (
               <Link to={`/product/${currentProduct.productId}`} className="w-full h-full flex items-center justify-center group relative cursor-pointer pointer-events-auto">
                  <img 
                    src={currentProduct.firstColorImageUrl || "https://via.placeholder.com/600x400?text=No+Image"} 
                    alt="Featured Motorcycle" 
                    className="relative w-[120%] md:w-[130%] h-auto max-h-[85%] object-contain transition-transform duration-500 mix-blend-multiply drop-shadow-2xl"
                  />
               </Link>
             ) : (
                <div className="text-white text-xl">Đang cập nhật...</div>
             )}

             {/* Slider Dots */}
             {featuredProducts.length > 1 && (
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                 {featuredProducts.map((_, idx) => (
                   <button
                     key={idx}
                     onClick={() => setCurrentSlide(idx)}
                     className={`w-3 h-3 rounded-full transition-colors ${idx === currentSlide ? 'bg-[#ea580c]' : 'bg-white/60 hover:bg-white'}`}
                     aria-label={`Go to slide ${idx + 1}`}
                   ></button>
                 ))}
               </div>
             )}
          </div>

        </div>
      </section>

      {/* Explore Categories */}
      <section className="py-16 bg-[#f5f5f5]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold uppercase text-gray-900 tracking-wide">DANH MỤC SẢN PHẨM</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link key={category.categoryId} to={`/categories?categoryIds=${category.categoryId}`} className="block group">
                <div className="h-full rounded-2xl bg-white p-4 md:p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md flex flex-col items-center text-center">
                  <div className="w-full h-24 md:h-32 mb-4 flex items-center justify-center">
                    <img 
                      src={category.picture || "https://via.placeholder.com/150?text=No+Image"} 
                      alt={category.name} 
                      className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105 mix-blend-multiply" 
                    />
                  </div>
                  <h3 className="font-bold uppercase text-gray-800 text-sm md:text-base tracking-wider">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold mb-6">Thương hiệu đồng hành</h2>
              <p className="text-xl text-[#594138] mb-10">
                Chúng tôi tự hào là đối tác của những thương hiệu xe máy hàng đầu thế giới, mang đến cho bạn sự an tâm tuyệt đối về chất lượng.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-8">
                {brands.map((brand) => (
                  <Link key={brand.brandId} to={`/categories?brandIds=${brand.brandId}`} className="block group text-center cursor-pointer">
                    <div className="bg-[#f4f4f2] border border-gray-200 rounded-full shadow-sm flex items-center justify-center mb-3 overflow-hidden w-24 h-24 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-md mx-auto">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-4 mix-blend-multiply" />
                      ) : (
                        <span className="font-bold text-[#594138] uppercase text-xs">{brand.name}</span>
                      )}
                    </div>
                    <p className="font-bold uppercase m-0 text-gray-900 text-xs tracking-wider mt-2">{brand.name}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://media.techz.vn/media2019/upload2019/2022/08/26/honda_26082022150734.jpg" alt="Motorcycle showroom" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-0 bg-[#a63b00] p-6 rounded-2xl shadow-xl m-6 hidden md:block animate-[fadeInSlideUp_0.8s_ease-out_forwards]">
                <p className="text-5xl font-bold m-0 text-white mb-1">100%</p>
                <p className="m-0 text-white/80 font-medium">Chính hãng &amp; Bảo hành</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Products */}
      <section className="py-20 bg-[#f4f4f2]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mx-auto mb-12 max-w-2xl">
            <h2 className="text-4xl font-bold mb-4">Sản phẩm nổi bật</h2>
            <p className="text-[#594138] text-lg">Tinh hoa công nghệ hội tụ trong từng đường nét. Trải nghiệm sự khác biệt từ ánh nhìn đầu tiên.</p>
          </div>

          <div className="text-center mt-12">
            <Link to="/categories" className="inline-block border-2 border-gray-900 text-gray-900 rounded-full px-10 py-4 font-bold transition-colors duration-300 hover:bg-gray-900 hover:text-white">
              Xem tất cả sản phẩm
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};
export default HomePage;