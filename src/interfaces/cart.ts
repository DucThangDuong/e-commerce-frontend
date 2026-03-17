export interface CartItemType {
  cart_id: number;
  quantity: number;
  productId: number;
  name: string;
  description: string;
  categoryId: number;
  basePrice: number;
  stockQuantity: number;
  imageUrl: string[];
}

export interface RelatedProductType {
  id: number;
  name: string;
  price: number;
  color: string;
  imageUrl: string;
}
