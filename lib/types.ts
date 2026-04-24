import type { SushiMenuItem } from "@/data/sushiMenu";

// Shared types used across components
export type CartLineItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
};

export type CartState = Record<string, number>;

export type MenuSection = {
  id: SushiMenuItem["category"];
  title: string;
  items: SushiMenuItem[];
};