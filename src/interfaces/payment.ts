export interface CreatePaymentResponse {
  orderId: number;
  paymentUrl?: string | null;
  message: string;
}
