import { useCheckoutForm } from "@/lib/hooks/useCheckoutForm";
import { validatePickupForm, validateDeliveryForm } from "@/lib/validations";

interface CheckoutFormProps {
  onSubmitOrder: () => void;
  isSubmitting: boolean;
  requestError: string;
  pickupErrors: Record<string, string | undefined>;
  deliveryErrors: Record<string, string | undefined>;
  setPickupErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  setDeliveryErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
}

export default function CheckoutForm({
  onSubmitOrder,
  isSubmitting,
  requestError,
  pickupErrors,
  deliveryErrors,
  setPickupErrors,
  setDeliveryErrors
}: CheckoutFormProps) {
  const {
    activeTab,
    setActiveTab,
    pickupForm,
    setPickupForm,
    deliveryForm,
    setDeliveryForm
  } = useCheckoutForm();

  const handlePhoneChange = (value: string, isPickup: boolean) => {
    const formattedPhone = value.startsWith("+375") ? value : "+375" + value.replace(/^\+?375/, "");
    if (formattedPhone.length > 13) return;

    if (isPickup) {
      setPickupForm((prev) => ({ ...prev, phoneNumber: formattedPhone }));
      setPickupErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    } else {
      setDeliveryForm((prev) => ({ ...prev, phoneNumber: formattedPhone }));
      setDeliveryErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
  };

  const getInputClassName = (hasError?: boolean) => {
    const base = "w-full bg-[#f3f5eb] border-2 border-on-background rounded-none focus:border-primary-container focus:border-[3px] focus:outline-none transition-all px-3 py-2 text-sm outline-none";
    return hasError
      ? `${base} border-red-500 focus:border-red-500`
      : base;
  };

  return (
    <div className="lg:col-span-7">
      <h2 className="font-heading-lg text-heading-lg mb-md">CHECKOUT</h2>

      {/* Tabs */}
      <div className="flex mb-lg border-b-2 border-on-background">
        <button
          type="button"
          onClick={() => setActiveTab("delivery")}
          className={`px-8 py-4 font-label-caps uppercase text-body-regular ${activeTab === "delivery" ? 'text-primary-container border-b-4 border-primary-container -mb-[3px] bg-white' : 'text-tertiary-container hover:text-on-background'}`}
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pickup")}
          className={`px-8 py-4 font-label-caps uppercase text-body-regular ${activeTab === "pickup" ? 'text-primary-container border-b-4 border-primary-container -mb-[3px] bg-white' : 'text-tertiary-container hover:text-on-background'}`}
        >
          Pickup
        </button>
      </div>

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSubmitOrder(); }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="font-label-caps text-label-caps uppercase mb-2">Name</label>
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
              <p className="text-xs font-medium text-red-600">{activeTab === "pickup" ? pickupErrors.name : deliveryErrors.name}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label className="font-label-caps text-label-caps uppercase mb-2">Phone</label>
            <input
              type="tel"
              value={activeTab === "pickup" ? pickupForm.phoneNumber : deliveryForm.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value, activeTab === "pickup")}
              className={getInputClassName(activeTab === "pickup" ? !!pickupErrors.phoneNumber : !!deliveryErrors.phoneNumber)}
              placeholder="+375XXXXXXXXX"
            />
            {(activeTab === "pickup" ? pickupErrors.phoneNumber : deliveryErrors.phoneNumber) && (
              <p className="text-xs font-medium text-red-600">{activeTab === "pickup" ? pickupErrors.phoneNumber : deliveryErrors.phoneNumber}</p>
            )}
          </div>
        </div>

        {activeTab === "delivery" && (
          <>
            <div className="flex flex-col">
              <label className="font-label-caps text-label-caps uppercase mb-2">Street</label>
              <input
                type="text"
                value={deliveryForm.address.street}
                onChange={(e) => {
                  setDeliveryForm(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }));
                  setDeliveryErrors(prev => ({ ...prev, street: undefined }));
                }}
                className={getInputClassName(!!deliveryErrors.street)}
                placeholder="Main Street"
                maxLength={50}
              />
              {deliveryErrors.street && <p className="text-xs font-medium text-red-600">{deliveryErrors.street}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col">
                <label className="font-label-caps text-label-caps uppercase mb-2">House #</label>
                <input
                  type="text"
                  value={deliveryForm.address.houseNumber}
                  onChange={(e) => {
                    setDeliveryForm(prev => ({
                      ...prev,
                      address: { ...prev.address, houseNumber: e.target.value }
                    }));
                    setDeliveryErrors(prev => ({ ...prev, houseNumber: undefined }));
                  }}
                  className={getInputClassName(!!deliveryErrors.houseNumber)}
                  maxLength={10}
                />
                {deliveryErrors.houseNumber && <p className="text-xs font-medium text-red-600">{deliveryErrors.houseNumber}</p>}
              </div>

              <div className="flex flex-col">
                <label className="font-label-caps text-label-caps uppercase mb-2">Apt</label>
                <input
                  type="text"
                  value={deliveryForm.address.apartment}
                  onChange={(e) => {
                    setDeliveryForm(prev => ({
                      ...prev,
                      address: { ...prev.address, apartment: e.target.value }
                    }));
                    setDeliveryErrors(prev => ({ ...prev, apartment: undefined }));
                  }}
                  className={getInputClassName(!!deliveryErrors.apartment)}
                  maxLength={10}
                />
                {deliveryErrors.apartment && <p className="text-xs font-medium text-red-600">{deliveryErrors.apartment}</p>}
              </div>

              <div className="flex flex-col">
                <label className="font-label-caps text-label-caps uppercase mb-2">Entrance</label>
                <input
                  type="text"
                  value={deliveryForm.address.entrance}
                  onChange={(e) => {
                    setDeliveryForm(prev => ({
                      ...prev,
                      address: { ...prev.address, entrance: e.target.value }
                    }));
                  }}
                  className={getInputClassName()}
                  maxLength={10}
                />
              </div>

              <div className="flex flex-col">
                <label className="font-label-caps text-label-caps uppercase mb-2">Floor</label>
                <input
                  type="text"
                  value={deliveryForm.address.floor}
                  onChange={(e) => {
                    setDeliveryForm(prev => ({
                      ...prev,
                      address: { ...prev.address, floor: e.target.value }
                    }));
                  }}
                  className={getInputClassName()}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col border-t-2 border-dashed border-on-background pt-6 mt-6">
              <label className="font-label-caps text-label-caps uppercase mb-4">Payment Method</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={deliveryForm.paymentMethod === "CASH"}
                    className="w-5 h-5 text-primary-container focus:ring-primary-container border-2 border-on-background bg-transparent"
                    name="payment"
                    type="radio"
                    value="CASH"
                    onChange={(e) => {
                      setDeliveryForm(prev => ({
                        ...prev,
                        paymentMethod: e.target.value as "CASH" | "CARD",
                        changeAmount: "",
                        noChange: false
                      }));
                      setDeliveryErrors(prev => ({ ...prev, paymentMethod: undefined, changeAmount: undefined }));
                    }}
                  />
                  <span className="font-body-regular">Cash</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={deliveryForm.paymentMethod === "CARD"}
                    className="w-5 h-5 text-primary-container focus:ring-primary-container border-2 border-on-background bg-transparent"
                    name="payment"
                    type="radio"
                    value="CARD"
                    onChange={(e) => {
                      setDeliveryForm(prev => ({
                        ...prev,
                        paymentMethod: e.target.value as "CASH" | "CARD",
                        changeAmount: "",
                        noChange: false
                      }));
                      setDeliveryErrors(prev => ({ ...prev, paymentMethod: undefined, changeAmount: undefined }));
                    }}
                  />
                  <span className="font-body-regular">Card</span>
                </label>
              </div>

              {/* Change from / No change - only when CASH */}
              {deliveryForm.paymentMethod === "CASH" && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
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
                      className="w-5 h-5 text-primary-container focus:ring-primary-container border-2 border-on-background rounded-none bg-transparent"
                    />
                    <label htmlFor="no-change" className="font-body-regular cursor-pointer">
                      No change
                    </label>
                  </div>

                  {!deliveryForm.noChange && (
                    <div className="flex flex-col">
                      <label className="font-label-caps text-label-caps uppercase mb-2">Change from</label>
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
                      {deliveryErrors.changeAmount && <p className="text-xs font-medium text-red-600">{deliveryErrors.changeAmount}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment */}
            <div className="flex flex-col pt-2">
              <label className="font-label-caps text-label-caps uppercase mb-2">Order Comment</label>
              <textarea
                className="w-full bg-[#f3f5eb] border-2 border-on-background rounded-none focus:border-primary-container focus:border-[3px] focus:outline-none transition-all p-3 font-body-regular min-h-[100px]"
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

        {activeTab === "pickup" && (
          <div className="flex flex-col pt-2">
            <label className="font-label-caps text-label-caps uppercase mb-2">Order Comment</label>
            <textarea
              className="w-full bg-[#f3f5eb] border-2 border-on-background rounded-none focus:border-primary-container focus:border-[3px] focus:outline-none transition-all p-3 font-body-regular min-h-[100px]"
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
          <p className="text-xs font-medium text-red-600">{deliveryErrors.paymentMethod}</p>
        )}
        {requestError && <p className="text-sm font-medium text-red-600">{requestError}</p>}

      </form>
    </div>
  );
}