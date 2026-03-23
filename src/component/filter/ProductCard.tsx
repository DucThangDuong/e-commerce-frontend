import React from 'react';
import { type ProductDTO } from "../../interfaces/product"

import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
    product: ProductDTO;
}
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/product/${product.productId}`)}
            className="group bg-white rounded-2xl hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
        >
            <div className="relative aspect-square overflow-hidden bg-slate-100">
                <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src={product.imageUrl[0]}
                />
            </div>
            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 line-clamp-1">{product.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{product.description}</p>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-l font-black text-primary">{product.basePrice.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;