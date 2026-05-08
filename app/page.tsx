"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { readCartFromStorage, writeCartToStorage } from "@/lib/cart";
import type { CartState, Category, MenuItem, SiteSettings } from "@/lib/types";
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

export default function HomePage() {
  // --- Data from API ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  // --- Cart ---
  const [cartItems, setCartItems] = useState<CartState>({});
  const [isCartReady, setIsCartReady] = useState(false);

  // --- UI ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // --- Order form ---
  const [pickupErrors, setPickupErrors] = useState<Record<string, string | undefined>>({});
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string | undefined>>({});
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref map for IntersectionObserver — keyed by String(category.id)
  const sectionRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  const {
    activeTab,
    setActiveTab,
    pickupForm,
    setPickupForm,
    deliveryForm,
    setDeliveryForm,
    resetForms
  } = useCheckoutForm();

  // --- Fetch all data on mount ---
  useEffect(() => {
    Promise.all([
      fetch("/categories").then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Category[]>;
      }),
      fetch("/products").then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<MenuItem[]>;
      }),
      fetch("/site-settings").then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<SiteSettings>;
      })
    ])
      .then(([cats, products, settings]) => {
        setCategories(cats);
        setMenuItems(products);
        setSiteSettings(settings);
      })
      .catch(() => setMenuError("Не удалось загрузить меню. Убедитесь, что сервер запущен."))
      .finally(() => setIsMenuLoading(false));
  }, []);

  // --- Set initial active section once categories load ---
  useEffect(() => {
    if (categories.length > 0 && !activeSection) {
      setActiveSection(String(categories[0].id));
    }
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- IntersectionObserver: highlight active category while scrolling ---
  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    sectionRefsMap.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  // --- Cart persistence ---
  useEffect(() => {
    setCartItems(readCartFromStorage());
    setIsCartReady(true);
  }, []);

  useEffect(() => {
    if (!isCartReady) return;
    writeCartToStorage(cartItems);
  }, [cartItems, isCartReady]);

  // --- Scroll helper ---
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  // --- Cart calculations ---
  const lineItems = useMemo(() => {
    return menuItems
      .map((item) => {
        const quantity = cartItems[String(item.id)] ?? 0;
        if (quantity === 0) return null;
        return {
          id: String(item.id),
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

  // --- Cart handlers ---
  const handleAddToCart = (itemId: string) => {
    setSuccessMessage("");
    setRequestError("");
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const qty = prev[itemId] ?? 0;
      if (qty <= 1) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: qty - 1 };
    });
  };

  const handleClearCart = () => setCartItems({});

  // --- Order submission ---
  const handleSubmitOrder = async () => {
    if (isSubmitting) return;

    if (lineItems.length === 0) {
      setRequestError("Ваша корзина пуста. Добавьте товары перед оформлением заказа.");
      return;
    }

    setRequestError("");
    setPickupErrors({});
    setDeliveryErrors({});

    const pickupValidation = validatePickupForm(pickupForm);
    const deliveryValidation = validateDeliveryForm(deliveryForm);
    const formErrors = activeTab === "pickup" ? pickupValidation : deliveryValidation;

    if (Object.keys(formErrors).length > 0) {
      if (activeTab === "pickup") setPickupErrors(pickupValidation);
      else setDeliveryErrors(deliveryValidation);
      return;
    }

    setIsSubmitting(true);

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
        address: formatDeliveryAddress(deliveryForm.address),
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
        onCartClick={() => scrollToSection("checkout")}
        categories={categories}
        settings={siteSettings}
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

        {/* Menu states */}
        {isMenuLoading && (
          <p className="text-secondary text-sm mb-10">Загрузка меню…</p>
        )}

        {!isMenuLoading && menuError && (
          <section className="mb-10 rounded-xl border border-red-300 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-600">{menuError}</p>
          </section>
        )}

        {/* Dynamic menu sections — one per category from DB */}
        {!isMenuLoading && !menuError && (
          <>
            {categories.map((cat, index) => (
              <div key={cat.id}>
                <MenuSection
                  ref={(el) => {
                    if (el) sectionRefsMap.current.set(String(cat.id), el);
                    else sectionRefsMap.current.delete(String(cat.id));
                  }}
                  id={String(cat.id)}
                  title={cat.name}
                  items={menuItems.filter((item) => item.category_id === cat.id)}
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                />
                {index < categories.length - 1 && (
                  <hr className="border-t border-secondary/20 mb-4" />
                )}
              </div>
            ))}
          </>
        )}

        <hr className="border-t border-secondary/20 mb-10" />

        {/* Checkout section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16" id="checkout">
          {/* Order summary */}
          <div className="lg:col-span-5">
            <CartSummary
              lineItems={lineItems}
              subtotalPrice={subtotalPrice}
              deliveryFee={deliveryFee}
              activeTab={activeTab}
              onIncreaseItem={handleAddToCart}
              onDecreaseItem={handleRemoveFromCart}
              onClearCart={handleClearCart}
            />
          </div>

          {/* Checkout form */}
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
          <div className="text-xl font-bold tracking-widest">
            СУШИ<span style={{ color: "#E36414" }}>МÕ</span>
          </div>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 text-sm">
            <div className="flex flex-col gap-2">
              {siteSettings?.working_hours && (
                <span className="text-background/60">
                  Часы работы: {siteSettings.working_hours}
                </span>
              )}
              {siteSettings?.address && (
                <span className="text-background/60">{siteSettings.address}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <a className="text-background/60 hover:text-accent transition-colors" href="/delivery-info">
                Условия доставки
              </a>
              <a className="text-background/60 hover:text-accent transition-colors" href="#">
                Политика конфиденциальности
              </a>
              {siteSettings?.instagram && (
                <a
                  href={siteSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/60 hover:text-accent transition-colors"
                >
                  Наш инстаграм
                </a>
              )}
            </div>
          </div>

          <div className="text-background/40 text-xs">
            © 2024 СУШИМÕ. PRECISION IN EVERY ROLL.
          </div>
        </div>
      </footer>
    </>
  );
}
