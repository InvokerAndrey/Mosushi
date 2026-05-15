"use client";

import type { CheckoutTab, PickupFormState, DeliveryFormState } from "@/lib/validations";
import { formatPhoneNumber } from "@/lib/validations";
import TimePickerField from "@/components/TimePickerField";
import type { SiteSettings } from "@/lib/types";
import { getScheduledDeliveryStartHour } from "@/lib/timeUtils";

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
  settings: SiteSettings | null;
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
  onSubmitOrder,
  settings,
}: CheckoutFormProps) {
  const deliveryWorkStart = getScheduledDeliveryStartHour(settings?.opening_hour ?? 12);
  const deliveryWorkEnd = { hour: settings?.closing_hour ?? 22, minute: 0 };
  const handlePhoneChange = (value: string, isPickup: boolean) => {
    const formatted = formatPhoneNumber(value);
    if (isPickup) {
      setPickupForm((prev) => ({ ...prev, phoneNumber: formatted }));
      setPickupErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    } else {
      setDeliveryForm((prev) => ({ ...prev, phoneNumber: formatted }));
      setDeliveryErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
  };

  return (
    <div className="lg:col-span-7 bg-white rounded-xl shadow-md p-6 md:p-8">
      <h2 className="font-bold text-text text-lg uppercase tracking-widest mb-6">Оформление</h2>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-secondary/20">
        {(["pickup", "delivery"] as CheckoutTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              "px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors " +
              (activeTab === tab
                ? "text-accent border-b-2 border-accent -mb-px bg-white"
                : "text-secondary hover:text-text")
            }
          >
            {tab === "pickup" ? "Самовывоз" : "Доставка"}
          </button>
        ))}
      </div>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitOrder();
        }}
      >
        {/* Name + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Имя</label>
            <input
              type="text"
              value={activeTab === "pickup" ? pickupForm.name : deliveryForm.name}
              onChange={(e) => {
                if (activeTab === "pickup") {
                  setPickupForm((prev) => ({ ...prev, name: e.target.value }));
                  setPickupErrors((prev) => ({ ...prev, name: undefined }));
                } else {
                  setDeliveryForm((prev) => ({ ...prev, name: e.target.value }));
                  setDeliveryErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              className={getInputClassName(
                activeTab === "pickup" ? !!pickupErrors.name : !!deliveryErrors.name
              )}
              placeholder="Иван"
              maxLength={50}
            />
            {(activeTab === "pickup" ? pickupErrors.name : deliveryErrors.name) && (
              <p className="text-xs font-medium text-accent">
                {activeTab === "pickup" ? pickupErrors.name : deliveryErrors.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Телефон</label>
            <input
              type="tel"
              value={activeTab === "pickup" ? pickupForm.phoneNumber : deliveryForm.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value, activeTab === "pickup")}
              className={getInputClassName(
                activeTab === "pickup" ? !!pickupErrors.phoneNumber : !!deliveryErrors.phoneNumber
              )}
              placeholder="+375XXXXXXXXX"
            />
            {(activeTab === "pickup" ? pickupErrors.phoneNumber : deliveryErrors.phoneNumber) && (
              <p className="text-xs font-medium text-accent">
                {activeTab === "pickup" ? pickupErrors.phoneNumber : deliveryErrors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* ── DELIVERY fields ── */}
        {activeTab === "delivery" && (
          <>
            {/* Street */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Улица</label>
              <input
                type="text"
                value={deliveryForm.address.street}
                onChange={(e) => {
                  setDeliveryForm((prev) => ({ ...prev, address: { ...prev.address, street: e.target.value } }));
                  setDeliveryErrors((prev) => ({ ...prev, street: undefined }));
                }}
                className={getInputClassName(!!deliveryErrors.street)}
                placeholder="Ленина"
                maxLength={50}
              />
              {deliveryErrors.street && (
                <p className="text-xs font-medium text-accent">{deliveryErrors.street}</p>
              )}
            </div>

            {/* Address details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { key: "houseNumber", label: "Дом" },
                { key: "apartment", label: "Кв." },
                { key: "entrance", label: "Подъезд" },
                { key: "floor", label: "Этаж" },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider">{label}</label>
                  <input
                    type="text"
                    value={deliveryForm.address[key]}
                    onChange={(e) => {
                      setDeliveryForm((prev) => ({ ...prev, address: { ...prev.address, [key]: e.target.value } }));
                      if (key === "houseNumber" || key === "apartment") {
                        setDeliveryErrors((prev) => ({ ...prev, [key]: undefined }));
                      }
                    }}
                    className={getInputClassName(
                      key === "houseNumber"
                        ? !!deliveryErrors.houseNumber
                        : key === "apartment"
                        ? !!deliveryErrors.apartment
                        : false
                    )}
                    maxLength={10}
                  />
                  {key === "houseNumber" && deliveryErrors.houseNumber && (
                    <p className="text-xs font-medium text-accent">{deliveryErrors.houseNumber}</p>
                  )}
                  {key === "apartment" && deliveryErrors.apartment && (
                    <p className="text-xs font-medium text-accent">{deliveryErrors.apartment}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-3 border-t border-secondary/20 pt-5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Способ оплаты</label>
              <div className="flex gap-6">
                {(["CASH", "CARD"] as const).map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={deliveryForm.paymentMethod === method}
                      onChange={() => {
                        setDeliveryForm((prev) => ({
                          ...prev,
                          paymentMethod: method,
                          changeAmount: "",
                          noChange: false,
                        }));
                        setDeliveryErrors((prev) => ({
                          ...prev,
                          paymentMethod: undefined,
                          changeAmount: undefined,
                        }));
                      }}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm text-text">
                      {method === "CASH" ? "Наличные" : "Картой курьеру"}
                    </span>
                  </label>
                ))}
              </div>
              {deliveryErrors.paymentMethod && (
                <p className="text-xs font-medium text-accent">{deliveryErrors.paymentMethod}</p>
              )}

              {/* Change — only for CASH */}
              {deliveryForm.paymentMethod === "CASH" && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryForm.noChange}
                      onChange={(e) => {
                        setDeliveryForm((prev) => ({
                          ...prev,
                          noChange: e.target.checked,
                          changeAmount: e.target.checked ? "" : prev.changeAmount,
                        }));
                        setDeliveryErrors((prev) => ({ ...prev, changeAmount: undefined }));
                      }}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <span className="text-sm text-text">Без сдачи</span>
                  </label>
                  {!deliveryForm.noChange && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                        Сдача с
                      </label>
                      <input
                        type="text"
                        value={deliveryForm.changeAmount}
                        onChange={(e) => {
                          setDeliveryForm((prev) => ({ ...prev, changeAmount: e.target.value }));
                          setDeliveryErrors((prev) => ({ ...prev, changeAmount: undefined }));
                        }}
                        className={getInputClassName(!!deliveryErrors.changeAmount)}
                        placeholder="например, 50"
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

            {/* Delivery time */}
            <div className="flex flex-col gap-3 border-t border-secondary/20 pt-5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Время доставки
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery-time"
                    value="asap"
                    checked={deliveryForm.orderTime === "asap"}
                    onChange={() =>
                      setDeliveryForm((prev) => ({ ...prev, orderTime: "asap", scheduledTime: "" }))
                    }
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-text">Доставить в течение часа</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery-time"
                    value="specific"
                    checked={deliveryForm.orderTime === "specific"}
                    onChange={() =>
                      setDeliveryForm((prev) => ({ ...prev, orderTime: "specific" }))
                    }
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-text">На определённое время</span>
                </label>
              </div>
              {deliveryErrors.orderTime && (
                <p className="text-xs font-medium text-accent">{deliveryErrors.orderTime}</p>
              )}
              {deliveryForm.orderTime === "specific" && (
                <>
                  <TimePickerField
                    minOffsetMinutes={60}
                    workStart={deliveryWorkStart}
                    workEnd={deliveryWorkEnd}
                    value={deliveryForm.scheduledTime}
                    onChange={(val) => {
                      setDeliveryForm((prev) => ({ ...prev, scheduledTime: val }));
                      setDeliveryErrors((prev) => ({ ...prev, scheduledTime: undefined }));
                    }}
                    hasError={!!deliveryErrors.scheduledTime}
                  />
                  {deliveryErrors.scheduledTime && (
                    <p className="text-xs font-medium text-accent">{deliveryErrors.scheduledTime}</p>
                  )}
                </>
              )}
            </div>

            {/* Comment */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Комментарий к заказу
              </label>
              <textarea
                className="w-full bg-background border border-secondary/40 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all p-3 text-sm text-text min-h-[80px] resize-none"
                placeholder="Пожелания к заказу..."
                value={deliveryForm.comment}
                onChange={(e) => {
                  setDeliveryForm((prev) => ({ ...prev, comment: e.target.value }));
                  setDeliveryErrors((prev) => ({ ...prev, comment: undefined }));
                }}
                maxLength={200}
              />
            </div>
          </>
        )}

        {/* ── PICKUP fields ── */}
        {activeTab === "pickup" && (
          <>
            {/* Pickup time */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Время самовывоза
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pickup-time"
                    value="asap"
                    checked={pickupForm.orderTime === "asap"}
                    onChange={() => {
                      setPickupForm((prev) => ({ ...prev, orderTime: "asap", scheduledTime: "" }));
                      setPickupErrors((prev) => ({ ...prev, orderTime: undefined }));
                    }}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-text">Забрать через 30 минут</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pickup-time"
                    value="specific"
                    checked={pickupForm.orderTime === "specific"}
                    onChange={() => {
                      setPickupForm((prev) => ({ ...prev, orderTime: "specific" }));
                      setPickupErrors((prev) => ({ ...prev, orderTime: undefined }));
                    }}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-text">На определённое время</span>
                </label>
              </div>
              {pickupErrors.orderTime && (
                <p className="text-xs font-medium text-accent">{pickupErrors.orderTime}</p>
              )}
              {pickupForm.orderTime === "specific" && (
                <>
                  <TimePickerField
                    minOffsetMinutes={30}
                    workStart={settings?.opening_hour ?? 12}
                    workStartMinute={30}
                    workEnd={{ hour: settings?.closing_hour ?? 22, minute: 0 }}
                    value={pickupForm.scheduledTime}
                    onChange={(val) => {
                      setPickupForm((prev) => ({ ...prev, scheduledTime: val }));
                      setPickupErrors((prev) => ({ ...prev, scheduledTime: undefined }));
                    }}
                    hasError={!!pickupErrors.scheduledTime}
                  />
                  {pickupErrors.scheduledTime && (
                    <p className="text-xs font-medium text-accent">{pickupErrors.scheduledTime}</p>
                  )}
                </>
              )}
            </div>

            {/* Comment */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Комментарий к заказу
              </label>
              <textarea
                className="w-full bg-background border border-secondary/40 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all p-3 text-sm text-text min-h-[80px] resize-none"
                placeholder="Пожелания к заказу..."
                value={pickupForm.comment}
                onChange={(e) => {
                  setPickupForm((prev) => ({ ...prev, comment: e.target.value }));
                  setPickupErrors((prev) => ({ ...prev, comment: undefined }));
                }}
                maxLength={200}
              />
            </div>
          </>
        )}

        {/* Request / validation error */}
        {requestError && (
          <p className="text-sm font-medium text-accent">{requestError}</p>
        )}

        {/* Place Order button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-background hover:bg-primary/90 transition-colors py-3 rounded-lg font-bold text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? "Оформляем заказ..." : "Оформить заказ"}
        </button>
      </form>
    </div>
  );
}
