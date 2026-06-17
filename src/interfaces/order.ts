export interface ResOrderWithItems {
  colorId: number;
  colorName: string;
  quantity: number;
  unitPriceAtPurchase: number;
  name: string;
  basePrice: number;
  imageUrl: string[];
}

export interface ResOrder {
  orderId: number;
  orderDate?: string | null;
  updatedAt?: string | null;
  totalAmount: number;
  originalAmount: number;
  discountAmount?: number | null;
  status: string;
  paymentStatus: string;
  phoneNumber?: string | null;
  address?: string | null;
  totalItems: number;
  orderItems: ResOrderWithItems[];
}

export interface CartItemRequest {
  colorId: number;
  quantity: number;
}

export interface ValidatedCartItem {
  // Add proper fields here based on your backend or reuse another interface if applicable
}

export interface ValidateCartResponse {
  subTotal: number;
  items: ValidatedCartItem[];
}

export interface CalculateOrderResponse {
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  couponId?: number | null;
  couponCode?: string | null;
}
