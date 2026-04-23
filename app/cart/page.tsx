"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { sushiMenuItems } from "@/data/sushiMenu";
import {
  type CartState,
  readCartFromStorage,
  writeCartToStorage
} from "@/lib/cart";
import { useCheckoutForm } from "@/lib/hooks/useCheckoutForm";
import {
  validatePickupForm,
  validateDeliveryForm,
  isPickupFormFilled,
  isDeliveryFormFilled,
  formatPhoneNumber,
  formatDeliveryAddress,
  buildDeliveryComment,
  buildChangeInfo,
  type PickupFormErrors,
  type DeliveryFormErrors
} from "@/lib/validations";
import CartItemCard from "@/components/cart/CartItemCard";

type CartLineItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartState>({});
  const [isCartReady, setIsCartReady] = useState(false);
  const [pickupErrors, setPickupErrors] = useState<PickupFormErrors>({});
  const [deliveryErrors, setDeliveryErrors] = useState<DeliveryFormErrors>({});
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    activeTab,
    setActiveTab,
    pickupForm,
    setPickupForm,
    deliveryForm,
    setDeliveryForm,
    isFormReady,
    resetForms
  } = useCheckoutForm();

  // Load cart from storage on mount
  useEffect(() => {
    setCartItems(readCartFromStorage());
    setIsCartReady(true);
  }, []);

  // Persist cart to storage
  useEffect(() => {
    if (!isCartReady) return;
    writeCartToStorage(cartItems);
  }, [cartItems, isCartReady]);

  // Build line items from cart
  const lineItems = useMemo<CartLineItem[]>(() => {
    return sushiMenuItems
      .map((item) => {
        const quantity = cartItems[item.id] ?? 0;
        if (quantity === 0) return null;
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

  const activeFormFilled = activeTab === "pickup"
    ? isPickupFormFilled(pickupForm)
    : isDeliveryFormFilled(deliveryForm);

  // Cart handlers
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
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: currentQuantity - 1 };
    });
  };

  // Phone handler
  const handlePhoneChange = (value: string, isPickup: boolean) => {
    const formattedPhone = formatPhoneNumber(value);
    if (isPickup) {
      setPickupForm((prev) => ({ ...prev, phoneNumber: formattedPhone }));
      setPickupErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    } else {
      setDeliveryForm((prev) => ({ ...prev, phoneNumber: formattedPhone }));
      setDeliveryErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
  };

  // Form submission
  const handleSubmitOrder = async () => {
    if (lineItems.length === 0 || isSubmitting) return;

    const isValid = activeTab === "pickup"
      ? Object.keys(validatePickupForm(pickupForm)).length === 0
      : Object.keys(validateDeliveryForm(deliveryForm)).length === 0;

    if (!isValid) {
      if (activeTab === "pickup") {
        setPickupErrors(validatePickupForm(pickupForm));
      } else {
        setDeliveryErrors(validateDeliveryForm(deliveryForm));
      }
      return;
    }

    setRequestError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const changeInfo = buildChangeInfo(
      deliveryForm.paymentMethod,
      deliveryForm.noChange,
      deliveryForm.changeAmount
    );

    const addressString = formatDeliveryAddress(deliveryForm.address);
    const deliveryComment = buildDeliveryComment(changeInfo, deliveryForm.comment);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: activeTab,
          totalPrice,
          cartItems,
          pickup: pickupForm,
          delivery: {
            name: deliveryForm.name,
            phoneNumber: deliveryForm.phoneNumber,
            address: addressString,
            paymentMethod: deliveryForm.paymentMethod,
            comment: deliveryComment
          }
        })
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setRequestError(result.message ?? "Failed to place order.");
        return;
      }

      setSuccessMessage("Order sent successfully. We will contact you soon.");
      setCartItems({});
      setPickupErrors({});
      setDeliveryErrors({});
      resetForms();
    } catch {
      setRequestError("Something went wrong while sending the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (hasError?: boolean) => {
    const base = "w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:border-zinc-500";
    return hasError
      ? `${base} border-red-500 focus:border-red-500`
      : `${base} border-zinc-300`;
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-8 space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-red-600">Your Cart</p>
        <h1 className="text-3xl font-bold text-brand-dark sm:text-4xl">Review your order</h1>
        <Link
          href="/menu"
          className="inline-flex text-sm font-semibold text-zinc-700 underline underline-offset-4"
        >
          Back to menu
        </Link>
      </header>

      {successMessage && (
        <section className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">{successMessage}</p>
        </section>
      )}

      {lineItems.length === 0 ? (
        <section className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-zinc-900">Your cart is empty.</p>
          <p className="text-zinc-600">Pick your favorite sushi rolls from the menu to start your order.</p>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="space-y-4">
            {lineItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onIncrease={() => handleIncrease(item.id)}
                onDecrease={() => handleDecrease(item.id)}
              />
            ))}
          </div>

          <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            {/* Tab Switcher */}
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
                  activeTab === "delivery" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Delivery
              </button>
            </div>

            {activeTab === "pickup" ? (
              <PickupForm
                form={pickupForm}
                errors={pickupErrors}
                onNameChange={(value) => {
                  setPickupForm((prev) => ({ ...prev, name: value }));
                  setPickupErrors((prev) => ({ ...prev, name: undefined }));
                }}
                onPhoneChange={(value) => handlePhoneChange(value, true)}
                onCommentChange={(value) => {
                  setPickupForm((prev) => ({ ...prev, comment: value }));
                  setPickupErrors((prev) => ({ ...prev, comment: undefined }));
                }}
                getInputClassName={getInputClassName}
              />
            ) : (
              <DeliveryForm
                form={deliveryForm}
                errors={deliveryErrors}
                onNameChange={(value) => {
                  setDeliveryForm((prev) => ({ ...prev, name: value }));
                  setDeliveryErrors((prev) => ({ ...prev, name: undefined }));
                }}
                onPhoneChange={(value) => handlePhoneChange(value, false)}
                onAddressChange={(field, value) => {
                  setDeliveryForm((prev) => ({
                    ...prev,
                    address: { ...prev.address, [field]: value }
                  }));
                  setDeliveryErrors((prev) => ({ ...prev, [field]: undefined }));
                }}
                onPaymentMethodChange={(value) => {
                  setDeliveryForm((prev) => ({
                    ...prev,
                    paymentMethod: value,
                    changeAmount: "",
                    noChange: false
                  }));
                  setDeliveryErrors((prev) => ({ ...prev, paymentMethod: undefined, changeAmount: undefined }));
                }}
                onNoChangeChange={(checked) => {
                  setDeliveryForm((prev) => ({
                    ...prev,
                    noChange: checked,
                    changeAmount: checked ? "" : prev.changeAmount
                  }));
                  setDeliveryErrors((prev) => ({ ...prev, changeAmount: undefined }));
                }}
                onChangeAmountChange={(value) => {
                  setDeliveryForm((prev) => ({ ...prev, changeAmount: value }));
                  setDeliveryErrors((prev) => ({ ...prev, changeAmount: undefined }));
                }}
                onCommentChange={(value) => {
                  setDeliveryForm((prev) => ({ ...prev, comment: value }));
                  setDeliveryErrors((prev) => ({ ...prev, comment: undefined }));
                }}
                getInputClassName={getInputClassName}
              />
            )}

            {/* Total and Submit */}
            <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-900 p-4 text-white">
              <p className="text-lg font-bold">Total: ${totalPrice.toFixed(2)}</p>
              <button
                type="button"
                disabled={lineItems.length === 0 || isSubmitting || !activeFormFilled}
                onClick={handleSubmitOrder}
                className="rounded-md bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isSubmitting ? "Placing order..." : "Place Order"}
              </button>
            </div>

            {requestError && <p className="text-sm font-medium text-red-600">{requestError}</p>}
          </section>
        </section>
      )}
    </main>
  );
}

