import React from 'react';

interface OrderSummaryProps {
    subtotal: number;
    shipping: number;
    tax: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ subtotal, shipping, tax }) => {
    const total = subtotal + shipping + tax;

    return (
        <section className="mt-16 bg-white rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

            <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
                </div>

                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                    <dt className="flex items-center text-sm text-gray-600">
                        <span>Shipping estimate</span>
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">${shipping.toFixed(2)}</dd>
                </div>

                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                    <dt className="flex text-sm text-gray-600">
                        <span>Tax estimate</span>
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">${tax.toFixed(2)}</dd>
                </div>

                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                    <dt className="text-base font-bold text-gray-900">Order Total</dt>
                    <dd className="text-base font-bold text-gray-900">${total.toFixed(2)}</dd>
                </div>
            </dl>

            <div className="mt-8">
                <button type="submit" className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                    Proceed to Checkout
                </button>
            </div>

            <div className="mt-6">
                <p className="text-xs text-center text-gray-500 mb-4 uppercase tracking-widest font-semibold">Secure Checkout Guaranteed</p>
                <div className="flex justify-center space-x-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-200">
                    <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center font-bold text-[8px]">VISA</div>
                    <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center font-bold text-[8px]">MASTER</div>
                    <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center font-bold text-[8px]">AMEX</div>
                    <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center font-bold text-[8px]">PAYPAL</div>
                </div>
            </div>
        </section>
    );
};

export default OrderSummary;