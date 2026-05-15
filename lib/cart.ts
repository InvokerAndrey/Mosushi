import { CART_STORAGE_KEY } from "./constants";
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
