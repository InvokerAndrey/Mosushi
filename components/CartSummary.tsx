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
    <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
      <h3 className="font-bold text-text text-lg uppercase tracking-widest mb-5">Your Order</h3>

      {lineItems.length === 0 ? (
        <div className="text-center py-10 text-secondary">
          <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">
            shopping_cart
          </span>
          <p className="font-medium">Your cart is empty</p>
          <p className="text-sm mt-1 opacity-70">Add some sushi from the menu above</p>
        </div>
      ) : (
        <>
          <div className="space-y-1 mb-4">
            {lineItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onIncrease={() => onIncreaseItem(item.id)}
                onDecrease={() => onDecreaseItem(item.id)}
              />
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 mb-5">
            <div className="flex justify-between text-sm text-secondary">
              <span>Subtotal</span>
              <span>{totalPrice.toFixed(2)} BYN</span>
            </div>
            <div className="flex justify-between text-sm text-secondary">
              <span>Delivery</span>
              <span>0.00 BYN</span>
            </div>
            <div className="flex justify-between font-bold text-base text-text pt-3 border-t border-secondary/20">
              <span>Total</span>
              <span className="text-accent">{totalPrice.toFixed(2)} BYN</span>
            </div>
          </div>

          {requestError && (
            <p className="text-sm font-medium text-accent mb-3 text-center">{requestError}</p>
          )}

          <button
            type="button"
            onClick={onSubmitOrder}
            disabled={isSubmitting}
            className="w-full bg-primary text-background hover:bg-primary/90 transition-colors py-3 rounded-lg font-bold text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Placing order..." : "Place Order"}
          </button>
        </>
      )}
    </div>
  );
}
