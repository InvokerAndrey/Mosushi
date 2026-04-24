"use client";

import type { CartLineItem } from "@/lib/types";
import CartItemCard from "./cart/CartItemCard";

type CartSummaryProps = {
  lineItems: CartLineItem[];
  totalPrice: number;
  requestError: string;
  isSubmitting: boolean;
  onIncreaseItem: (itemId: string) => void;
  onDecreaseItem: (itemId: string) => void;
  onSubmitOrder: () => void;
};

export default function CartSummary({
  lineItems,
  totalPrice,
  requestError,
  isSubmitting,
  onIncreaseItem,
  onDecreaseItem,
  onSubmitOrder
}: CartSummaryProps) {
  return (
    <div className="border-2 border-on-background bg-transparent p-md sticky top-32 bg-white">
      <h3 className="font-heading-lg text-heading-lg mb-md">YOUR ORDER</h3>

      {lineItems.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <p>Your cart is empty</p>
          <p className="text-sm mt-2">Add some sushi from the menu above</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-md">
            {lineItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onIncrease={() => onIncreaseItem(item.id)}
                onDecrease={() => onDecreaseItem(item.id)}
              />
            ))}
          </div>

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
  );
}