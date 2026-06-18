import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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
      showNotification('Vui lòng đăng nhập để thêm vào giỏ hàng!', 'warning');
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.postnodata(`/product/${id}/comment`, {
        rating,
        content: reviewContent
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
      <div className="min-h-screen pt-[56px] flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a63b00]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-[56px] flex justify-center items-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-700">Sản phẩm không tồn tại</h2>
      </div>
    );
  }

  const basePrice = product.basePrice;
  const priceAdj = selectedColor?.priceAdjustment || 0;
  const discountedPrice = product.activePromotion 
    ? basePrice - (basePrice * product.activePromotion.discountPercentage / 100) 
    : basePrice;
    
  const finalPrice = discountedPrice + priceAdj;
  const finalOriginalPrice = basePrice + priceAdj;
  const isOutOfStock = !selectedColor || selectedColor.stockQuantity <= 0;

  // Get gallery images strictly from product.imageUrls from API
  const galleryImages: string[] = product.imageUrls ? [...product.imageUrls] : [];

  return (
    <div className="pt-[56px] bg-[#f9f9f7] font-['Plus_Jakarta_Sans',sans-serif] text-gray-900 min-h-screen flex flex-col overflow-x-hidden">
      <div className="flex-grow">
        <main className="container mx-auto px-4 py-12 max-w-7xl">

          {/* Top Section */}
          <div className="flex flex-col lg:flex-row items-center mb-20 pt-4 lg:pt-10">
            <div className="w-full lg:w-1/3 lg:pl-12 order-2 lg:order-2 mt-10 lg:mt-0 z-10">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 uppercase tracking-wider leading-tight">
                {product.name}
              </h1>
              <h2 className="text-[#a63b00] italic font-black uppercase mb-8 text-2xl tracking-wider">
                GIÁ & MÀU SẮC
              </h2>
              
              {/* Colors */}
              <div className="flex flex-wrap gap-6 mb-10">
                {product.colors && product.colors.map(color => (
                  <div 
                    key={color.colorId}
                    className="flex flex-col items-center cursor-pointer relative group w-12"
                    onClick={() => { setSelectedColor(color); setQuantity(1); }}
                  >
                    <div className={`mt-2 text-sm transition-colors ${selectedColor?.colorId === color.colorId ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium group-hover:text-gray-700'}`}>
                      {color.colorName}
                    </div>
                    <div className={`absolute -bottom-2 h-[2px] w-6 transition-colors ${selectedColor?.colorId === color.colorId ? 'bg-[#a63b00]' : 'bg-transparent'}`}></div>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="mb-8 mt-10">
                <p className="text-gray-500 mb-2 font-medium">Giá bán lẻ đề xuất</p>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-gray-900 text-4xl tracking-tighter">
                        {finalPrice.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-gray-500 font-bold text-lg">VNĐ</span>
                    </div>
                    {priceAdj > 0 && (
                      <div className="mt-1">
                        <span className="text-[#a63b00] font-medium text-sm">
                          Phí màu: +{priceAdj.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {product.activePromotion && (
                    <div className="flex flex-col ml-4">
                      <span className="text-[#a63b00] font-bold text-xs leading-none mb-1 px-2 py-1 bg-red-50 rounded-md self-start">
                        {product.activePromotion.name}
                      </span>
                      <span className="text-gray-400 line-through text-sm leading-none mt-1">
                        {finalOriginalPrice.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add to cart */}
              <form onSubmit={handleAddToCart} className="mt-10 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-4">
                  <div className={`inline-flex items-center border border-gray-300 rounded-lg bg-white shadow-sm h-12 ${isOutOfStock ? 'opacity-50' : ''}`}>
                    <button type="button" disabled={isOutOfStock} className="px-4 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed" onClick={() => adjustQty(-1)}>
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <input type="number" value={quantity} readOnly className="w-12 text-center font-bold text-gray-900 h-full border-x border-gray-300 focus:outline-none" />
                    <button type="button" disabled={isOutOfStock} className="px-4 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed" onClick={() => adjustQty(1)}>
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  
                  {!isOutOfStock ? (
                    <button type="submit" className="flex-1 bg-[#a63b00] hover:bg-[#8a3100] text-white h-12 font-bold rounded-lg px-6 flex items-center justify-center gap-2 shadow-sm transition-colors uppercase tracking-wider">
                      <span className="material-symbols-outlined">shopping_cart</span>
                      Thêm vào giỏ hàng
                    </button>
                  ) : (
                    <button type="button" disabled className="flex-1 bg-gray-400 text-white h-12 font-bold rounded-lg px-6 flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider cursor-not-allowed">
                      <span className="material-symbols-outlined">remove_shopping_cart</span>
                      Hết hàng
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="w-full lg:w-2/3 order-1 lg:order-1 mb-10 lg:mb-0 relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-transparent rounded-full blur-3xl opacity-50 z-0"></div>
               <div className="w-full flex items-center justify-center h-[400px] lg:h-[600px]">
                 <img src={activeImage || "https://via.placeholder.com/800"} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 hover:scale-105" />
               </div>
            </div>
          </div>

          {/* Design / Gallery */}
          {(product.description || galleryImages.length > 0) && (
            <section className="mt-20 pt-20 border-t border-gray-200">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="w-full lg:w-1/3 lg:pl-12">
                  <h3 className="text-[#a63b00] italic font-black uppercase mb-6 text-2xl tracking-wider">THIẾT KẾ</h3>
                  <h4 className="text-3xl font-bold text-gray-900 mb-6 leading-snug">
                    Thiết kế huyền thoại, đậm chất cổ điển
                  </h4>
                  <p className="text-gray-500 leading-relaxed text-[0.95rem]">
                    {product.description || "Chưa có mô tả cho sản phẩm này."}
                  </p>
                </div>
                <div className="w-full lg:w-2/3">
                  <div className="relative overflow-hidden shadow-lg rounded-2xl h-[400px] lg:h-[600px] bg-gradient-to-b from-gray-50 to-gray-200">
                    <img src={activeGalleryImage || "https://via.placeholder.com/800"} className="w-full h-full object-cover transition-all duration-500" alt="Gallery" />
                    <div className="absolute bottom-0 left-0 w-full h-[150px] bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 overflow-x-auto w-full justify-center px-8 snap-x">
                      {galleryImages.map((img, idx) => (
                        <div 
                          key={idx} 
                          className={`snap-center w-20 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${activeGalleryImage === img ? 'border-[#a63b00] opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          onClick={() => setActiveGalleryImage(img)}
                        >
                          <img src={img} className="w-full h-full object-cover" alt="Thumbnail" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <section className="mt-20 pt-16 pb-20">
              <h2 className="text-center font-light mb-16 text-gray-900 text-4xl">Thông số kỹ thuật</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8 px-4 lg:px-8">
                {product.specifications.map((spec, idx) => (
                  <div key={idx} className="flex justify-between items-center h-full border-b border-gray-100 pb-3">
                    <span className="text-gray-900 font-medium text-sm max-w-[45%]">
                      {spec.specification?.specName || spec.specName || spec.name || 'Thông số'}
                    </span>
                    <span className="text-gray-600 text-right text-sm max-w-[55%]">
                      {spec.specValue || spec.value || ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section className="mt-20 pt-20 border-t border-gray-200">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-gray-900 m-0">Đánh giá từ khách hàng</h2>
              <span className="bg-gray-100 text-gray-900 border border-gray-200 px-4 py-2 text-sm rounded-full font-medium">
                {comments.length} đánh giá
              </span>
            </div>

            {/* Review Form */}
            {isLogin && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-12">
                <h4 className="text-xl font-bold mb-6 text-gray-900">Viết đánh giá của bạn</h4>
                <form onSubmit={handleReviewSubmit}>
                  <div className="mb-6">
                    <label className="block font-medium text-gray-600 mb-2">Chất lượng sản phẩm <span className="text-red-500">*</span></label>
                    <div className="flex flex-row-reverse justify-end items-center group w-max">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <React.Fragment key={star}>
                          <input type="radio" id={`star${star}`} name="rating" value={star} className="hidden peer" checked={rating === star} onChange={() => setRating(star)} />
                          <label htmlFor={`star${star}`} className="text-4xl cursor-pointer text-gray-300 peer-checked:text-yellow-400 hover:text-yellow-400 peer-hover:text-yellow-400 transition-colors leading-none inline-block">
                            ★
                          </label>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="content" className="block font-medium text-gray-600 mb-2">Nội dung đánh giá <span className="text-red-500">*</span></label>
                    <textarea 
                      id="content" 
                      rows={4} 
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#a63b00] transition-shadow" 
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..." 
                      required 
                      minLength={10}
                    ></textarea>
                  </div>
                  <button type="submit" className="bg-[#a63b00] hover:bg-[#8a3100] text-white px-8 py-3 rounded-full font-bold shadow-sm transition-colors">
                    Gửi đánh giá
                  </button>
                </form>
              </div>
            )}

            {comments.length === 0 ? (
              <div className="text-center p-12 bg-gray-50 rounded-3xl border border-gray-200">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">chat_bubble_outline</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đánh giá nào</h3>
                <p className="text-gray-500 m-0">Hãy là người đầu tiên trải nghiệm và đánh giá sản phẩm này.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative h-full">
                    {comment.status !== 'approved' && (
                       <div className="absolute top-4 right-4">
                         <span className={`px-2 py-1 text-[10px] font-bold rounded shadow-sm ${comment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                           {comment.status === 'pending' ? 'Đang chờ duyệt' : 'Không được duyệt'}
                         </span>
                       </div>
                    )}
                    <div className="flex items-center mb-4">
                      <img src={comment.customer.avatarUrl || `https://ui-avatars.com/api/?name=${comment.customer.name}&background=random`} className="rounded-full object-cover shadow-sm border border-gray-200 w-12 h-12 mr-4" alt="Avatar" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">{comment.customer.name}</h4>
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-400 flex text-sm">
                            {[1, 2, 3, 4, 5].map(i => (
                              <span key={i}>{i <= comment.rating ? '★' : '☆'}</span>
                            ))}
                          </div>
                          <span className="text-gray-400 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 flex-grow text-[0.95rem] leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))}
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
