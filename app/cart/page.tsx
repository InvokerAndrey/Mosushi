"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { sushiMenuItems } from "@/data/sushiMenu";
import { readCartFromStorage, type CartState, writeCartToStorage } from "@/lib/cart";

type CartLineItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartState>({});
  const [isCartReady, setIsCartReady] = useState(false);

  useEffect(() => {
    setCartItems(readCartFromStorage());
    setIsCartReady(true);
  }, []);

  useEffect(() => {
    if (!isCartReady) {
      return;
    }

    writeCartToStorage(cartItems);
  }, [cartItems, isCartReady]);

  const lineItems = useMemo<CartLineItem[]>(() => {
    return sushiMenuItems
      .map((item) => {
        const quantity = cartItems[item.id] ?? 0;
        if (quantity === 0) {
          return null;
        }

        return {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity,
          lineTotal: item.price * quantity
        };
      })
      .filter((item): item is CartLineItem => item !== null);
  }, [cartItems]);

  const totalPrice = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  );

  const handleIncrease = (itemId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1
    }));
  };

  const handleDecrease = (itemId: string) => {
    setCartItems((prev) => {
      const currentQuantity = prev[itemId] ?? 0;
      if (currentQuantity <= 1) {
        const { [itemId]: _removedItem, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [itemId]: currentQuantity - 1
      };
    });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-8 space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-red-600">Your Cart</p>
        <h1 className="text-3xl font-bold text-brand-dark sm:text-4xl">Review your order</h1>
        <Link href="/menu" className="inline-flex text-sm font-semibold text-zinc-700 underline underline-offset-4">
          Back to menu
        </Link>
      </header>

      {lineItems.length === 0 ? (
        <section className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-zinc-900">Your cart is empty.</p>
          <p className="text-zinc-600">Pick your favorite sushi rolls from the menu to start your order.</p>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="space-y-4">
            {lineItems.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 rounded-md border border-zinc-200 object-cover"
                  />
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-zinc-900">{item.name}</h2>
                    <p className="text-sm text-zinc-600">${item.price.toFixed(2)} each</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center rounded-md border border-zinc-300">
                    <button
                      type="button"
                      onClick={() => handleDecrease(item.id)}
                      className="px-4 py-2 text-lg font-bold text-zinc-700 transition hover:bg-zinc-100"
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      -
                    </button>
                    <span className="min-w-10 px-2 text-center text-sm font-semibold text-zinc-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncrease(item.id)}
                      className="px-4 py-2 text-lg font-bold text-zinc-700 transition hover:bg-zinc-100"
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                  <p className="min-w-24 text-right text-base font-bold text-zinc-900">
                    ${item.lineTotal.toFixed(2)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-xl bg-zinc-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xl font-bold">Total: ${totalPrice.toFixed(2)}</p>
            <button
              type="button"
              className="rounded-md bg-red-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600"
            >
              Complete order
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
