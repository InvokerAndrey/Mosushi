"use client";

import { useEffect, useState } from "react";
import {
  type CheckoutTab,
  type DeliveryFormState,
  type PickupFormState,
  type PersistedCheckoutForm,
  createEmptyDeliveryForm,
  createEmptyPickupForm,
  readCheckoutFormFromStorage,
  writeCheckoutFormToStorage,
  clearCheckoutFormFromStorage
} from "@/lib/validations";

export function useCheckoutForm() {
  const [activeTab, setActiveTab] = useState<CheckoutTab>("pickup");
  const [pickupForm, setPickupForm] = useState<PickupFormState>(createEmptyPickupForm());
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>(createEmptyDeliveryForm());
  const [isFormReady, setIsFormReady] = useState(false);

  // Load form data from storage on mount
  useEffect(() => {
    const savedForm = readCheckoutFormFromStorage();
    if (savedForm) {
      setActiveTab(savedForm.activeTab);
      setPickupForm(savedForm.pickupForm);
      setDeliveryForm(savedForm.deliveryForm);
    }
    setIsFormReady(true);
  }, []);

  // Persist form data to storage on every change
  useEffect(() => {
    if (!isFormReady) {
      return;
    }
    writeCheckoutFormToStorage({
      activeTab,
      pickupForm,
      deliveryForm
    });
  }, [activeTab, pickupForm, deliveryForm, isFormReady]);

  const resetForms = () => {
    setPickupForm(createEmptyPickupForm());
    setDeliveryForm(createEmptyDeliveryForm());
    clearCheckoutFormFromStorage();
  };

  return {
    activeTab,
    setActiveTab,
    pickupForm,
    setPickupForm,
    deliveryForm,
    setDeliveryForm,
    isFormReady,
    resetForms
  };
}