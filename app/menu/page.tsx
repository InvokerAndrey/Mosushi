"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SushiMenuCard from "@/components/SushiMenuCard";
import { sushiMenuItems } from "@/data/sushiMenu";
import { readCartFromStorage, type CartState, writeCartToStorage } from "@/lib/cart";

export default function MenuPage() {
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

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0),
    [cartItems]
  );

  const totalPrice = useMemo(() => {
    return sushiMenuItems.reduce((sum, item) => {
      const quantity = cartItems[item.id] ?? 0;
      return sum + item.price * quantity;
    }, 0);
  }, [cartItems]);

  const formattedCartText = useMemo(() => {
    if (cartCount === 0) {
      return "Cart is empty";
    }

    return `${cartCount} item${cartCount > 1 ? "s" : ""} in cart`;
  }, [cartCount]);

  const handleAddToCart = (itemId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
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
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-red-600">Mõ Sushi Menu</p>
          <h1 className="text-3xl font-bold text-brand-dark sm:text-4xl">Choose your favorite rolls</h1>
          <p className="text-zinc-600">Freshly crafted sushi with high-quality ingredients.</p>
        </div>
        <div className="space-y-3 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white">
          <p>{formattedCartText}</p>
          <p>Total: ${totalPrice.toFixed(2)}</p>
          <Link
            href="/cart"
            className="inline-flex rounded-md bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-100"
          >
            Open Cart
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sushiMenuItems.map((item) => (
          <SushiMenuCard
            key={item.id}
            item={item}
            quantityInCart={cartItems[item.id] ?? 0}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
          />
        ))}
      </section>
    </main>
  );
}
