import { CART_STORAGE_KEY } from "./constants";
import type { CartState } from "./types";

// Cart storage functions
export const readCartFromStorage = (): CartState => {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (!savedCart) {
    return {};
  }

  try {
    const parsedCart = JSON.parse(savedCart) as CartState;
    return parsedCart;
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return {};
  }
};

export const writeCartToStorage = (cartItems: CartState): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
};
