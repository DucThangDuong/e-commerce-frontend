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

  const updateTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});

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
    const priceAdj = item.priceAdjustment || 0;
    const base = item.discountedPrice || item.basePrice;
    return base + priceAdj;
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
      <div className="pt-[56px] min-h-screen bg-gray-50 flex flex-col items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">shopping_cart</span>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Vui lòng đăng nhập</h2>
        <p className="text-gray-500 mb-6">Bạn cần đăng nhập để xem giỏ hàng của mình</p>
        <Link to="/login" className="bg-[#a63b00] hover:bg-[#8a3100] text-white px-8 py-3 rounded-lg font-bold shadow-sm transition-colors">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-[56px] min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a63b00]"></div>
      </div>
    );
  }

  return (
    <div className="pt-[56px] bg-gray-50 font-['Plus_Jakarta_Sans',sans-serif] text-gray-900 min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-12 max-w-7xl">
        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tight">
          Giỏ hàng của bạn
        </h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">remove_shopping_cart</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-500 mb-8">Hãy tìm thêm các sản phẩm tuyệt vời nhé!</p>
            <Link to="/categories" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-bold shadow-sm transition-colors">
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Cart Items List */}
            <section className="w-full lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {cartItems.map((cart) => {
                    const price = getSingleItemPrice(cart);
                    const isSelected = !!selectedItems[cart.cartId];
                    const imgUrl = cart.imageUrl && cart.imageUrl.length > 0 
                                  ? cart.imageUrl[0] 
                                  : "https://via.placeholder.com/150";

                    return (
                      <li key={cart.cartId} className="flex flex-col hover:bg-gray-50 transition-colors">
                        <div className="p-4 sm:p-6 flex items-center">
                        {/* Checkbox */}
                        <div className="pr-4">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelect(cart.cartId)}
                            className="w-5 h-5 text-[#a63b00] rounded border-gray-300 focus:ring-[#a63b00] cursor-pointer"
                          />
                        </div>

                        {/* Image */}
                        <div className="flex-shrink-0">
                          <img src={imgUrl} alt={cart.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-gray-200 object-cover" />
                        </div>

                        {/* Details */}
                        <div className="ml-4 sm:ml-6 flex-grow flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-grow min-w-0">
                            <Link to={`/product/${cart.productId}`} className="text-gray-900 font-bold hover:text-[#a63b00] transition-colors line-clamp-2 leading-snug">
                              {cart.name}
                            </Link>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <span>Phân loại: <span className="font-medium text-gray-700">{cart.colorName}</span></span>
                            </div>
                            <div className="mt-1 sm:hidden">
                              <p className="font-bold text-[#a63b00]">{price.toLocaleString('vi-VN')} VNĐ</p>
                            </div>
                          </div>

                          <div className="hidden sm:block text-right flex-shrink-0 w-32">
                            <p className="m-0 font-bold text-gray-900">{price.toLocaleString('vi-VN')} VNĐ</p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end flex-shrink-0 w-full sm:w-auto gap-4 mt-2 sm:mt-0">
                            {/* Quantity */}
                            <div className="flex items-center border border-gray-300 rounded-lg bg-white h-10">
                              <button 
                                type="button" 
                                className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-l-lg"
                                onClick={() => updateQty(cart.cartId, -1)}
                              >
                                <span className="material-symbols-outlined text-[18px]">remove</span>
                              </button>
                              <span className="w-10 text-center font-bold text-gray-900 border-x border-gray-300 h-full flex items-center justify-center text-sm">
                                {cart.quantity}
                              </span>
                              <button 
                                type="button" 
                                className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-r-lg"
                                onClick={() => updateQty(cart.cartId, 1)}
                              >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                              </button>
                            </div>

                            {/* Total price for this item (mobile hidden) */}
                            <div className="hidden lg:block text-right font-black text-[#a63b00] w-32 flex-shrink-0">
                              {(price * cart.quantity).toLocaleString('vi-VN')} VNĐ
                            </div>

                            {/* Delete */}
                            <button 
                              type="button" 
                              onClick={() => removeCartItem(cart.cartId)}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                          </div>
                        </div>

                        {/* Confirmation Row Below Product */}
                        {confirmDeleteId === cart.cartId && (
                          <div className="bg-red-50/80 border-t border-red-100 px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-down">
                            <span className="text-red-600 font-medium text-sm flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">warning</span>
                              Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?
                            </span>
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <button 
                                type="button" 
                                onClick={() => setConfirmDeleteId(null)} 
                                className="px-4 py-1.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                              >
                                Hủy
                              </button>
                              <button 
                                type="button" 
                                onClick={() => removeCartItem(cart.cartId)} 
                                className="px-4 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm transition-colors"
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Tổng thanh toán</h2>

                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Số lượng (<span className="font-bold text-gray-900">{getSelectedItemCount()}</span>)</span>
                    <span className="font-bold text-gray-900">{subtotal.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-gray-600 pt-4 border-t border-gray-100">
                    <span>Tiền ship</span>
                    <span className="font-bold text-gray-900">{shippingFee.toLocaleString('vi-VN')} VNĐ</span>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                    <span className="text-2xl font-black text-[#a63b00]">{grandTotal.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={goToCheckout}
                  disabled={subtotal === 0}
                  className="w-full bg-[#a63b00] hover:bg-[#8a3100] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  THANH TOÁN
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
