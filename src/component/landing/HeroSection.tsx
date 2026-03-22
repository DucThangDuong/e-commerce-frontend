import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../untils/apiClient';
import type { ProductFeatureDTO } from '../../interfaces/product';

const HeroSection: React.FC = () => {
  const [featuredData, setFeaturedData] = useState<ProductFeatureDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const result = await apiClient.get<ProductFeatureDTO[] | ProductFeatureDTO>('/product/featured');
        if (Array.isArray(result)) {
          setFeaturedData(result);
        } else if (result) {
          setFeaturedData([result]);
        }
      } catch (error) {
        console.error('Failed to fetch featured products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (featuredData.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredData.length]);

  const featured = featuredData.length > 0 ? featuredData[currentIndex] : null;

  const currentTitle = featured?.product?.name || 'BORN ON THE TRACK.';
  const words = currentTitle.split(' ');
  const firstWord = words[0];
  const restOfTitle = words.slice(1).join(' ');

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#dcd9d9]">
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-center">
        <h1 className="font-['Space_Grotesk'] font-black text-[30rem] leading-none text-[#b90014] break-all text-center transition-opacity duration-1000">
          {featured ? firstWord.substring(0, 8).toUpperCase() : 'KINETIC'}
        </h1>
      </div>
      <div className="max-w-7xl mx-auto px-8 w-full grid md:grid-cols-12 items-center gap-12 relative z-10">
        <div className="md:col-span-6 space-y-8">
          <div className="inline-flex items-center px-3 py-1 bg-[#b90014]/10 text-[#b90014] border border-[#b90014]/20 text-xs font-bold tracking-widest uppercase">
            {featured ? 'Sản phẩm nổi bật' : 'New Arrival: Apex V4'}
          </div>
          <h2 className="text-5xl md:text-8xl font-['Space_Grotesk'] font-extrabold tracking-tighter leading-[0.85] text-[#1c1b1b] min-h-[150px]">
            {firstWord} <br /><span className="text-[#b90014] italic">{restOfTitle}</span>
          </h2>
          <p className="text-xl text-[#5d3f3c] max-w-md font-light leading-relaxed line-clamp-3">
            {featured?.product?.description || 'Engineered without compromise. Experience the raw mechanical precision of the new Apex Series. 215hp of pure adrenaline.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {featured ? (
              <Link to={`/product/${featured.productId}`} className="bg-gradient-to-br from-[#b90014] to-[#e31b23] text-white px-10 py-4 font-bold uppercase tracking-widest rounded-sm text-sm flex items-center justify-center group">
                MUA NGAY
                <span className="material-symbols-outlined ml-2 transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
            ) : (
              <Link to="/categories" className="bg-gradient-to-br from-[#b90014] to-[#e31b23] text-white px-10 py-4 font-bold uppercase tracking-widest rounded-sm text-sm flex items-center justify-center group">
                EXPLORE PERFORMANCE
                <span className="material-symbols-outlined ml-2 transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
            )}
          </div>
          {/* Navigation dots */}
          {featuredData.length > 1 && (
            <div className="flex gap-2 pt-4">
              {featuredData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#b90014]' : 'w-2 bg-[#b90014]/30 hover:bg-[#b90014]/60'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-6 relative flex justify-center">
          <div className="absolute -z-10 w-[120%] h-[120%] bg-radial-gradient from-[#b90014]/20 to-transparent rounded-full blur-3xl opacity-50"></div>
          <img
            key={featured?.productId || 'default'}
            className={`w-full max-w-[500px] h-[500px] object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)] ${loading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'} hover:scale-105 transition-all duration-700 ease-out`}
            alt={featured?.product?.name || "Modern sports motorcycle"}
            src={featured?.product?.imageUrl?.[0] || "https://lh3.googleusercontent.com/aida-public/AB6AXuCDUDPX9PHpwDlUKH0V0pIyyvv2evgIUEZXfVe1Jiwl71Ir_XhRSPO_eg7pd5HXZZ551dYSbvUN3NXetKRwAUkYvS9-3VSJXQj8ZCvvdkIPPIohGM7MJ2SrKr0ae2F2gnki3IgNTrx-eAHwmqglQVQ5i3VX4EZmJRBaZMMxiPDDCuHdLL0sK6MOSC_u-tJw8Pi78t7tv_Ku00UVL1KmrunNYVSzsK5Ox2Nu-IHNZxyluBlLxLifzVFcQvpYKn1cbmQdD72XNu8EPGU"}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
