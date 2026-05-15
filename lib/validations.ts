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
export type OrderTimeType = "asap" | "specific";
export type DeliveryPaymentMethod = "CASH" | "CARD" | "";

export type PickupFormState = {
  name: string;
  phoneNumber: string;
  orderTime: OrderTimeType;
  scheduledTime: string;
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
  orderTime: OrderTimeType;
  scheduledTime: string;
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
  orderTime: "asap",
  scheduledTime: "",
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
  noChange: false,
  orderTime: "asap",
  scheduledTime: ""
});

// Validation functions
export function validatePickupForm(form: PickupFormState): PickupFormErrors {
  const errors: PickupFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Введите имя.";
  } else if (form.name.trim().length > MAX_NAME_LENGTH) {
    errors.name = `Имя не должно превышать ${MAX_NAME_LENGTH} символов.`;
  }

  const phone = form.phoneNumber.trim();
  if (phone.length <= PHONE_PREFIX.length) {
    errors.phoneNumber = "Введите номер телефона.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phoneNumber = "Номер должен начинаться с +375 и содержать 13 символов.";
  }

  if (form.orderTime === "specific" && !form.scheduledTime) {
    errors.scheduledTime = "Выберите время самовывоза.";
  }

  if (form.comment.trim().length > MAX_COMMENT_LENGTH) {
    errors.comment = `Комментарий не должен превышать ${MAX_COMMENT_LENGTH} символов.`;
  }

  return errors;
}

export function validateDeliveryForm(form: DeliveryFormState): DeliveryFormErrors {
  const errors: DeliveryFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Введите имя.";
  } else if (form.name.trim().length > MAX_NAME_LENGTH) {
    errors.name = `Имя не должно превышать ${MAX_NAME_LENGTH} символов.`;
  }

  const phone = form.phoneNumber.trim();
  if (phone.length <= PHONE_PREFIX.length) {
    errors.phoneNumber = "Введите номер телефона.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phoneNumber = "Номер должен начинаться с +375 и содержать 13 символов.";
  }

  const address = form.address;

  if (!address.street.trim()) {
    errors.street = "Введите улицу.";
  } else if (address.street.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.street = `Улица не должна превышать ${MAX_ADDRESS_FIELD_LENGTH} символов.`;
  }

  if (!address.houseNumber.trim()) {
    errors.houseNumber = "Введите номер дома.";
  } else if (address.houseNumber.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.houseNumber = `Номер дома не должен превышать ${MAX_ADDRESS_FIELD_LENGTH} символов.`;
  }

  if (!address.apartment.trim()) {
    errors.apartment = "Введите номер квартиры.";
  } else if (address.apartment.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.apartment = `Квартира не должна превышать ${MAX_ADDRESS_FIELD_LENGTH} символов.`;
  }

  if (address.entrance.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.entrance = `Подъезд не должен превышать ${MAX_ADDRESS_FIELD_LENGTH} символов.`;
  }

  if (address.floor.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.floor = `Этаж не должен превышать ${MAX_ADDRESS_FIELD_LENGTH} символов.`;
  }

  if (address.intercom.trim().length > MAX_ADDRESS_FIELD_LENGTH) {
    errors.intercom = `Домофон не должен превышать ${MAX_ADDRESS_FIELD_LENGTH} символов.`;
  }

  if (!form.paymentMethod) {
    errors.paymentMethod = "Выберите способ оплаты.";
  }

  if (form.paymentMethod === "CASH" && !form.noChange) {
    if (!form.changeAmount.trim()) {
      errors.changeAmount = "Укажите сумму для сдачи.";
    }
  }

  if (form.orderTime === "specific" && !form.scheduledTime) {
    errors.scheduledTime = "Выберите время доставки.";
  }

  if (form.comment.trim().length > MAX_COMMENT_LENGTH) {
    errors.comment = `Комментарий не должен превышать ${MAX_COMMENT_LENGTH} символов.`;
  }

  return errors;
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
  return `${address.street}, ${address.houseNumber}${address.apartment ? `, квартира ${address.apartment}` : ""}${address.entrance ? `, подъезд ${address.entrance}` : ""}${address.floor ? `, этаж ${address.floor}` : ""}${address.intercom ? `, домофон ${address.intercom}` : ""}`;
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
