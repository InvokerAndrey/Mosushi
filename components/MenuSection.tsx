"use client";

import { forwardRef } from "react";
import type { SushiMenuItem } from "@/data/sushiMenu";
import SushiMenuCard from "./SushiMenuCard";
import type { CartState } from "@/lib/types";

type MenuSectionProps = {
  id: string;
  title: string;
  items: SushiMenuItem[];
  cartItems: CartState;
  onAddToCart: (itemId: string) => void;
  onRemoveFromCart: (itemId: string) => void;
};

const MenuSection = forwardRef<HTMLElement, MenuSectionProps>(
  ({ id, title, items, cartItems, onAddToCart, onRemoveFromCart }, ref) => {
    return (
      <section ref={ref} id={id} className="mb-16 mt-12">
        <h2 className="font-bold text-text text-2xl uppercase tracking-widest mb-6 pb-2 border-b-2 border-secondary/30 inline-block">
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <SushiMenuCard
              key={item.id}
              item={item}
              quantityInCart={cartItems[item.id] ?? 0}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
            />
          ))}
        </div>
      </section>
    );
  }
);

MenuSection.displayName = "MenuSection";

export default MenuSection;
