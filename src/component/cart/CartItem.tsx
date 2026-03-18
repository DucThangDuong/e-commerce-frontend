import React from "react";
import type { CartItemType } from "../../interfaces/cart";

interface CartItemProps {
  item: CartItemType;
  onIncrease?: (productId: number) => void;
  onDecrease?: (productId: number) => void;
  onRemove?: (productId: number) => void;
  isSelected?: boolean;
  onToggleSelect?: (productId: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  isSelected,
  onToggleSelect,
}) => {
  return (
    <li className="flex items-center py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
      <div className="pr-3">
        <input
          type="checkbox"
          checked={isSelected || false}
          onChange={() => onToggleSelect?.(item.productId)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
        />
      </div>

      <div className="flex-shrink-0">
        <img
          alt={item.name}
          src={item.imageUrl?.[0]}
          className="w-12 h-12 rounded-md object-cover border border-gray-200"
        />
      </div>

      <div className="ml-4 flex flex-1 items-center gap-4 min-w-0">
        <div className="flex-[2] min-w-0">
          <a
            href="#"
            className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors duration-200 truncate block"
          >
            {item.name}
          </a>
        </div>
        <div className="flex-1 text-end">
          <p className="mt-0.5 text-xs text-gray-500">
            {item.basePrice.toFixed(3)} VND
          </p>
        </div>

        {/* Nút tăng/giảm số lượng */}
        <div className="flex-1 flex justify-start min-w-[100px]">
          <div className="flex items-center border border-gray-300 rounded h-7 bg-white">
            <button
              onClick={() => onDecrease?.(item.productId)}
              type="button"
              className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors rounded-l"
            >
              <span className="material-symbols-outlined text-[16px]">
                remove
              </span>
            </button>

            <span className="w-8 text-center text-xs font-medium text-gray-900 border-x border-gray-200 leading-7">
              {item.quantity}
            </span>

            <button
              onClick={() => onIncrease?.(item.productId)}
              type="button"
              className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors rounded-r"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>

        {/* Tổng tiền của item */}
        <div className="flex-1 text-sm font-bold text-gray-900 text-right min-w-[70px]">
          {(item.basePrice * item.quantity).toFixed(3)} VND
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
