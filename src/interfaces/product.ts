import type { ReactNode } from "react";

export interface ProductDTO {
  productId: number;
  name: string;
  description: string;
  categoryId: number;
  basePrice: number;
  stockQuantity: number;
  imageUrl: string[];
}

export interface CreateProductDTO {
  name: string;
  description: string;
  base_price: number;
  stock_quantity: number;
  category_id: number;
}

export interface LayoutProps {
  children: ReactNode;
}
