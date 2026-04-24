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
      <section ref={ref} className="mb-xl" id={id}>
        <h2 className="font-heading-lg text-heading-lg mb-lg border-b-2 border-on-background pb-xs inline-block">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
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