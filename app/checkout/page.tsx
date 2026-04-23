"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CART_STORAGE_KEY, readCartFromStorage } from "@/lib/cart";

type PaymentMethod = "CASH" | "CARD" | "";

export default function CheckoutPage() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isOrderEnabled = useMemo(() => {
    return (
      name.trim().length > 0 &&
      phoneNumber.trim().length > 0 &&
      address.trim().length > 0 &&
      paymentMethod !== ""
    );
  }, [address, name, paymentMethod, phoneNumber]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isOrderEnabled || isSubmitting) {
      return;
    }

    const cartItems = readCartFromStorage();
    const cartHasItems = Object.values(cartItems).some((quantity) => quantity > 0);
    if (!cartHasItems) {
      setErrorMessage("Your cart is empty. Add items before placing an order.");
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          paymentMethod,
          cartItems
        })
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setErrorMessage(result.message ?? "Failed to place your order. Please try again.");
        return;
      }

      setSuccessMessage("Order sent successfully. We will contact you soon.");
      setName("");
      setPhoneNumber("");
      setAddress("");
      setPaymentMethod("");
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      setErrorMessage("Something went wrong while sending the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <header className="mb-8 space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-red-600">Checkout</p>
        <h1 className="text-3xl font-bold text-brand-dark sm:text-4xl">Complete your order</h1>
        <Link href="/cart" className="inline-flex text-sm font-semibold text-zinc-700 underline underline-offset-4">
          Back to cart
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="customer-name" className="text-sm font-semibold text-zinc-800">
            Name
          </label>
          <input
            id="customer-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone-number" className="text-sm font-semibold text-zinc-800">
            Phone number
          </label>
          <input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="+1 555 123 4567"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-semibold text-zinc-800">
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="Enter your delivery address"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-zinc-800">Payment method</legend>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                type="radio"
                name="payment-method"
                value="CASH"
                checked={paymentMethod === "CASH"}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              />
              CASH
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                type="radio"
                name="payment-method"
                value="CARD"
                checked={paymentMethod === "CARD"}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              />
              CARD
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={!isOrderEnabled || isSubmitting}
          className="w-full rounded-md bg-red-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {isSubmitting ? "Sending..." : "Order"}
        </button>

        {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm font-medium text-green-700">{successMessage}</p> : null}
      </form>
    </main>
  );
}
