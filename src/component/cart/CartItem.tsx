import React from 'react';
import type { CartItemType } from '../../interfaces/cart';

interface CartItemProps {
    item: CartItemType;
    onIncrease?: (productId: number) => void;
    onDecrease?: (productId: number) => void;
    onRemove?: (productId: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onIncrease, onDecrease, onRemove }) => {
    return (
        <li className="flex items-center py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
            {/* 1. Checkbox */}
            <div className="pr-3">
                <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                />
            </div>

            {/* 2. Hình ảnh (Thu nhỏ) */}
            <div className="flex-shrink-0">
                <img
                    alt={item.name}
                    src={item.imageUrl?.[0] || 'https://via.placeholder.com/150'}
                    className="w-12 h-12 rounded-md object-cover border border-gray-200"
                />
            </div>

            {/* 3. Nội dung dàn ngang (Tên, Giá, Số lượng, Tổng, Xóa) */}
            <div className="ml-4 flex flex-1 items-center gap-4 min-w-0">
                
                {/* Thông tin sản phẩm */}
                <div className="flex-[2] min-w-0">
                    <a href="#" className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors duration-200 truncate block">
                        {item.name}
                    </a>
                    <p className="mt-0.5 text-xs text-gray-500">${item.basePrice.toFixed(2)}</p>
                </div>

                {/* Nút tăng/giảm số lượng */}
                <div className="flex-1 flex justify-center min-w-[100px]">
                    <div className="flex items-center border border-gray-300 rounded h-7 bg-white">
                        <button
                            type="button"
                            className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors rounded-l"
                            onClick={() => onDecrease?.(item.productId)}
                        >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>

                        <span className="w-8 text-center text-xs font-medium text-gray-900 border-x border-gray-200 leading-7">
                            {item.quantity}
                        </span>

                        <button
                            type="button"
                            className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors rounded-r"
                            onClick={() => onIncrease?.(item.productId)}
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                    </div>
                </div>

                {/* Tổng tiền của item */}
                <div className="flex-1 text-sm font-bold text-gray-900 text-right min-w-[70px]">
                    ${(item.basePrice * item.quantity).toFixed(2)}
                </div>

                {/* Nút Xóa */}
                <button
                    type="button"
                    className="p-1.5 ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200 flex-shrink-0"
                    onClick={() => onRemove?.(item.productId)}
                >
                    <span className="sr-only">Remove</span>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>

            </div>
        </li>
    );
};

export default CartItem;