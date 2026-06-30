import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../untils/apiClient';
import { useStore } from '../zustand/store';
import type { ResCartDto } from '../interfaces/cart';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<ResCartDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});
  
  // State to track which item is asking for deletion confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const updateTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const { isLogin, showNotification } = useStore();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<ResCartDto[]>>('/cart');
      if (res && res.data) {
        setCartItems(res.data);
        
        const newSelected: Record<number, boolean> = {};
        res.data.forEach(item => {
           newSelected[item.cartId] = selectedItems[item.cartId] !== undefined ? selectedItems[item.cartId] : true;
        });
        setSelectedItems(newSelected);
      }
    } catch (err) {
      console.error('Error fetching cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLogin) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [isLogin]);

  const toggleSelect = (cartId: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [cartId]: !prev[cartId]
    }));
  };

  const updateQty = async (cartId: number, change: number) => {
    const item = cartItems.find(i => i.cartId === cartId);
    if (!item) return;
    
    const newQty = item.quantity + change;

    if (newQty > 10) {
       showNotification('Chỉ được mua tối đa 10 sản phẩm mỗi loại!', 'warning');
       return;
    }

    if (newQty > item.stockQuantity) {
       showNotification(`Số lượng vượt quá tồn kho (tối đa ${item.stockQuantity})`, 'warning');
       return;
    }

    // Pause and ask for confirmation if quantity reaches 0
    if (newQty <= 0) {
      setConfirmDeleteId(cartId);
      return;
    }

    // Hide confirm if they increase again
    if (confirmDeleteId === cartId) {
      setConfirmDeleteId(null);
    }

    // Update local state for immediate UX feedback
    setCartItems(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity: newQty } : i));

    if (updateTimeoutRef.current[cartId]) {
      clearTimeout(updateTimeoutRef.current[cartId]);
    }

    updateTimeoutRef.current[cartId] = setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append('cartId', cartId.toString());
        formData.append('quantity', newQty.toString());
        
        await apiClient.postForm<any>('/cart/update', formData);
      } catch (err: any) {
        showNotification(err.response?.data?.message || 'Cập nhật số lượng thất bại!', 'danger');
        fetchCart(); // rollback on failure
      }
    }, 500);
  };

  const removeCartItem = async (cartId: number) => {
    const item = cartItems.find(i => i.cartId === cartId);
    if (!item) return;

    try {
      await apiClient.deleteQuery(`/cart?colorId=${item.colorId}`);
      setCartItems(prev => prev.filter(i => i.cartId !== cartId));
      
      const newSelected = { ...selectedItems };
      delete newSelected[cartId];
      setSelectedItems(newSelected);
      
      showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Xóa sản phẩm thất bại!', 'danger');
    }
  };

  const goToCheckout = () => {
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[Number(id)]);
    if (selectedIds.length === 0) {
      showNotification('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!', 'warning');
      return;
    }
    navigate(`/checkout?cartIds=${selectedIds.join(',')}`);
  };

  const getSingleItemPrice = (item: ResCartDto) => {
    return item.discountedPrice;
  };

  const getSelectedItemCount = () => {
    return cartItems.reduce((total, item) => {
       if (selectedItems[item.cartId]) return total + item.quantity;
       return total;
    }, 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
       if (selectedItems[item.cartId]) {
          return total + (getSingleItemPrice(item) * item.quantity);
       }
       return total;
    }, 0);
  };

  const subtotal = getSubtotal();
  const shippingFee = subtotal > 0 ? 30000 : 0;
  const grandTotal = subtotal + shippingFee;

  if (!isLogin) {
    return (
      <div className="pt-[80px] min-h-screen bg-[#f9f9f7] flex flex-col items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col items-center text-center relative z-10 max-w-md mx-4 animate-scale-in">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 relative border-4 border-white shadow-md">
            <span className="material-symbols-outlined text-5xl text-gray-400 drop-shadow-sm">login</span>
          </div>
          <h2 className="text-3xl font-heading font-black tracking-tight text-[#1a1c1b] mb-3 uppercase">Vui lòng đăng nhập</h2>
          <p className="text-gray-500 mb-8 leading-relaxed text-sm">Bạn cần đăng nhập để xem và quản lý giỏ hàng của mình.</p>
          <Link to="/login" className="w-full bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-heading font-bold shadow-lg shadow-primary/30 transition-all uppercase tracking-widest text-sm hover:-translate-y-1 hover:shadow-xl">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-[80px] min-h-screen bg-[#f9f9f7] flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[80px] bg-[#f9f9f7] font-sans text-[#1a1c1b] min-h-screen flex flex-col pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent pointer-events-none"></div>
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-7xl relative z-10">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <span className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[28px]">shopping_cart</span>
          </span>
          <h1 className="text-3xl md:text-5xl font-heading font-black text-[#1a1c1b] tracking-tight uppercase">
            Giỏ hàng
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center animate-fade-in relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gray-50 rounded-full blur-3xl pointer-events-none"></div>
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative border-4 border-white shadow-xl z-10">
              <span className="material-symbols-outlined text-[64px] text-gray-300 drop-shadow-sm">remove_shopping_cart</span>
            </div>
            <h2 className="text-3xl font-heading font-black tracking-tight text-[#1a1c1b] mb-4 uppercase relative z-10">Giỏ hàng trống</h2>
            <p className="text-gray-500 mb-10 text-sm max-w-md leading-relaxed relative z-10">Garage của bạn chưa có chiếc xe nào. Hãy khám phá ngay những mẫu xe đỉnh cao của chúng tôi!</p>
            <Link to="/categories" className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-full font-heading font-bold shadow-lg transition-all uppercase tracking-widest text-sm hover:-translate-y-1 hover:shadow-xl relative z-10">
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Cart Items List */}
            <section className="w-full lg:w-2/3">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <span className="font-heading font-bold uppercase tracking-widest text-gray-500 text-sm">Sản phẩm ({cartItems.length})</span>
                  <span className="font-heading font-bold uppercase tracking-widest text-gray-500 text-sm hidden sm:block">Tạm tính</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {cartItems.map((cart) => {
                    const price = getSingleItemPrice(cart);
                    const isSelected = !!selectedItems[cart.cartId];
                    const imgUrl = cart.imageUrl && cart.imageUrl.length > 0 
                                  ? cart.imageUrl[0] 
                                  : "https://via.placeholder.com/150";

                    return (
                      <li key={cart.cartId} className="flex flex-col hover:bg-gray-50/50 transition-colors group">
                        <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                          {/* Checkbox */}
                          <div className="shrink-0 flex items-center justify-center">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleSelect(cart.cartId)}
                                className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-primary checked:border-primary cursor-pointer transition-all hover:border-primary/50"
                              />
                              <span className="material-symbols-outlined text-white text-[14px] absolute pointer-events-none opacity-0 peer-checked:opacity-100 font-black">done</span>
                            </div>
                          </div>

                          {/* Image */}
                          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-2xl flex items-center justify-center p-2 group-hover:bg-gray-200 transition-colors relative overflow-hidden">
                            <img loading="lazy" decoding="async" src={imgUrl} alt={cart.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                          </div>

                          {/* Details */}
                          <div className="flex-grow flex flex-col sm:flex-row gap-3 min-w-0">
                            <div className="flex-grow min-w-0 flex flex-col justify-center">
                              <Link to={`/product/${cart.productId}`} className="font-heading font-black text-lg md:text-xl text-[#1a1c1b] hover:text-primary transition-colors line-clamp-2 leading-tight uppercase tracking-tight mb-1.5">
                                {cart.name}
                              </Link>
                              <div className="flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-200">
                                  {cart.colorName}
                                </span>
                              </div>
                              <div className="mt-2 sm:hidden flex flex-col">
                                {cart.appliedPromotion && (
                                  <span className="text-gray-400 line-through text-[10px] font-bold">{cart.basePrice.toLocaleString('vi-VN')} ₫</span>
                                )}
                                <p className="font-bold text-primary text-base">{price.toLocaleString('vi-VN')} ₫</p>
                              </div>
                            </div>

                            <div className="hidden sm:flex flex-col justify-center text-right shrink-0 w-36">
                              {cart.appliedPromotion ? (
                                <>
                                  <span className="text-gray-400 line-through text-xs font-bold">{cart.basePrice.toLocaleString('vi-VN')} ₫</span>
                                  <p className="font-black text-primary text-lg tracking-tight whitespace-nowrap">{price.toLocaleString('vi-VN')} ₫</p>
                                  <span className="text-[10px] uppercase font-black text-white bg-red-500 px-2 py-0.5 rounded-md self-end mt-1 tracking-widest shadow-sm">{cart.appliedPromotion.promotionName}</span>
                                </>
                              ) : (
                                <p className="font-black text-[#1a1c1b] text-lg tracking-tight whitespace-nowrap">{price.toLocaleString('vi-VN')} ₫</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end shrink-0 w-full sm:w-auto gap-3 mt-3 sm:mt-0">
                              {/* Quantity */}
                              <div className="flex items-center border-2 border-gray-100 rounded-xl bg-white h-9 shadow-sm shrink-0">
                                <button 
                                  type="button" 
                                  disabled={cart.quantity <= 1}
                                  className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors rounded-l-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                  onClick={() => updateQty(cart.cartId, -1)}
                                >
                                  <span className="material-symbols-outlined text-[16px]">remove</span>
                                </button>
                                <span className="w-8 text-center font-heading font-black text-[#1a1c1b] border-x-2 border-gray-100 h-full flex items-center justify-center text-sm">
                                  {cart.quantity}
                                </span>
                                <button 
                                  type="button" 
                                  disabled={cart.quantity >= cart.stockQuantity}
                                  className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors rounded-r-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                  onClick={() => updateQty(cart.cartId, 1)}
                                >
                                  <span className="material-symbols-outlined text-[16px]">add</span>
                                </button>
                              </div>

                              {/* Total price for this item (mobile hidden) */}
                              <div className="hidden lg:flex flex-col justify-center text-right w-36 shrink-0">
                                <span className="text-[9px] font-heading font-bold text-gray-400 uppercase tracking-widest mb-0.5">Tổng cộng</span>
                                <span className="font-black text-primary text-lg tracking-tight whitespace-nowrap">{(price * cart.quantity).toLocaleString('vi-VN')} ₫</span>
                              </div>

                              {/* Delete */}
                              <button 
                                type="button" 
                                onClick={() => removeCartItem(cart.cartId)}
                                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-100 bg-white shrink-0"
                                title="Xóa"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Confirmation Row Below Product */}
                        {confirmDeleteId === cart.cartId && (
                          <div className="bg-red-50/80 border-t border-red-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-down overflow-hidden">
                            <span className="text-red-600 font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                              <span className="material-symbols-outlined text-xl">warning</span>
                              Xóa sản phẩm này khỏi giỏ hàng?
                            </span>
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <button 
                                type="button" 
                                onClick={() => setConfirmDeleteId(null)} 
                                className="px-5 py-2.5 text-sm rounded-xl bg-white border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors uppercase tracking-widest"
                              >
                                Hủy
                              </button>
                              <button 
                                type="button" 
                                onClick={() => removeCartItem(cart.cartId)} 
                                className="px-5 py-2.5 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-colors uppercase tracking-widest"
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            {/* Summary Panel */}
            <section className="w-full lg:w-1/3">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sticky top-28 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <h2 className="text-2xl font-heading font-black tracking-tight text-[#1a1c1b] mb-8 uppercase flex items-center gap-3 border-b border-gray-100 pb-6 relative z-10">
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </span>
                  Tổng thanh toán
                </h2>

                <div className="flex flex-col gap-5 mb-8 relative z-10">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="font-bold text-sm uppercase tracking-wider">Số lượng (<span className="text-[#1a1c1b]">{getSelectedItemCount()}</span>)</span>
                    <span className="font-black text-[#1a1c1b] text-lg">{subtotal.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-gray-500 pt-5 border-t border-dashed border-gray-200">
                    <span className="font-bold text-sm uppercase tracking-wider">Phí vận chuyển</span>
                    <span className="font-black text-[#1a1c1b] text-lg">{shippingFee.toLocaleString('vi-VN')} ₫</span>
                  </div>

                  <div className="flex justify-between items-center pt-5 border-t-2 border-gray-100 mt-2">
                    <span className="text-lg font-heading font-black text-[#1a1c1b] uppercase tracking-wide">Tổng cộng</span>
                    <span className="text-3xl font-heading font-black text-primary tracking-tight">{grandTotal.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={goToCheckout}
                  disabled={subtotal === 0}
                  className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-heading font-bold py-5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm relative z-10 group"
                >
                  THANH TOÁN NGAY
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
