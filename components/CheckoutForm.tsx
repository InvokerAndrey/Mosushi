"use client";

import type { CheckoutTab, PickupFormState, DeliveryFormState } from "@/lib/validations";
import { formatPhoneNumber } from "@/lib/validations";

type CheckoutFormProps = {
  activeTab: CheckoutTab;
  setActiveTab: (tab: CheckoutTab) => void;
  pickupForm: PickupFormState;
  setPickupForm: React.Dispatch<React.SetStateAction<PickupFormState>>;
  deliveryForm: DeliveryFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  pickupErrors: Record<string, string | undefined>;
  deliveryErrors: Record<string, string | undefined>;
  setPickupErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  setDeliveryErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  requestError: string;
  isSubmitting: boolean;
  onSubmitOrder: () => void;
};

function getInputClassName(hasError?: boolean) {
  const base =
    "w-full bg-background border border-secondary/40 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all px-3 py-2 text-sm text-text";
  return hasError ? base + " border-accent" : base;
}

export default function CheckoutForm({
  activeTab,
  setActiveTab,
  pickupForm,
  setPickupForm,
  deliveryForm,
  setDeliveryForm,
  pickupErrors,
  deliveryErrors,
  setPickupErrors,
  setDeliveryErrors,
  requestError,
  isSubmitting,
  onSubmitOrder
}: CheckoutFormProps) {
  const handlePhoneChange = (value: string, isPickup: boolean) => {
    const formattedPhone = formatPhoneNumber(value);
    if (isPickup) {
      setPickupForm((prev) => ({ ...prev, phoneNumber: formattedPhone }));
      setPickupErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    } else {
      setDeliveryForm((prev) => ({ ...prev, phoneNumber: formattedPhone }));
      setDeliveryErrors((prev) => ({ ...prev, phoneNumber: formattedPhone }));
    }
  };

  return (
    <div className="lg:col-span-7 bg-white rounded-xl shadow-md p-6 md:p-8">
      <h2 className="font-bold text-text text-lg uppercase tracking-widest mb-6">Checkout</h2>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-secondary/20">
        <button
          type="button"
          onClick={() => setActiveTab("delivery")}
          className={
            "px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors " +
            (activeTab === "delivery"
              ? "text-accent border-b-2 border-accent -mb-px bg-white"
              : "text-secondary hover:text-text")
          }
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pickup")}
          className={
            "px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors " +
            (activeTab === "pickup"
              ? "text-accent border-b-2 border-accent -mb-px bg-white"
              : "text-secondary hover:text-text")
          }
        >
          Pickup
        </button>
      </div>

      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSubmitOrder(); }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={activeTab === "pickup" ? pickupForm.name : deliveryForm.name}
              onChange={(e) => {
                if (activeTab === "pickup") {
                  setPickupForm(prev => ({ ...prev, name: e.target.value }));
                  setPickupErrors(prev => ({ ...prev, name: undefined }));
                } else {
                  setDeliveryForm(prev => ({ ...prev, name: e.target.value }));
                  setDeliveryErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              className={getInputClassName(activeTab === "pickup" ? !!pickupErrors.name : !!deliveryErrors.name)}
              placeholder="John Doe"
              maxLength={50}
            />
            {(activeTab === "pickup" ? pickupErrors.name : deliveryErrors.name) && (
              <p className="text-xs font-medium text-accent">
                {activeTab === "pickup" ? pickupErrors.name : deliveryErrors.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Phone</label>
            <input
              type="tel"
              value={activeTab === "pickup" ? pickupForm.phoneNumber : deliveryForm.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value, activeTab === "pickup")}
              className={getInputClassName(activeTab === "pickup" ? !!pickupErrors.phoneNumber : !!deliveryErrors.phoneNumber)}
              placeholder="+375XXXXXXXXX"
            />
            {(activeTab === "pickup" ? pickupErrors.phoneNumber : deliveryErrors.phoneNumber) && (
              <p className="text-xs font-medium text-accent">
                {activeTab === "pickup" ? pickupErrors.phoneNumber : deliveryErrors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Delivery-specific fields */}
        {activeTab === "delivery" && (
          <>
            {/* Street */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Street</label>
              <input
                type="text"
                value={deliveryForm.address.street}
                onChange={(e) => {
                  setDeliveryForm(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }));
                  setDeliveryErrors(prev => ({ ...prev, street: undefined }));
                }}
                className={getInputClassName(!!deliveryErrors.street)}
                placeholder="Main Street"
                maxLength={50}
              />
              {deliveryErrors.street && (
                <p className="text-xs font-medium text-accent">{deliveryErrors.street}</p>
              )}
            </div>

            {/* Address details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">House #</label>
                <input
                  type="text"
                  value={deliveryForm.address.houseNumber}
                  onChange={(e) => {
                    setDeliveryForm(prev => ({ ...prev, address: { ...prev.address, houseNumber: e.target.value } }));
                  }}
                  className={getInputClassName(!!deliveryErrors.houseNumber)}
                  maxLength={10}
                />
                {deliveryErrors.houseNumber && (
                  <p className="text-xs font-medium text-accent">{deliveryErrors.houseNumber}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Apt</label>
                <input
                  type="text"
                  value={deliveryForm.address.apartment}
                  onChange={(e) => {
                    setDeliveryForm(prev => ({ ...prev, address: { ...prev.address, apartment: e.target.value } }));
                  }}
                  className={getInputClassName(!!deliveryErrors.apartment)}
                  maxLength={10}
                />
                {deliveryErrors.apartment && (
                  <p className="text-xs font-medium text-accent">{deliveryErrors.apartment}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Entrance</label>
                <input
                  type="text"
                  value={deliveryForm.address.entrance}
                  onChange={(e) => {
                    setDeliveryForm(prev => ({ ...prev, address: { ...prev.address, entrance: e.target.value } }));
                  }}
                  className={getInputClassName()}
                  maxLength={10}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Floor</label>
                <input
                  type="text"
                  value={deliveryForm.address.floor}
                  onChange={(e) => {
                    setDeliveryForm(prev => ({ ...prev, address: { ...prev.address, floor: e.target.value } }));
                  }}
                  className={getInputClassName()}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-3 border-t border-secondary/20 pt-5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Payment Method</label>
              <div className="flex gap-6">
                {(["CASH", "CARD"] as const).map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={deliveryForm.paymentMethod === method}
                      onChange={(e) => {
                        setDeliveryForm(prev => ({
                          ...prev,
                          paymentMethod: e.target.value as "CASH" | "CARD",
                          changeAmount: "",
                          noChange: false
                        }));
                        setDeliveryErrors(prev => ({ ...prev, paymentMethod: undefined, changeAmount: undefined }));
                      }}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm text-text">{method === "CASH" ? "Cash" : "Card"}</span>
                  </label>
                ))}
              </div>

              {/* Change fields — only for CASH */}
              {deliveryForm.paymentMethod === "CASH" && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="no-change"
                      checked={deliveryForm.noChange}
                      onChange={(e) => {
                        setDeliveryForm(prev => ({
                          ...prev,
                          noChange: e.target.checked,
                          changeAmount: e.target.checked ? "" : prev.changeAmount
                        }));
                        setDeliveryErrors(prev => ({ ...prev, changeAmount: undefined }));
                      }}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <span className="text-sm text-text">No change needed</span>
                  </label>

                  {!deliveryForm.noChange && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Change from</label>
                      <input
                        type="text"
                        value={deliveryForm.changeAmount}
                        onChange={(e) => {
                          setDeliveryForm(prev => ({ ...prev, changeAmount: e.target.value }));
                          setDeliveryErrors(prev => ({ ...prev, changeAmount: undefined }));
                        }}
                        className={getInputClassName(!!deliveryErrors.changeAmount)}
                        placeholder="e.g. 50"
                        maxLength={20}
                      />
                      {deliveryErrors.changeAmount && (
                        <p className="text-xs font-medium text-accent">{deliveryErrors.changeAmount}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Order Comment</label>
              <textarea
                className="w-full bg-background border border-secondary/40 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all p-3 text-sm text-text min-h-[90px] resize-none"
                placeholder="Any special requests?"
                value={deliveryForm.comment}
                onChange={(e) => {
                  setDeliveryForm(prev => ({ ...prev, comment: e.target.value }));
                  setDeliveryErrors(prev => ({ ...prev, comment: undefined }));
                }}
                maxLength={200}
              />
            </div>
          </>
        )}

        {/* Pickup comment */}
        {activeTab === "pickup" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Order Comment</label>
            <textarea
              className="w-full bg-background border border-secondary/40 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all p-3 text-sm text-text min-h-[90px] resize-none"
              placeholder="Any special requests?"
              value={pickupForm.comment}
              onChange={(e) => {
                setPickupForm(prev => ({ ...prev, comment: e.target.value }));
                setPickupErrors(prev => ({ ...prev, comment: undefined }));
              }}
              maxLength={200}
            />
          </div>
        )}

        {activeTab === "delivery" && deliveryErrors.paymentMethod && (
          <p className="text-xs font-medium text-accent">{deliveryErrors.paymentMethod}</p>
        )}
        {requestError && (
          <p className="text-sm font-medium text-accent">{requestError}</p>
        )}
      </form>
    </div>
  );
}
