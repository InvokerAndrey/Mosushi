import {
  CART_STORAGE_KEY,
  CUTLERY_STORAGE_KEY,
  MAX_CUTLERY_SETS,
} from "./constants";
import type { CartState } from "./types";

export const readCartFromStorage = (): CartState => {
  const saved = localStorage.getItem(CART_STORAGE_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved) as CartState;
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return {};
  }
};

export const writeCartToStorage = (cartItems: CartState): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
};

export const readCutlerySetsFromStorage = (): number => {
  const saved = localStorage.getItem(CUTLERY_STORAGE_KEY);
  if (saved === null) return 0;

  const quantity = Number(saved);
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_CUTLERY_SETS) {
    localStorage.removeItem(CUTLERY_STORAGE_KEY);
    return 0;
  }

  return quantity;
};

export const writeCutlerySetsToStorage = (quantity: number): void => {
  localStorage.setItem(CUTLERY_STORAGE_KEY, String(quantity));
};
