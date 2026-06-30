import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import { useStore } from '../zustand/store';
import type { ResProductDto, ResProductColorDto } from '../interfaces/product';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ProductDetail extends ResProductDto {
  specifications: any[];
  images: { imageUrl: string, isPrimary?: boolean, productColor?: any }[];
}

interface CommentDto {
  id: number;
  content: string;
  rating: number;
  status: string;
  createdAt: string;
  customer: { name: string, avatarUrl?: string };
}

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for interactive UI
  const [selectedColor, setSelectedColor] = useState<ResProductColorDto | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [activeGalleryImage, setActiveGalleryImage] = useState<string>('');
  
  // States for reviews
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewError, setReviewError] = useState('');
  
  // Custom Toast state
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [fadeSuccess, setFadeSuccess] = useState(false);
  
  const [showAddError, setShowAddError] = useState(false);
  const [fadeError, setFadeError] = useState(false);
  const [addErrorMessage, setAddErrorMessage] = useState('');

  const successTimeout1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeout2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeout1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeout2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isLogin, showNotification } = useStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<ApiResponse<ProductDetail>>(`/product/detail?productId=${id}`);
        if (res && res.data) {
          setProduct(res.data);
          
          if (res.data.colors && res.data.colors.length > 0) {
            setSelectedColor(res.data.colors[0]);
          }
          
          if (res.data.imageUrls && res.data.imageUrls.length > 0) {
            setActiveImage(res.data.imageUrls[0]);
            setActiveGalleryImage(res.data.imageUrls[0]);
          } else if (res.data.images && res.data.images.length > 0) {
             setActiveImage(res.data.images[0].imageUrl);
          }

          // Fetch comments
          try {
             const commentsRes = await apiClient.get<ApiResponse<CommentDto[]>>(`/product/${id}/comments`);
             if (commentsRes && commentsRes.data) {
               setComments(commentsRes.data);
             }
          } catch (err) {
             // If no comments endpoint, it's fine
          }
        }
      } catch (err) {
        console.error('Error fetching product detail', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    if (selectedColor && selectedColor.imageUrls && selectedColor.imageUrls.length > 0) {
       setActiveImage(selectedColor.imageUrls[0]);
    } else if (product && product.imageUrls && product.imageUrls.length > 0) {
       setActiveImage(product.imageUrls[0]);
    } else if (product && product.images && product.images.length > 0) {
       const firstColorImage = product.images.find(img => img.productColor?.colorId === selectedColor?.colorId);
       if (firstColorImage) {
           setActiveImage(firstColorImage.imageUrl);
       }
    }
  }, [selectedColor, product]);

  const adjustQty = (change: number) => {
    if (!selectedColor || selectedColor.stockQuantity <= 0) return;
    const newQty = quantity + change;
    
    if (newQty > 10) {
      showNotification('Chỉ được mua tối đa 10 sản phẩm mỗi loại!', 'warning');
      return;
    }
    
    if (newQty > selectedColor.stockQuantity) {
      showNotification(`Số lượng vượt quá sản phẩm hiện có (tối đa ${selectedColor.stockQuantity})!`, 'warning');
      return;
    }

    if (newQty >= 1) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      navigate('/login');
      return;
    }
    
    if (!selectedColor) {
      showNotification('Vui lòng chọn màu sắc!', 'warning');
      return;
    }
    
    if (quantity > 10) {
      showNotification('Chỉ được mua tối đa 10 sản phẩm mỗi loại!', 'warning');
      return;
    }

    if (quantity > selectedColor.stockQuantity) {
      showNotification(`Số lượng vượt quá sản phẩm hiện có (tối đa ${selectedColor.stockQuantity})!`, 'warning');
      return;
    }

    try {
      await apiClient.post('/cart', {
        color_id: selectedColor.colorId,
        quantity
      });
      
      if (successTimeout1.current) clearTimeout(successTimeout1.current);
      if (successTimeout2.current) clearTimeout(successTimeout2.current);

      setShowAddSuccess(true);
      setFadeSuccess(false);
      successTimeout1.current = setTimeout(() => setFadeSuccess(true), 1500); // Start fading after 1.5s
      successTimeout2.current = setTimeout(() => setShowAddSuccess(false), 2500); // Remove from DOM after 2.5s
      
    } catch (err: any) {
      const errorMsg = err.message || 'Thêm vào giỏ hàng thất bại!';
      setAddErrorMessage(errorMsg);
      
      if (errorTimeout1.current) clearTimeout(errorTimeout1.current);
      if (errorTimeout2.current) clearTimeout(errorTimeout2.current);

      setShowAddError(true);
      setFadeError(false);
      errorTimeout1.current = setTimeout(() => setFadeError(true), 1500);
      errorTimeout2.current = setTimeout(() => setShowAddError(false), 2500);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLogin) {
      navigate('/login');
      return;
    }
    
    if (!selectedColor) {
      showNotification('Vui lòng chọn màu sắc!', 'warning');
      return;
    }
    
    if (quantity > 10) {
      showNotification('Chỉ được mua tối đa 10 sản phẩm mỗi loại!', 'warning');
      return;
    }

    if (quantity > selectedColor.stockQuantity) {
      showNotification(`Số lượng vượt quá sản phẩm hiện có (tối đa ${selectedColor.stockQuantity})!`, 'warning');
      return;
    }

    try {
      await apiClient.post('/cart', {
        color_id: selectedColor.colorId,
        quantity
      });
      
      // Lấy danh sách giỏ hàng để tìm cartId của sản phẩm vừa thêm
      const cartRes = await apiClient.get<any>('/cart');
      // Tùy theo cấu trúc interceptor, data có thể nằm ở cartRes.data hoặc cartRes
      const cartItems = Array.isArray(cartRes?.data) ? cartRes.data : 
                        (Array.isArray(cartRes) ? cartRes : []);
                        
      const addedItem = cartItems.find((item: any) => item.colorId === selectedColor.colorId);
      
      if (addedItem && addedItem.cartId) {
        navigate(`/checkout?cartIds=${addedItem.cartId}`);
      } else {
        // Fallback nếu không tìm thấy
        navigate('/cart');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Thêm vào giỏ hàng thất bại!';
      showNotification(errorMsg, 'danger');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    
    if (!reviewContent.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá!');
      return;
    }
    
    if (reviewContent.trim().length < 10) {
      setReviewError('Nội dung đánh giá quá ngắn (tối thiểu 10 ký tự)!');
      return;
    }

    try {
      await apiClient.postnodata(`/product/${id}/comment`, {
        rating,
        content: reviewContent.trim()
      });
      showNotification('Gửi đánh giá thành công! Đang chờ duyệt.', 'success');
      setReviewContent('');
      setRating(5);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi khi gửi đánh giá!', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-[56px] flex flex-col bg-background-light">
        <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="w-full lg:w-2/3">
              <div className="relative overflow-hidden bg-gray-200 rounded-3xl h-[400px] lg:h-[600px] w-full">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div className="w-full lg:w-1/3 space-y-6 mt-10 lg:mt-0">
              <div className="relative overflow-hidden bg-gray-200 rounded-xl h-12 w-3/4"><div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div></div>
              <div className="relative overflow-hidden bg-gray-200 rounded-xl h-8 w-1/4"><div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div></div>
              <div className="flex gap-4">
                <div className="relative overflow-hidden bg-gray-200 rounded-full h-10 w-24"><div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div></div>
                <div className="relative overflow-hidden bg-gray-200 rounded-full h-10 w-24"><div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div></div>
              </div>
              <div className="relative overflow-hidden bg-gray-200 rounded-xl h-32 w-full mt-10"><div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-[56px] flex justify-center items-center bg-background-light">
        <h2 className="text-3xl font-heading font-black tracking-tight text-[#1a1c1b] uppercase">Sản phẩm không tồn tại</h2>
      </div>
    );
  }

  const basePrice = product.basePrice;
  const priceAdj = selectedColor?.priceAdjustment || 0;
  const discountedPrice = product.discountedPrice;
    
  const finalPrice = discountedPrice + priceAdj;
  const finalOriginalPrice = basePrice + priceAdj;
  const isOutOfStock = !selectedColor || selectedColor.stockQuantity <= 0;

  // Get gallery images strictly from product.imageUrls from API
  const galleryImages: string[] = product.imageUrls ? [...product.imageUrls] : [];

  return (
    <div className="pt-[56px] bg-background-light font-sans text-[#1a1c1b] min-h-screen flex flex-col overflow-x-hidden">
      <div className="flex-grow">
        <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">

          {/* Top Section */}
          <div className="flex flex-col lg:flex-row items-center mb-20 pt-4 lg:pt-10 lg:min-h-[620px] gap-10">
            <div className="w-full lg:w-[40%] lg:pl-12 order-2 lg:order-2 mt-10 lg:mt-0 z-10 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-[#1a1c1b] mb-6 uppercase tracking-tight leading-none drop-shadow-sm">
                {product.name}
              </h1>
              
              {/* Colors (Pills) */}
              <div className="mb-8">
                <h2 className="text-[#594138] font-bold uppercase mb-4 text-sm tracking-widest">
                  Lựa chọn màu sắc
                </h2>
                <div className="flex flex-wrap gap-3">
                  {product.colors && product.colors.map(color => (
                    <button 
                      key={color.colorId}
                      type="button"
                      className={`px-5 py-2 rounded-full border-2 font-heading tracking-wider uppercase text-sm transition-all duration-300 hover:-translate-y-1 ${selectedColor?.colorId === color.colorId ? 'bg-primary border-primary text-white shadow-[0_4px_15px_rgba(166,59,0,0.4)]' : 'bg-white border-gray-200 text-[#594138] hover:border-primary-light/50 shadow-sm'}`}
                      onClick={() => { setSelectedColor(color); setQuantity(1); }}
                    >
                      {color.colorName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-10 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <p className="text-[#594138] mb-2 font-medium">Giá bán lẻ đề xuất</p>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading font-black text-primary text-5xl tracking-tighter drop-shadow-sm">
                      {finalPrice.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-primary font-bold text-xl uppercase">VNĐ</span>
                  </div>
                  {priceAdj > 0 && (
                    <div className="mt-2">
                      <span className="text-[#a63b00] font-medium text-sm bg-orange-50 px-3 py-1 rounded-full">
                        Phí màu: +{priceAdj.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  )}
                  {product.appliedPromotion && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1">
                      <span className="text-white font-heading font-bold text-xs uppercase tracking-wider px-3 py-1 bg-gradient-to-r from-red-600 to-primary rounded-md self-start shadow-sm">
                        {product.appliedPromotion.promotionName}
                      </span>
                      <span className="text-gray-400 line-through text-sm mt-1">
                        {finalOriginalPrice.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add to cart */}
              <form onSubmit={handleAddToCart} className="mt-6">
                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                  <div className={`flex items-center border-2 border-gray-200 rounded-2xl bg-white shadow-sm h-14 w-full sm:w-auto ${isOutOfStock ? 'opacity-50' : ''}`}>
                    <button type="button" disabled={isOutOfStock || quantity <= 1} className="px-4 h-full flex items-center justify-center text-[#594138] hover:bg-gray-50 rounded-l-2xl disabled:cursor-not-allowed disabled:opacity-30 transition-colors" onClick={() => adjustQty(-1)}>
                      <span className="material-symbols-outlined font-bold">remove</span>
                    </button>
                    <input type="number" value={quantity} readOnly className="w-12 text-center font-heading font-bold text-xl text-[#1a1c1b] h-full focus:outline-none bg-transparent" />
                    <button type="button" disabled={isOutOfStock || (selectedColor && quantity >= selectedColor.stockQuantity)} className="px-4 h-full flex items-center justify-center text-[#594138] hover:bg-gray-50 rounded-r-2xl disabled:cursor-not-allowed disabled:opacity-30 transition-colors" onClick={() => adjustQty(1)}>
                      <span className="material-symbols-outlined font-bold">add</span>
                    </button>
                  </div>
                  
                  {!isOutOfStock ? (
                    <div className="flex-1 flex gap-3">
                      <button type="submit" className="flex-1 bg-white border-2 border-primary text-primary hover:bg-orange-50 h-14 font-heading font-bold rounded-2xl px-2 lg:px-4 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all uppercase tracking-widest text-sm whitespace-nowrap hover:-translate-y-1">
                        <span className="material-symbols-outlined text-xl">shopping_cart</span>
                      </button>
                      <button type="button" onClick={handleBuyNow} className="flex-[2] bg-primary hover:bg-primary-hover text-white h-14 font-heading font-bold rounded-2xl px-2 lg:px-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_8px_20px_rgba(166,59,0,0.3)] transition-all uppercase tracking-widest text-sm whitespace-nowrap hover:-translate-y-1">
                        Mua ngay
                      </button>
                    </div>
                  ) : (
                    <button type="button" disabled className="flex-1 bg-gray-300 text-white h-14 font-heading font-bold rounded-2xl px-6 flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest cursor-not-allowed">
                      <span className="material-symbols-outlined">remove_shopping_cart</span>
                      Hết hàng
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="w-full lg:w-[60%] order-1 lg:order-1 relative group flex items-center justify-center">
               {/* Ánh sáng nền (Aura glow) */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl opacity-50 z-0 pointer-events-none"></div>
               
               {/* Khung ảnh cố định: bo góc, viền mờ */}
               <div className="relative z-10 w-full max-w-[1000px] aspect-[4/3] bg-white rounded-[2rem] shadow-[0_15px_50px_-12px_rgba(0,0,0,0.1)] border-4 border-white overflow-hidden flex items-center justify-center">
                 <img 
                   src={activeImage || "https://via.placeholder.com/800"} 
                   alt={product.name} 
                   className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 mix-blend-multiply origin-center p-4" 
                 />
               </div>
            </div>
          </div>

          {/* Design / Gallery */}
          {(product.description || galleryImages.length > 0) && (
            <section className="mt-10 mb-20">
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                  <div className="w-full lg:w-1/3">
                    <h3 className="text-primary font-heading font-black uppercase mb-4 text-2xl tracking-wider">THIẾT KẾ</h3>
                    <h4 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-[#1a1c1b] mb-6 leading-tight">
                      Đậm chất thể thao, uy lực và nam tính
                    </h4>
                    <p className="text-[#594138] leading-relaxed text-base">
                      {product.description || "Từng đường nét được trau chuốt tỉ mỉ, tối ưu hóa khí động học. Chiếc xe không chỉ là phương tiện di chuyển mà còn là biểu tượng của sự tự do và cá tính."}
                    </p>
                  </div>
                  <div className="w-full lg:w-2/3">
                    <div className="relative overflow-hidden shadow-xl rounded-3xl h-[400px] lg:h-[500px] bg-gray-100 group">
                      <img loading="lazy" decoding="async" src={activeGalleryImage || "https://via.placeholder.com/800"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Gallery" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 overflow-x-auto w-full justify-center px-4 snap-x pb-2 scrollbar-hide">
                        {galleryImages.map((img, idx) => (
                          <div 
                            key={idx} 
                            className={`snap-center w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all shrink-0 hover:-translate-y-1 ${activeGalleryImage === img ? 'border-primary opacity-100 shadow-[0_0_15px_rgba(166,59,0,0.5)]' : 'border-white/30 opacity-70 hover:opacity-100'}`}
                            onClick={() => setActiveGalleryImage(img)}
                          >
                            <img loading="lazy" decoding="async" src={img} className="w-full h-full object-cover" alt="Thumbnail" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <section className="mb-20">
              <h2 className="text-center font-heading font-black mb-12 text-[#1a1c1b] text-3xl md:text-4xl uppercase tracking-tight">Thông số kỹ thuật</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {product.specifications.map((spec, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-center items-center text-center h-full">
                    <span className="text-primary font-bold text-[11px] md:text-xs uppercase tracking-widest mb-2 opacity-80">
                      {spec.specification?.specName || spec.specName || spec.name || 'Thông số'}
                    </span>
                    <span className="text-[#1a1c1b] font-heading font-bold text-lg md:text-xl">
                      {spec.specValue || spec.value || ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section className="mt-20 pt-16 border-t border-gray-200">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-[#1a1c1b] m-0 uppercase">Đánh giá từ khách hàng</h2>
              <span className="bg-primary/10 text-primary px-5 py-2 text-sm rounded-full font-heading font-bold tracking-widest uppercase">
                {comments.length} đánh giá
              </span>
            </div>

            {/* Review Form */}
            {isLogin && (
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 mb-12">
                <h4 className="text-2xl font-heading font-bold tracking-tight mb-6 text-[#1a1c1b] uppercase">Viết đánh giá của bạn</h4>
                <form onSubmit={handleReviewSubmit}>
                  <div className="mb-8">
                    <label className="block font-bold text-[#1a1c1b] mb-3">Chất lượng sản phẩm <span className="text-red-500">*</span></label>
                    <div className="flex flex-row-reverse justify-end items-center group w-max">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <React.Fragment key={star}>
                          <input type="radio" id={`star${star}`} name="rating" value={star} className="hidden peer" checked={rating === star} onChange={() => setRating(star)} />
                          <label htmlFor={`star${star}`} className="text-5xl cursor-pointer text-gray-200 peer-checked:text-yellow-400 hover:text-yellow-400 peer-hover:text-yellow-400 transition-colors leading-none inline-block drop-shadow-sm">
                            ★
                          </label>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="mb-8">
                    <label htmlFor="content" className="block font-bold text-[#1a1c1b] mb-3">Nội dung đánh giá <span className="text-red-500">*</span></label>
                    <textarea 
                      id="content" 
                      rows={4} 
                      value={reviewContent}
                      onChange={(e) => {
                        setReviewContent(e.target.value);
                        if (reviewError) setReviewError('');
                      }}
                      className={`w-full bg-background-light border rounded-2xl p-5 focus:outline-none transition-all text-base ${reviewError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary'}`} 
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..." 
                    ></textarea>
                    {reviewError && (
                      <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1 animate-fade-in">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {reviewError}
                      </p>
                    )}
                  </div>
                  <button type="submit" className="bg-[#1a1c1b] hover:bg-black text-white px-10 py-4 rounded-full font-heading font-bold tracking-widest text-sm shadow-md transition-all hover:-translate-y-1 hover:shadow-lg uppercase">
                    Gửi đánh giá
                  </button>
                </form>
              </div>
            )}

            {comments.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-3xl border border-dashed border-gray-300">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">chat_bubble_outline</span>
                <h3 className="text-2xl font-heading font-bold tracking-tight text-[#1a1c1b] mb-2 uppercase">Chưa có đánh giá nào</h3>
                <p className="text-[#594138] m-0">Hãy là người đầu tiên trải nghiệm và đánh giá sản phẩm này.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
                {comments.map((comment, index) => {
                  const isLarge = index === 0 && comments.length > 2; // Bento-style logic
                  return (
                  <div key={comment.id} className={`bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col relative transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg ${isLarge ? 'md:col-span-2' : ''}`}>
                    {comment.status !== 'approved' && (
                       <div className="absolute top-6 right-6">
                         <span className={`px-3 py-1.5 text-[10px] font-heading font-bold tracking-wider uppercase rounded-full shadow-sm ${comment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                           {comment.status === 'pending' ? 'Đang chờ duyệt' : 'Không được duyệt'}
                         </span>
                       </div>
                    )}
                    <div className="flex items-center mb-6">
                      <img loading="lazy" decoding="async" src={comment.customer.avatarUrl || `https://ui-avatars.com/api/?name=${comment.customer.name}&background=random`} className="rounded-full object-cover shadow-sm border border-gray-100 w-14 h-14 mr-4" alt="Avatar" />
                      <div>
                        <h4 className="font-heading font-bold text-[#1a1c1b] text-lg uppercase">{comment.customer.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-yellow-400 flex text-base drop-shadow-sm">
                            {[1, 2, 3, 4, 5].map(i => (
                              <span key={i}>{i <= comment.rating ? '★' : '☆'}</span>
                            ))}
                          </div>
                          <span className="text-gray-400 text-xs font-medium">
                            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[#594138] flex-grow text-base leading-relaxed italic">
                      "{comment.content}"
                    </p>
                  </div>
                )})}
              </div>
            )}
          </section>

        </main>
      </div>

      {/* Center Success Toast */}
      {showAddSuccess && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-8 py-6 rounded-2xl shadow-2xl z-[9999] flex flex-col items-center gap-3 transition-opacity duration-1000 ${fadeSuccess ? 'opacity-0' : 'opacity-100'}`}>
          <span className="material-symbols-outlined text-6xl text-green-400">check_circle</span>
          <span className="font-bold text-xl tracking-tight">Thêm thành công!</span>
        </div>
      )}

      {/* Center Error Toast */}
      {showAddError && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-8 py-6 rounded-2xl shadow-2xl z-[9999] flex flex-col items-center gap-3 w-[80%] max-w-sm text-center transition-opacity duration-1000 ${fadeError ? 'opacity-0' : 'opacity-100'}`}>
          <span className="material-symbols-outlined text-6xl text-red-500">error</span>
          <span className="font-bold text-xl tracking-tight leading-tight">{addErrorMessage}</span>
        </div>
      )}

    </div>
  );
};

export default DetailPage;
