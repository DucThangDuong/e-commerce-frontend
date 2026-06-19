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
  stockQuantity: number;
  imageUrl?: string[] | null;
  priceAdjustment?: number;
  discountedPrice?: number;
  activePromotion?: any;
}
