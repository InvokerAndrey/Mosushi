"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { sushiMenuItems } from "@/data/sushiMenu";
import { readCartFromStorage, writeCartToStorage } from "@/lib/cart";
import type { CartState } from "@/lib/types";
import { useCheckoutForm } from "@/lib/hooks/useCheckoutForm";
import { validatePickupForm, validateDeliveryForm, formatDeliveryAddress, buildDeliveryComment, buildChangeInfo } from "@/lib/validations";

import Header from "@/components/Header";
import MenuSection from "@/components/MenuSection";
import CheckoutForm from "@/components/CheckoutForm";
import CartSummary from "@/components/CartSummary";

export default function HomePage() {
  const [cartItems, setCartItems] = useState<CartState>({});
  const [isCartReady, setIsCartReady] = useState(false);
  const [pickupErrors, setPickupErrors] = useState<Record<string, string | undefined>>({});
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string | undefined>>({});
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("sushi");

  const sushiRef = useRef<HTMLElement>(null);
  const setsRef = useRef<HTMLElement>(null);
  const saucesRef = useRef<HTMLElement>(null);
  const drinksRef = useRef<HTMLElement>(null);

  const {
    activeTab,
    setActiveTab,
    pickupForm,
    setPickupForm,
    deliveryForm,
    setDeliveryForm,
    resetForms
  } = useCheckoutForm();

  // IntersectionObserver for active section highlighting
  useEffect(() => {
    const sections = [
      { ref: sushiRef, id: "sushi" },
      { ref: setsRef, id: "sets" },
      { ref: saucesRef, id: "sauces" },
      { ref: drinksRef, id: "drinks" }
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute("id") ?? "sushi");
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach(({ ref }) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 100;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

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
  const lineItems = useMemo(() => {
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
      .filter((item) => item !== null);
  }, [cartItems]);

  const totalPrice = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  );

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0),
    [cartItems]
  );

  // Cart handlers
  const handleAddToCart = (itemId: string) => {
    setSuccessMessage("");
    setRequestError("");
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const currentQuantity = prev[itemId] ?? 0;
      if (currentQuantity <= 1) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: currentQuantity - 1 };
    });
  };

  // Form submission
  const handleSubmitOrder = async () => {
    if (isSubmitting) return;

    if (lineItems.length === 0) {
      setRequestError("Your cart is empty. Add some items before placing an order.");
      return;
    }

    setRequestError("");
    setPickupErrors({});
    setDeliveryErrors({});

    const isValid =
      activeTab === "pickup"
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

    const requestBody = {
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
    };
    console.log("[Order] Request body:", requestBody);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const result = (await response.json()) as { message?: string };
      console.log("[Order] API response:", response.status, result);
      if (!response.ok) {
        setRequestError(result.message ?? "Failed to place order.");
        return;
      }

      setSuccessMessage("Order completed successfully! We will contact you soon.");
      setCartItems({});
      setPickupErrors({});
      setDeliveryErrors({});
      resetForms();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setRequestError("Something went wrong while sending the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header
        cartCount={cartCount}
        totalPrice={totalPrice}
        activeSection={activeSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onScrollToSection={scrollToSection}
      />

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 md:px-8 py-10">

        {/* Success banner */}
        {successMessage && (
          <section className="mb-10 rounded-xl border border-secondary bg-secondary/10 p-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-2xl">check_circle</span>
              <p className="text-base font-semibold text-secondary">{successMessage}</p>
            </div>
          </section>
        )}

        {/* Hero */}
        <section className="mb-10 pt-6">
          <h1 className="font-bold text-text text-4xl md:text-5xl tracking-tight mb-3">
            Fresh sushi made every day.
          </h1>
          <p className="text-base text-secondary max-w-2xl leading-relaxed">
            Explore our handcrafted menu with premium ingredients and balanced flavors.
          </p>
        </section>

        {/* Menu sections */}
        <MenuSection
          ref={sushiRef}
          id="sushi"
          title="Sushi"
          items={sushiMenuItems.filter((i) => i.category === "sushi")}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
        />

        <hr className="border-t border-secondary/20 mb-4" />

        <MenuSection
          ref={setsRef}
          id="sets"
          title="Sets"
          items={sushiMenuItems.filter((i) => i.category === "sets")}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
        />

        <hr className="border-t border-secondary/20 mb-4" />

        <MenuSection
          ref={saucesRef}
          id="sauces"
          title="Sauces"
          items={sushiMenuItems.filter((i) => i.category === "sauces")}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
        />

        <hr className="border-t border-secondary/20 mb-4" />

        <MenuSection
          ref={drinksRef}
          id="drinks"
          title="Drinks"
          items={sushiMenuItems.filter((i) => i.category === "drinks")}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
        />

        <hr className="border-t border-secondary/20 mb-10" />

        {/* Checkout section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16" id="checkout">
          <CheckoutForm
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pickupForm={pickupForm}
            setPickupForm={setPickupForm}
            deliveryForm={deliveryForm}
            setDeliveryForm={setDeliveryForm}
            pickupErrors={pickupErrors}
            setPickupErrors={setPickupErrors}
            deliveryErrors={deliveryErrors}
            setDeliveryErrors={setDeliveryErrors}
            requestError={requestError}
            isSubmitting={isSubmitting}
            onSubmitOrder={handleSubmitOrder}
          />

          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <CartSummary
              lineItems={lineItems}
              totalPrice={totalPrice}
              requestError={requestError}
              isSubmitting={isSubmitting}
              onIncreaseItem={handleAddToCart}
              onDecreaseItem={handleRemoveFromCart}
              onSubmitOrder={handleSubmitOrder}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-background w-full mt-10">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-14 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="text-xl font-bold tracking-widest">
            MORESUSHI
          </div>
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-background/60">Working Hours: 11:00 – 23:00</span>
            </div>
            <div className="flex flex-col gap-2">
              <a className="text-background/60 hover:text-accent transition-colors" href="#">Sustainability</a>
              <a className="text-background/60 hover:text-accent transition-colors" href="#">Terms of Service</a>
              <a className="text-background/60 hover:text-accent transition-colors" href="#">Privacy Policy</a>
            </div>
          </div>
          <div className="text-background/40 text-xs">
            © 2024 MORESUSHI. PRECISION IN EVERY ROLL.
          </div>
        </div>
      </footer>
    </>
  );
}
