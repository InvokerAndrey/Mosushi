"use client";

import type { CartLineItem } from "@/lib/types";
import type { CheckoutTab } from "@/lib/validations";
import CartItemCard from "./cart/CartItemCard";

type CartSummaryProps = {
  lineItems: CartLineItem[];
  subtotalPrice: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  activeTab: CheckoutTab;
  onIncreaseItem: (itemId: string) => void;
  onDecreaseItem: (itemId: string) => void;
  onClearCart: () => void;
};

export default function CartSummary({
  lineItems,
  subtotalPrice,
  deliveryFee,
  freeDeliveryThreshold,
  activeTab,
  onIncreaseItem,
  onDecreaseItem,
  onClearCart
}: CartSummaryProps) {
  const grandTotal = subtotalPrice + deliveryFee;
  const isDelivery = activeTab === "delivery";

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header row: title + clear button */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-text text-lg uppercase tracking-widest">Ваш заказ</h3>
        {lineItems.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="bg-accent text-white hover:bg-accent-dark transition-colors px-4 py-1.5 rounded-lg font-semibold text-xs cursor-pointer"
          >
            Очистить
          </button>
        )}
      </div>

      {lineItems.length === 0 ? (
        <div className="text-center py-10 text-secondary">
          <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">
            shopping_cart
          </span>
          <p className="font-medium">Корзина пуста</p>
          <p className="text-sm mt-1 opacity-60">Добавьте суши из меню выше</p>
        </div>
      ) : (
        <>
          {/* Item list */}
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
          <div className="space-y-2 pt-4">
            {isDelivery && (
              <>
                <div className="flex justify-between text-sm text-secondary">
                  <span>Сумма заказа</span>
                  <span>{subtotalPrice.toFixed(2)} BYN</span>
                </div>
                <div className="flex justify-between text-sm text-secondary">
                  <span>Доставка</span>
                  {deliveryFee === 0 ? (
                    <span className="text-secondary font-semibold">Бесплатно</span>
                  ) : (
                    <span>{deliveryFee.toFixed(2)} BYN</span>
                  )}
                </div>
                {deliveryFee > 0 && subtotalPrice < freeDeliveryThreshold && (
                  <p className="text-xs text-secondary/70">
                    Бесплатная доставка от {freeDeliveryThreshold} BYN
                  </p>
                )}
              </>
            )}
            <div className="flex justify-between font-bold text-base text-text pt-3 border-t border-secondary/20">
              <span>Итого</span>
              <span className="text-accent">{grandTotal.toFixed(2)} BYN</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
