import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import type { ResFeaturedProductDto } from '../interfaces/product';
import type { ResCategoryDto } from '../interfaces/category';
import type { ResBrandDto } from '../interfaces/brand';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const TrashPage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ResFeaturedProductDto[]>([]);
  const [categories, setCategories] = useState<ResCategoryDto[]>([]);
  const [brands, setBrands] = useState<ResBrandDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [categoriesRes, brandsRes, featuredRes] = await Promise.allSettled([
          apiClient.get<ApiResponse<ResCategoryDto[]>>('/category'),
          apiClient.get<ApiResponse<ResBrandDto[]>>('/brand'),
          apiClient.get<ApiResponse<ResFeaturedProductDto[]>>('/productfeature').catch(() => null)
        ]);

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.data) setCategories(categoriesRes.value.data);
        if (brandsRes.status === 'fulfilled' && brandsRes.value?.data) setBrands(brandsRes.value.data);
        if (featuredRes.status === 'fulfilled' && featuredRes.value?.data) setFeaturedProducts(featuredRes.value.data);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f9f9f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a63b00]"></div>
      </div>
    );
  }

  // Use featured products from API, or fallback to the first normal product
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : [];

  return (
    <main className="font-['Plus_Jakarta_Sans',sans-serif] bg-[#f9f9f7] text-[#1a1c1b]">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-20 overflow-hidden min-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKe73rN6J_dN9Dx8HuIuRgrSTRygjuC5O5qUTsgM59EFyi2k-QwPzSXkIyY1tJiFUUGvSwaitMXu9cupp-uimOzR-LdR-SgPyMxR1dM3zaUgnR1pgQrkrqWUVSmi9Dsi3mOmFmtQ2sTkNvuZjj4wMRj-VV8L8wzCty18H7-AOlken3Nc9saeRcRVjs18TQdFq9_b8fo_scXnY0Pp6Ku1S9zG-0pbetNguXMgnwGhAlZzEM_7k2IaSJ1CNoso6FU9vrRxl21sFCet4" alt="Scenic mountain road" className="w-full h-full object-cover opacity-50 mix-blend-luminosity" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#f9f9f7] via-[rgba(249,249,247,0.6)] to-[#f9f9f7]"></div>
        </div>

        {displayFeatured.length > 0 ? (
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-7xl">
            {displayFeatured.slice(0, 1).map((featured, index) => (
              <React.Fragment key={index}>
                <div className="inline-flex items-center gap-2 bg-white/75 px-4 py-1.5 rounded-full mb-6 border shadow-sm backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a63b00] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a63b00]"></span>
                  </span>
                  <span className="font-medium uppercase text-[#594138] text-xs tracking-wider">Sản phẩm nổi bật</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  {featured.product.name}
                </h1>
                <p className="text-xl text-[#594138] mx-auto mb-10 max-w-2xl">
                  {featured.product.description}
                </p>

                <div className="relative w-full flex items-center justify-center mb-12 max-w-4xl h-[400px]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 w-3/5 h-3/5 blur-[60px] z-0"></div>
                  <div className="relative z-10 h-full w-3/4 flex items-center justify-center">
                    <img 
                      src={featured.product.imageUrls && featured.product.imageUrls.length > 0 ? featured.product.imageUrls[0] : "https://via.placeholder.com/400"} 
                      alt={featured.product.name} 
                      className="w-full h-full object-contain transition-transform duration-300 hover:-translate-y-2 drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)]" 
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 z-20">
                  <Link to={`/product/${featured.product.productId}`} className="rounded-full font-semibold px-8 py-4 bg-[#a63b00] text-white shadow-[0_4px_14px_0_rgba(166,59,0,0.1)] hover:bg-[#f26522] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2">
                    Trải nghiệm ngay <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-7xl">
            <div className="inline-flex items-center gap-2 bg-white/75 px-4 py-1.5 rounded-full mb-6 border shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a63b00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a63b00]"></span>
              </span>
              <span className="font-medium uppercase text-[#594138] text-xs tracking-wider">Thế hệ mới 2026</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Đẳng cấp sống <br className="md:hidden" />
              <span className="text-[#a63b00] italic">bền vững</span>
            </h1>
            <p className="text-xl text-[#594138] mx-auto mb-10 max-w-2xl">
              Sự kết hợp hoàn hảo giữa thiết kế tinh giản, công nghệ hướng tương lai và trải nghiệm lái tĩnh tại. Định nghĩa lại sự tự do trong đô thị.
            </p>

            <div className="relative w-full flex items-center justify-center mb-12 max-w-4xl h-[400px]">
              <img src="https://i.pinimg.com/originals/ee/4e/b9/ee4eb95db689fe5a8529105f32fad80d.jpg" alt="Modern electric motorcycle" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 hover:-translate-y-2" />
            </div>
          </div>
        )}
      </section>

      {/* Explore Categories */}
      <section className="py-20 bg-[#f4f4f2] border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Khám phá theo dòng xe</h2>
            <p className="text-[#594138] mx-auto max-w-2xl text-lg">
              Từ những chiếc xe số bền bỉ đến những mẫu phân khối lớn đầy sức mạnh, chúng tôi có mọi thứ bạn cần.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <Link key={category.categoryId} to={`/categories?categoryIds=${category.categoryId}`} className="block group">
                <div className="h-full rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg flex flex-col items-center text-center border border-gray-100">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[#e9e2d0] text-[#4a4739] transition-colors duration-300 group-hover:bg-[#f26522] group-hover:text-white">
                    <span className="material-symbols-outlined text-3xl">{category.categoryId % 2 === 0 ? 'motorcycle' : 'moped'}</span>
                  </div>
                  <h3 className="font-bold uppercase mb-2 text-sm tracking-wide text-gray-900">{category.name}</h3>
                  <p className="text-[#594138] text-xs leading-relaxed m-0">{category.description}</p>
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
                        <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-4" />
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

export default TrashPage;
