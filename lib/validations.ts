import {
  PHONE_REGEX,
  MAX_NAME_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_ADDRESS_FIELD_LENGTH,
  PHONE_PREFIX,
  CHECKOUT_FORM_STORAGE_KEY
} from "./constants";

// Type definitions
export type CheckoutTab = "pickup" | "delivery";

export type DeliveryPaymentMethod = "CASH" | "CARD" | "";

export type PickupFormState = {
  name: string;
  phoneNumber: string;
  comment: string;
};

export type DeliveryAddress = {
  street: string;
  houseNumber: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
};

export type DeliveryFormState = {
  name: string;
  phoneNumber: string;
  address: DeliveryAddress;
  paymentMethod: DeliveryPaymentMethod;
  comment: string;
  changeAmount: string;
  noChange: boolean;
};

export type PersistedCheckoutForm = {
  activeTab: CheckoutTab;
  pickupForm: PickupFormState;
  deliveryForm: DeliveryFormState;
};

export type PickupFormErrors = Partial<Record<keyof PickupFormState, string>>;
export type DeliveryFormErrors = Partial<Record<keyof DeliveryFormState, string>> &
  Partial<Record<keyof DeliveryAddress, string>>;

// Factory functions for empty forms
export const createEmptyPickupForm = (): PickupFormState => ({
  name: "",
  phoneNumber: PHONE_PREFIX,
  comment: ""
});

export const createEmptyDeliveryForm = (): DeliveryFormState => ({
  name: "",
  phoneNumber: PHONE_PREFIX,
  address: {
    street: "",
    houseNumber: "",
    apartment: "",
    entrance: "",
    floor: "",
    intercom: ""
  },
  paymentMethod: "" as DeliveryPaymentMethod,
  comment: "",
  changeAmount: "",
  noChange: false
});

// Validation functions
export function validatePickupForm(form: PickupFormState): PickupFormErrors {
  const errors: PickupFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  } else if (form.name.trim().length > MAX_NAME_LENGTH) {
    errors.name = `Name must be at most ${MAX_NAME_LENGTH} characters.`;
  }

  const phone = form.phoneNumber.trim();
  if (phone.length <= PHONE_PREFIX.length) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phoneNumber = "Phone must start with +375 and be 13 characters long.";
  }

  if (form.comment.trim().length > MAX_COMMENT_LENGTH) {
    errors.comment = `Comment must be at most ${MAX_COMMENT_LENGTH} characters.`;
  }

  return errors;
}

export function validateDeliveryForm(form: DeliveryFormState): DeliveryFormErrors {
  const errors: DeliveryFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  } else if (form.name.trim().length > MAX_NAME_LENGTH) {
    errors.name = `Name must be at most ${MAX_NAME_LENGTH} characters.`;
  }

  const phone = form.phoneNumber.trim();
  if (phone.length <= PHONE_PREFIX.length) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phoneNumber = "Phone must start with +375 and be 13 characters long.";
  }

  const address = form.address;

  if (!address.street.trim()) {
    errors.street = "Street is required.";
  } else if (address.street.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.street = `Street must be at most ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  }

  if (!address.houseNumber.trim()) {
    errors.houseNumber = "House number is required.";
  } else if (address.houseNumber.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.houseNumber = `House number must be at most ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  }

  if (!address.apartment.trim()) {
    errors.apartment = "Apartment is required.";
  } else if (address.apartment.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.apartment = `Apartment must be at most ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  }

  if (address.entrance.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.entrance = `Entrance must be at most ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  }

  if (address.floor.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.floor = `Floor must be at most ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  }

  if (address.intercom.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.intercom = `Intercom must be at most ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  }

  if (!form.paymentMethod) {
    errors.paymentMethod = "Payment method is required.";
  }

  if (form.paymentMethod === "CASH" && !form.noChange) {
    if (!form.changeAmount.trim()) {
      errors.changeAmount = "Change amount is required for cash payment.";
    }
  }

  if (form.comment.trim().length > MAX_COMMENT_LENGTH) {
    errors.comment = `Comment must be at most ${MAX_COMMENT_LENGTH} characters.`;
  }

  return errors;
}

// Helper functions
export function isPickupFormFilled(form: PickupFormState): boolean {
  return form.name.trim().length > 0 && form.phoneNumber.trim().length > PHONE_PREFIX.length;
}

export function isDeliveryAddressFilled(address: DeliveryAddress): boolean {
  return (
    address.street.trim().length > 0 &&
    address.houseNumber.trim().length > 0 &&
    address.apartment.trim().length > 0
  );
}

export function isDeliveryFormFilled(form: DeliveryFormState): boolean {
  return (
    form.name.trim().length > 0 &&
    form.phoneNumber.trim().length > PHONE_PREFIX.length &&
    isDeliveryAddressFilled(form.address) &&
    form.paymentMethod !== ""
  );
}

export function formatPhoneNumber(value: string): string {
  let newValue = value;
  if (!newValue.startsWith(PHONE_PREFIX)) {
    newValue = PHONE_PREFIX + newValue.replace(/^\+?375/, "");
  }
  if (newValue.length > 13) {
    newValue = newValue.substring(0, 13);
  }
  return newValue;
}

export function formatDeliveryAddress(address: DeliveryAddress): string {
  return `${address.street}, ${address.houseNumber}${address.apartment ? `, apt ${address.apartment}` : ""}${address.entrance ? `, entrance ${address.entrance}` : ""}${address.floor ? `, floor ${address.floor}` : ""}${address.intercom ? `, intercom ${address.intercom}` : ""}`;
}

export function buildDeliveryComment(changeInfo: string, userComment: string): string {
  if (changeInfo && userComment.trim()) {
    return `${changeInfo}\n${userComment}`;
  }
  if (changeInfo) {
    return changeInfo;
  }
  return userComment;
}

export function buildChangeInfo(paymentMethod: string, noChange: boolean, changeAmount: string): string {
  if (paymentMethod !== "CASH") {
    return "";
  }
  if (noChange) {
    return "Change: No";
  }
  return `Change: from ${changeAmount} BYN`;
}

// Checkout form storage functions
export const readCheckoutFormFromStorage = (): PersistedCheckoutForm | null => {
  try {
    const saved = localStorage.getItem(CHECKOUT_FORM_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as PersistedCheckoutForm;
    if (
      parsed &&
      typeof parsed === "object" &&
      "activeTab" in parsed &&
      "pickupForm" in parsed &&
      "deliveryForm" in parsed
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const writeCheckoutFormToStorage = (formData: PersistedCheckoutForm): void => {
  try {
    localStorage.setItem(CHECKOUT_FORM_STORAGE_KEY, JSON.stringify(formData));
  } catch {
    // Silently fail if localStorage is not available
  }
};

export const clearCheckoutFormFromStorage = (): void => {
  try {
    localStorage.removeItem(CHECKOUT_FORM_STORAGE_KEY);
  } catch {
    // Silently fail
  }
};
