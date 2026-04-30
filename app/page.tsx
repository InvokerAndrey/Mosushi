"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { SushiMenuItem } from "@/data/sushiMenu";
import { readCartFromStorage, writeCartToStorage } from "@/lib/cart";
import type { CartState } from "@/lib/types";
import { useCheckoutForm } from "@/lib/hooks/useCheckoutForm";
import {
  validatePickupForm,
  validateDeliveryForm,
  formatDeliveryAddress
} from "@/lib/validations";

import Header from "@/components/Header";
import MenuSection from "@/components/MenuSection";
import CheckoutForm from "@/components/CheckoutForm";
import CartSummary from "@/components/CartSummary";

const DELIVERY_FEE = 6;
const FREE_DELIVERY_THRESHOLD = 40;
const INSTAGRAM_URL =
  "https://www.instagram.com/anastasiya.morochko?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

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
  const [menuItems, setMenuItems] = useState<SushiMenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

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
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  // Fetch menu from Django API on mount
  useEffect(() => {
    fetch("/products")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SushiMenuItem[]) => setMenuItems(data))
      .catch(() => setMenuError("Не удалось загрузить меню. Убедитесь, что сервер запущен."))
      .finally(() => setIsMenuLoading(false));
  }, []);

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

  // Build line items from cart (uses menuItems fetched from Django)
  const lineItems = useMemo(() => {
    return menuItems
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
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [cartItems, menuItems]);

  const subtotalPrice = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  );

  const deliveryFee = useMemo(() => {
    if (activeTab !== "delivery") return 0;
    return subtotalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  }, [activeTab, subtotalPrice]);

  const grandTotal = useMemo(() => subtotalPrice + deliveryFee, [subtotalPrice, deliveryFee]);

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, qty) => sum + qty, 0),
    [cartItems]
  );

  // Cart handlers
  const handleAddToCart = (itemId: string) => {
    setSuccessMessage("");
    setRequestError("");
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const currentQty = prev[itemId] ?? 0;
      if (currentQty <= 1) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: currentQty - 1 };
    });
  };

  // Form submission
  const handleSubmitOrder = async () => {
    if (isSubmitting) return;

    if (lineItems.length === 0) {
      setRequestError("Ваша корзина пуста. Добавьте товары перед оформлением заказа.");
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

    setIsSubmitting(true);

    const addressString = formatDeliveryAddress(deliveryForm.address);

    const requestBody = {
      orderType: activeTab,
      totalPrice: grandTotal,
      cartItems,
      pickup: {
        name: pickupForm.name,
        phoneNumber: pickupForm.phoneNumber,
        orderTime: pickupForm.orderTime,
        scheduledTime: pickupForm.scheduledTime,
        comment: pickupForm.comment
      },
      delivery: {
        name: deliveryForm.name,
        phoneNumber: deliveryForm.phoneNumber,
        address: addressString,
        paymentMethod: deliveryForm.paymentMethod,
        changeAmount: deliveryForm.changeAmount,
        noChange: deliveryForm.noChange,
        orderTime: deliveryForm.orderTime,
        scheduledTime: deliveryForm.scheduledTime,
        comment: deliveryForm.comment
      }
    };

    try {
      const response = await fetch("/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setRequestError(result.message ?? "Не удалось оформить заказ.");
        return;
      }

      setSuccessMessage("Заказ успешно оформлен! Мы скоро свяжемся с вами.");
      setCartItems({});
      setPickupErrors({});
      setDeliveryErrors({});
      resetForms();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setRequestError("Произошла ошибка при отправке заказа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header
        cartCount={cartCount}
        totalPrice={grandTotal}
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
            Свежие суши каждый день.
          </h1>
          <p className="text-base text-secondary max-w-2xl leading-relaxed">
            Ручная работа, премиальные ингредиенты, сбалансированный вкус.
          </p>
        </section>

        {/* Menu — loading / error / content states */}
        {isMenuLoading && (
          <p className="text-secondary text-sm mb-10">Загрузка меню…</p>
        )}

        {!isMenuLoading && menuError && (
          <section className="mb-10 rounded-xl border border-red-300 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-600">{menuError}</p>
          </section>
        )}

        {!isMenuLoading && !menuError && (
          <>
            <MenuSection
              ref={sushiRef}
              id="sushi"
              title="Суши"
              items={menuItems.filter((i) => i.category === "sushi")}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
            />
            <hr className="border-t border-secondary/20 mb-4" />

            <MenuSection
              ref={setsRef}
              id="sets"
              title="Сеты"
              items={menuItems.filter((i) => i.category === "sets")}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
            />
            <hr className="border-t border-secondary/20 mb-4" />

            <MenuSection
              ref={saucesRef}
              id="sauces"
              title="Соусы"
              items={menuItems.filter((i) => i.category === "sauces")}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
            />
            <hr className="border-t border-secondary/20 mb-4" />

            <MenuSection
              ref={drinksRef}
              id="drinks"
              title="Напитки"
              items={menuItems.filter((i) => i.category === "drinks")}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
            />
          </>
        )}
        <hr className="border-t border-secondary/20 mb-10" />

        {/* Checkout section — CartSummary LEFT on desktop, first on mobile */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16" id="checkout">
          {/* Order summary — col 5, left on desktop, top on mobile */}
          <div className="lg:col-span-5">
            <CartSummary
              lineItems={lineItems}
              subtotalPrice={subtotalPrice}
              deliveryFee={deliveryFee}
              activeTab={activeTab}
              onIncreaseItem={handleAddToCart}
              onDecreaseItem={handleRemoveFromCart}
            />
          </div>

          {/* Checkout form — col 7, right on desktop, bottom on mobile */}
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
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-background w-full mt-10">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-14 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="text-xl font-bold tracking-widest">SushiMō</div>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-background/60">Часы работы: 11:00 – 23:00</span>
            </div>
            <div className="flex flex-col gap-2">
              <a className="text-background/60 hover:text-accent transition-colors" href="/delivery-info">
                Условия доставки
              </a>
              <a className="text-background/60 hover:text-accent transition-colors" href="#">
                Политика конфиденциальности
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/60 hover:text-accent transition-colors"
              >
                Наш инстаграм
              </a>
            </div>
          </div>

          <div className="text-background/40 text-xs">
            © 2024 SushiMō. PRECISION IN EVERY ROLL.
          </div>
        </div>
      </footer>
    </>
  );
}
