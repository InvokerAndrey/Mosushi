"use client";

import { forwardRef } from "react";
import type { MenuItem, Subcategory, CartState } from "@/lib/types";
import SushiMenuCard from "./SushiMenuCard";

type MenuSectionProps = {
  id: string;
  title: string;
  items: MenuItem[];
  subcategories: Subcategory[];
  cartItems: CartState;
  onAddToCart: (itemId: string) => void;
  onRemoveFromCart: (itemId: string) => void;
};

const MenuSection = forwardRef<HTMLElement, MenuSectionProps>(
  ({ id, title, items, subcategories, cartItems, onAddToCart, onRemoveFromCart }, ref) => {
    // Products with no subcategory — displayed first
    const uncategorizedItems = items.filter((item) => item.subcategory_id === null);

    return (
      <section ref={ref} id={id} className="mb-16 mt-12">
        <h2 className="font-bold text-text text-2xl uppercase tracking-widest mb-6 pb-2 border-b-2 border-secondary/30 inline-block">
          {title}
        </h2>

        {/* Products without a subcategory — always first */}
        {uncategorizedItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {uncategorizedItems.map((item) => (
              <SushiMenuCard
                key={item.id}
                item={item}
                quantityInCart={cartItems[String(item.id)] ?? 0}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
              />
            ))}
          </div>
        )}

        {/* Subcategory sections — ordered by sort_order */}
        {subcategories.map((sub) => {
          const subItems = items.filter((item) => item.subcategory_id === sub.id);
          if (subItems.length === 0) return null;
          return (
            <div key={sub.id} className="mb-10">
              <h3 className="font-semibold text-text text-lg uppercase tracking-wider mb-4 pb-1 border-b border-secondary/20 inline-block">
                {sub.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {subItems.map((item) => (
                  <SushiMenuCard
                    key={item.id}
                    item={item}
                    quantityInCart={cartItems[String(item.id)] ?? 0}
                    onAddToCart={onAddToCart}
                    onRemoveFromCart={onRemoveFromCart}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    );
  }
);

MenuSection.displayName = "MenuSection";

export default MenuSection;
