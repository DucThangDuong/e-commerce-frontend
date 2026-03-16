import type { ReactNode } from "react";

export interface ProductDTO {
  productId: number;
  name: string;
  description: string;
  categoryId: number;
  basePrice: number;
  stockQuantity: number;
}

export interface CreateProductDTO {
  name: string;
  description: string;
  categoryId: number;
  basePrice: number;
  stockQuantity: number;
}

export interface LayoutProps {
  children: ReactNode;
}
