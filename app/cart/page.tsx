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

type CheckoutTab = "pickup" | "delivery";
type DeliveryPaymentMethod = "CASH" | "CARD" | "OTHER" | "";

type PickupFormState = {
  name: string;
  phoneNumber: string;
  comment: string;
};

type DeliveryFormState = {
  name: string;
  phoneNumber: string;
  address: string;
  paymentMethod: DeliveryPaymentMethod;
  comment: string;
};

type PickupFormErrors = Partial<Record<keyof PickupFormState, string>>;
type DeliveryFormErrors = Partial<Record<keyof DeliveryFormState, string>>;

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartState>({});
  const [isCartReady, setIsCartReady] = useState(false);
  const [activeTab, setActiveTab] = useState<CheckoutTab>("pickup");
  const [pickupForm, setPickupForm] = useState<PickupFormState>({
    name: "",
    phoneNumber: "",
    comment: ""
  });
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>({
    name: "",
    phoneNumber: "",
    address: "",
    paymentMethod: "",
    comment: ""
  });
  const [pickupErrors, setPickupErrors] = useState<PickupFormErrors>({});
  const [deliveryErrors, setDeliveryErrors] = useState<DeliveryFormErrors>({});
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const isPickupFormFilled = pickupForm.name.trim().length > 0 && pickupForm.phoneNumber.trim().length > 0;
  const isDeliveryFormFilled =
    deliveryForm.name.trim().length > 0 &&
    deliveryForm.phoneNumber.trim().length > 0 &&
    deliveryForm.address.trim().length > 0 &&
    deliveryForm.paymentMethod !== "";
  const isActiveFormFilled = activeTab === "pickup" ? isPickupFormFilled : isDeliveryFormFilled;

  const validatePickupForm = () => {
    const errors: PickupFormErrors = {};
    if (!pickupForm.name.trim()) {
      errors.name = "Name is required.";
    }
    if (!pickupForm.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    }

    setPickupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDeliveryForm = () => {
    const errors: DeliveryFormErrors = {};
    if (!deliveryForm.name.trim()) {
      errors.name = "Name is required.";
    }
    if (!deliveryForm.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    }
    if (!deliveryForm.address.trim()) {
      errors.address = "Address is required.";
    }
    if (!deliveryForm.paymentMethod) {
      errors.paymentMethod = "Payment method is required.";
    }

    setDeliveryErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

  const handleSubmitOrder = async () => {
    if (lineItems.length === 0 || isSubmitting) {
      return;
    }

    const isValid = activeTab === "pickup" ? validatePickupForm() : validateDeliveryForm();
    if (!isValid) {
      return;
    }

    setRequestError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderType: activeTab,
          totalPrice,
          cartItems,
          pickup: pickupForm,
          delivery: deliveryForm
        })
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setRequestError(result.message ?? "Failed to place order.");
        return;
      }

      setSuccessMessage("Order sent successfully. We will contact you soon.");
      setCartItems({});
      setPickupForm({ name: "", phoneNumber: "", comment: "" });
      setDeliveryForm({ name: "", phoneNumber: "", address: "", paymentMethod: "", comment: "" });
      setPickupErrors({});
      setDeliveryErrors({});
    } catch {
      setRequestError("Something went wrong while sending the order.");
    } finally {
      setIsSubmitting(false);
    }
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

      {successMessage ? (
        <section className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">{successMessage}</p>
        </section>
      ) : null}

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

          <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("pickup")}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeTab === "pickup" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Pickup
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("delivery")}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeTab === "delivery"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Delivery
              </button>
            </div>

            {activeTab === "pickup" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="pickup-name" className="text-sm font-semibold text-zinc-800">
                    Name
                  </label>
                  <input
                    id="pickup-name"
                    type="text"
                    value={pickupForm.name}
                    onChange={(event) => {
                      setPickupForm((prev) => ({ ...prev, name: event.target.value }));
                      setPickupErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                  />
                  {pickupErrors.name ? <p className="text-xs font-medium text-red-600">{pickupErrors.name}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="pickup-phone" className="text-sm font-semibold text-zinc-800">
                    Phone number
                  </label>
                  <input
                    id="pickup-phone"
                    type="tel"
                    value={pickupForm.phoneNumber}
                    onChange={(event) => {
                      setPickupForm((prev) => ({ ...prev, phoneNumber: event.target.value }));
                      setPickupErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                  />
                  {pickupErrors.phoneNumber ? (
                    <p className="text-xs font-medium text-red-600">{pickupErrors.phoneNumber}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="pickup-comment" className="text-sm font-semibold text-zinc-800">
                    Optional comment
                  </label>
                  <textarea
                    id="pickup-comment"
                    rows={3}
                    value={pickupForm.comment}
                    onChange={(event) => setPickupForm((prev) => ({ ...prev, comment: event.target.value }))}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="delivery-name" className="text-sm font-semibold text-zinc-800">
                    Name
                  </label>
                  <input
                    id="delivery-name"
                    type="text"
                    value={deliveryForm.name}
                    onChange={(event) => {
                      setDeliveryForm((prev) => ({ ...prev, name: event.target.value }));
                      setDeliveryErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                  />
                  {deliveryErrors.name ? (
                    <p className="text-xs font-medium text-red-600">{deliveryErrors.name}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="delivery-phone" className="text-sm font-semibold text-zinc-800">
                    Phone number
                  </label>
                  <input
                    id="delivery-phone"
                    type="tel"
                    value={deliveryForm.phoneNumber}
                    onChange={(event) => {
                      setDeliveryForm((prev) => ({ ...prev, phoneNumber: event.target.value }));
                      setDeliveryErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                  />
                  {deliveryErrors.phoneNumber ? (
                    <p className="text-xs font-medium text-red-600">{deliveryErrors.phoneNumber}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="delivery-address" className="text-sm font-semibold text-zinc-800">
                    Address
                  </label>
                  <textarea
                    id="delivery-address"
                    rows={3}
                    value={deliveryForm.address}
                    onChange={(event) => {
                      setDeliveryForm((prev) => ({ ...prev, address: event.target.value }));
                      setDeliveryErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                  />
                  {deliveryErrors.address ? (
                    <p className="text-xs font-medium text-red-600">{deliveryErrors.address}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="delivery-payment" className="text-sm font-semibold text-zinc-800">
                    Payment method
                  </label>
                  <select
                    id="delivery-payment"
                    value={deliveryForm.paymentMethod}
                    onChange={(event) => {
                      setDeliveryForm((prev) => ({
                        ...prev,
                        paymentMethod: event.target.value as DeliveryPaymentMethod
                      }));
                      setDeliveryErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                    }}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                  >
                    <option value="">Select payment method</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {deliveryErrors.paymentMethod ? (
                    <p className="text-xs font-medium text-red-600">{deliveryErrors.paymentMethod}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="delivery-comment" className="text-sm font-semibold text-zinc-800">
                    Optional comment
                  </label>
                  <textarea
                    id="delivery-comment"
                    rows={3}
                    value={deliveryForm.comment}
                    onChange={(event) => setDeliveryForm((prev) => ({ ...prev, comment: event.target.value }))}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-900 p-4 text-white">
              <p className="text-lg font-bold">Total: ${totalPrice.toFixed(2)}</p>
              <button
                type="button"
                disabled={lineItems.length === 0 || isSubmitting || !isActiveFormFilled}
                onClick={handleSubmitOrder}
                className="rounded-md bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isSubmitting ? "Placing order..." : "Place Order"}
              </button>
            </div>

            {requestError ? <p className="text-sm font-medium text-red-600">{requestError}</p> : null}
          </section>
        </section>
      )}
    </main>
  );
}
