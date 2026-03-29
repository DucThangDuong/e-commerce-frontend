import React, { useEffect, useState } from 'react';
import Header from '../component/home/Header';
import Footer from '../component/home/Footer';
import OrderSidebar from '../component/order/OrderSidebar';
import OrderEntry, { type ResOrder } from '../component/order/OrderEntry';
import { apiClient } from '../untils/apiClient';
const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<ResOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<ResOrder[]>('/order/customer');
        if (Array.isArray(response)) {
          setOrders(response);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col font-['Inter']">
      <Header />

      <div className="flex flex-grow mt-16">
        <div className="hidden md:block w-64 flex-shrink-0">
          <OrderSidebar />
        </div>

        <main className="flex-1 px-4 md:px-12 py-8 min-h-screen bg-gray-50 w-full">

          <div className="space-y-8 max-w-5xl">
            {loading ? (
              <p>Loading orders...</p>
            ) : orders.length > 0 ? (
              orders.map(order => (
                <OrderEntry key={order.orderId} order={order} />
              ))
            ) : (
              <p>No completed orders found.</p>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default OrderHistoryPage;
