import type { CartLineItem } from "@/lib/types";

interface CartSummaryProps {
  lineItems: CartLineItem[];
  totalPrice: number;
  requestError: string;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
}

export default function CartSummary({
  lineItems,
  totalPrice,
  requestError,
  onSubmitOrder,
  isSubmitting
}: CartSummaryProps) {
  return (
    <div className="lg:col-span-5 mt-lg lg:mt-0">
      <div className="border-2 border-on-background bg-transparent p-md sticky top-32 bg-white">
        <h3 className="font-heading-lg text-heading-lg mb-md">YOUR ORDER</h3>

        {/* Cart Items */}
        {lineItems.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <p>Your cart is empty</p>
            <p className="text-sm mt-2">Add some sushi from the menu above</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-md">
              {lineItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-2 border-b border-dashed border-zinc-300">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover border border-on-background flex-shrink-0"
                  />

                  <div className="flex-grow min-w-0">
                    <h4 className="font-product-name text-sm truncate">{item.name}</h4>
                    <span className="font-price text-sm text-primary-container">{item.price.toFixed(2)} BYN</span>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="font-price text-sm font-bold text-primary-container min-w-[60px] text-right">
                      {item.lineTotal.toFixed(2)} BYN
                    </span>
                    <span className="text-xs text-zinc-500">x{item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 space-y-2 mb-lg">
              <div className="flex justify-between font-body-regular text-tertiary-container">
                <span>Subtotal</span>
                <span className="min-w-[60px] text-right">{totalPrice.toFixed(2)} BYN</span>
              </div>
              <div className="flex justify-between font-body-regular text-tertiary-container">
                <span>Delivery</span>
                <span className="min-w-[60px] text-right">0.00 BYN</span>
              </div>
              <div className="flex justify-between font-price text-xl mt-4 pt-4 border-t-2 border-on-background">
                <span>Total</span>
                <span className="text-primary-container min-w-[60px] text-right">{totalPrice.toFixed(2)} BYN</span>
              </div>
            </div>

            {requestError && (
              <p className="text-sm font-medium text-red-600 mb-3 text-center">{requestError}</p>
            )}
            <button
              type="button"
              onClick={onSubmitOrder}
              disabled={isSubmitting}
              className="bg-primary-container text-white border-b-2 border-on-background rounded-none hover:opacity-90 transition-opacity w-full py-4 font-heading-lg text-xl uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Placing order..." : "Place Order"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}