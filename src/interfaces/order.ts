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
  colorId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
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

export interface ActiveCouponResponse {
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number | null;
  remainingUsages?: number | null;
  startDate: string;
  endDate: string;
}

export interface ApplyCouponResponse {
  subTotal: number;
  discountAmount: number;
  finalAmount: number;
  couponCode: string;
  couponName: string;
  discountType: string;
  discountValue: number;
}
