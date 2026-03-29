import React from 'react';

export interface ResOrderWithItems {
  quantity: number;
  unitPriceAtPurchase: number;
  name: string;
  basePrice: number;
  imageUrl: string[];
}

export interface ResOrder {
  orderId: number;
  orderDate?: string | null;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  phoneNumber?: string | null;
  address?: string | null;
  orderItems: ResOrderWithItems[];
}

interface OrderEntryProps {
  order: ResOrder;
}

const OrderEntry: React.FC<OrderEntryProps> = ({ order }) => {
  return (
    <section className="bg-white shadow-sm rounded-xl overflow-hidden mb-8">
      <div className="px-8 py-5 flex justify-between items-center border-b border-gray-100">
        <div className="flex gap-12">
          <div>
            <p className="text-[0.75rem] font-semibold text-gray-500 uppercase tracking-widest mb-1">Order ID</p>
            <p className="text-sm font-bold text-gray-900">{order.orderId}</p>
          </div>
          <div>
            <p className="text-[0.75rem] font-semibold text-gray-500 uppercase tracking-widest mb-1">Purchase Date</p>
            <p className="text-sm font-bold text-gray-900">{order.orderDate?.slice(0, 10)}</p>
          </div>
          <div>
            <p className="text-[0.75rem] font-semibold text-gray-500 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-bold text-gray-900">{order.status}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[0.75rem] font-semibold text-gray-500 uppercase tracking-widest mb-1">Order Total</p>
          <p className="text-xl font-black text-orange-600">{order.totalAmount.toLocaleString("vi-VN")} VNĐ</p>
        </div>
      </div>
      <div className="p-4 space-y-4 bg-gray-100">
        {order.orderItems.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-lg flex items-center gap-6 group hover:shadow-sm transition-shadow border border-gray-100">
            <div className="w-20 h-24 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
              <img className="w-full h-full object-cover" alt={item.name} src={item.imageUrl?.[0]} />
            </div>
            <div className="flex-grow grid grid-cols-4 items-center">
              <div className="col-span-1">
                <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="text-sm font-medium text-gray-900">{item.unitPriceAtPurchase.toLocaleString("vi-VN")} VNĐ</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Qty</p>
                <p className="text-sm font-medium text-gray-900">{item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-sm font-bold text-gray-900">{(item.unitPriceAtPurchase * item.quantity).toLocaleString("vi-VN")} VNĐ</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OrderEntry;