// Pickup Form Component
function PickupForm({
  form,
  errors,
  onNameChange,
  onPhoneChange,
  onCommentChange,
  getInputClassName
}: {
  form: { name: string; phoneNumber: string; comment: string };
  errors: Record<string, string>;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  getInputClassName: (hasError?: boolean) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="pickup-name" className="text-sm font-semibold text-zinc-800">
          Name *
        </label>
        <input
          id="pickup-name"
          type="text"
          value={form.name}
          onChange={(e) => onNameChange(e.target.value)}
          className={getInputClassName(!!errors.name)}
          maxLength={50}
        />
        {errors.name && <p className="text-xs font-medium text-red-600">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="pickup-phone" className="text-sm font-semibold text-zinc-800">
          Phone number *
        </label>
        <input
          id="pickup-phone"
          type="tel"
          value={form.phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={getInputClassName(!!errors.phoneNumber)}
        />
        {errors.phoneNumber && <p className="text-xs font-medium text-red-600">{errors.phoneNumber}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="pickup-comment" className="text-sm font-semibold text-zinc-800">
          Comment
        </label>
        <textarea
          id="pickup-comment"
          rows={3}
          value={form.comment}
          onChange={(e) => onCommentChange(e.target.value)}
          className={getInputClassName(!!errors.comment)}
          maxLength={200}
        />
        {errors.comment && <p className="text-xs font-medium text-red-600">{errors.comment}</p>}
      </div>
    </div>
  );
}

// Delivery Form Component
function DeliveryForm({
  form,
  errors,
  onNameChange,
  onPhoneChange,
  onAddressChange,
  onPaymentMethodChange,
  onNoChangeChange,
  onChangeAmountChange,
  onCommentChange,
  getInputClassName
}: {
  form: {
    name: string;
    phoneNumber: string;
    address: {
      street: string;
      houseNumber: string;
      apartment: string;
      entrance: string;
      floor: string;
      intercom: string;
    };
    paymentMethod: string;
    comment: string;
    changeAmount: string;
    noChange: boolean;
  };
  errors: Record<string, string>;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (field: string, value: string) => void;
  onPaymentMethodChange: (value: "CASH" | "CARD") => void;
  onNoChangeChange: (checked: boolean) => void;
  onChangeAmountChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  getInputClassName: (hasError?: boolean) => string;
}) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="delivery-name" className="text-sm font-semibold text-zinc-800">
          Name *
        </label>
        <input
          id="delivery-name"
          type="text"
          value={form.name}
          onChange={(e) => onNameChange(e.target.value)}
          className={getInputClassName(!!errors.name)}
          maxLength={50}
        />
        {errors.name && <p className="text-xs font-medium text-red-600">{errors.name}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label htmlFor="delivery-phone" className="text-sm font-semibold text-zinc-800">
          Phone number *
        </label>
        <input
          id="delivery-phone"
          type="tel"
          value={form.phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={getInputClassName(!!errors.phoneNumber)}
        />
        {errors.phoneNumber && <p className="text-xs font-medium text-red-600">{errors.phoneNumber}</p>}
      </div>

      {/* Address */}
      <div className="space-y-4">
        <label className="text-sm font-semibold text-zinc-800">Address</label>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="grid grid-cols-3 gap-3">
            <AddressField
              id="delivery-street"
              label="Street *"
              value={form.address.street}
              error={errors.street}
              onChange={(v) => onAddressChange("street", v)}
              getInputClassName={getInputClassName}
            />
            <AddressField
              id="delivery-house"
              label="House number *"
              value={form.address.houseNumber}
              error={errors.houseNumber}
              onChange={(v) => onAddressChange("houseNumber", v)}
              getInputClassName={getInputClassName}
            />
            <AddressField
              id="delivery-apartment"
              label="Apartment *"
              value={form.address.apartment}
              error={errors.apartment}
              onChange={(v) => onAddressChange("apartment", v)}
              getInputClassName={getInputClassName}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <AddressField
              id="delivery-entrance"
              label="Entrance"
              value={form.address.entrance}
              error={errors.entrance}
              onChange={(v) => onAddressChange("entrance", v)}
              getInputClassName={getInputClassName}
            />
            <AddressField
              id="delivery-floor"
              label="Floor"
              value={form.address.floor}
              error={errors.floor}
              onChange={(v) => onAddressChange("floor", v)}
              getInputClassName={getInputClassName}
            />
            <AddressField
              id="delivery-intercom"
              label="Intercom"
              value={form.address.intercom}
              error={errors.intercom}
              onChange={(v) => onAddressChange("intercom", v)}
              getInputClassName={getInputClassName}
            />
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-800">Payment method</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="CASH"
              checked={form.paymentMethod === "CASH"}
              onChange={(e) => onPaymentMethodChange(e.target.value as "CASH" | "CARD")}
              className="h-4 w-4 text-brand-dark border-zinc-300 focus:ring-brand-dark"
            />
            <span className="text-sm font-medium text-zinc-700">Cash</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked={form.paymentMethod === "CARD"}
              onChange={(e) => onPaymentMethodChange(e.target.value as "CASH" | "CARD")}
              className="h-4 w-4 text-brand-dark border-zinc-300 focus:ring-brand-dark"
            />
            <span className="text-sm font-medium text-zinc-700">Card</span>
          </label>
        </div>
        {errors.paymentMethod && <p className="text-xs font-medium text-red-600">{errors.paymentMethod}</p>}
      </div>

      {/* Change Info (Cash only) */}
      {form.paymentMethod === "CASH" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="no-change"
              checked={form.noChange}
              onChange={(e) => onNoChangeChange(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-brand-dark focus:ring-brand-dark"
            />
            <label htmlFor="no-change" className="text-sm font-medium text-zinc-700">
              No change
            </label>
          </div>
          {!form.noChange && (
            <div className="space-y-2">
              <label htmlFor="change-amount" className="text-sm font-semibold text-zinc-800">
                Prepare the change to
              </label>
              <input
                id="change-amount"
                type="text"
                value={form.changeAmount}
                onChange={(e) => onChangeAmountChange(e.target.value)}
                className={getInputClassName(!!errors.changeAmount)}
                placeholder="e.g., 20 BYN"
              />
              {errors.changeAmount && <p className="text-xs font-medium text-red-600">{errors.changeAmount}</p>}
            </div>
          )}
        </div>
      )}

      {/* Comment */}
      <div className="space-y-2">
        <label htmlFor="delivery-comment" className="text-sm font-semibold text-zinc-800">
          Comment
        </label>
        <textarea
          id="delivery-comment"
          rows={3}
          value={form.comment}
          onChange={(e) => onCommentChange(e.target.value)}
          className={getInputClassName(!!errors.comment)}
          maxLength={200}
        />
        {errors.comment && <p className="text-xs font-medium text-red-600">{errors.comment}</p>}
      </div>
    </div>
  );
}

// Address Field Sub-component
function AddressField({
  id,
  label,
  value,
  error,
  onChange,
  getInputClassName
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  getInputClassName: (hasError?: boolean) => string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-zinc-800">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={getInputClassName(!!error)}
        maxLength={50}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}