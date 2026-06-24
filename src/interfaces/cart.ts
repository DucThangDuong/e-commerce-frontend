import type { ResProductPromotionDto } from './product';

export interface ResCartDto {
  cartId: number;
  productId: number;
  colorId: number;
  colorName: string;
  quantity: number;
  categoryId: number;
  name: string;
  description?: string | null;
  basePrice: number;
  discountedPrice: number;
  appliedPromotion?: ResProductPromotionDto | null;
  stockQuantity: number;
  imageUrl?: string[] | null;
}
