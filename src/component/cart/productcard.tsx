import React from 'react';
import { type ProductDTO } from "../../interfaces/product"
import { apiClient } from "../../untils/apiClient";

interface ProductCardProps {
    product: ProductDTO;
}
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="relative aspect-square overflow-hidden bg-slate-100">
                <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src={product.imageUrl[0]}
                />
                <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-slate-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined">favorite</span>
                </button>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 line-clamp-1">{product.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{product.description}</p>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-black text-primary">${product.basePrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;