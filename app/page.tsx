"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { sushiMenuItems } from "@/data/sushiMenu";
import SushiMenuCard from "@/components/SushiMenuCard";
import CartItemCard from "@/components/cart/CartItemCard";
import { readCartFromStorage, type CartState, writeCartToStorage } from "@/lib/cart";
import { useCheckoutForm } from "@/lib/hooks/useCheckoutForm";
import { validatePickupForm, validateDeliveryForm, isPickupFormFilled, isDeliveryFormFilled, formatPhoneNumber, formatDeliveryAddress, buildDeliveryComment, buildChangeInfo } from "@/lib/validations";

export default function HomePage() {
  const [cartItems, setCartItems] = useState<CartState>({});
  const [isCartReady, setIsCartReady] = useState(false);
  const [pickupErrors, setPickupErrors] = useState<Record<string, string | undefined>>({});
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string | undefined>>({});
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("sushi");

  const headerRef = useRef<HTMLElement>(null);
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

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    // Use larger offset to show category name properly
    const offset = 100;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
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

  const activeFormFilled = activeTab === "pickup"
    ? isPickupFormFilled(pickupForm)
    : isDeliveryFormFilled(deliveryForm);

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
    if (isSubmitting) return;

    if (lineItems.length === 0) {
      setRequestError("Your cart is empty. Add some items before placing an order.");
      return;
    }

    setRequestError("");
    setPickupErrors({});
    setDeliveryErrors({});

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setRequestError("Something went wrong while sending the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (hasError?: boolean) => {
    const base = "w-full bg-[#f3f5eb] border-2 border-on-background rounded-none focus:border-primary-container focus:border-[3px] focus:outline-none transition-all px-3 py-2 text-sm outline-none";
    return hasError
      ? `${base} border-red-500 focus:border-red-500`
      : base;
  };

  return (
    <>
      {/* Header */}
      <header 
        ref={headerRef}
        className={`bg-[#f3f5eb] dark:bg-zinc-950 uppercase tracking-widest text-sm font-bold sticky top-0 w-full z-50 border-b-2 border-zinc-900 dark:border-zinc-100 transition-all duration-300 ${headerScrolled ? 'scrolled' : ''}`}
      >
        <div className={`max-w-[1200px] mx-auto flex items-center justify-between px-4 md:px-8 transition-all duration-300 relative ${headerScrolled ? 'py-2' : 'py-5'}`}>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-zinc-900 dark:text-white"
            >
              <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`font-black tracking-tighter text-zinc-900 dark:text-white transition-all duration-300 hover:text-primary-container cursor-pointer ${headerScrolled ? 'text-2xl' : 'text-3xl'}`}
            >
              MoreSushi
            </a>
          </div>

          <nav className="hidden md:flex gap-8 transition-all duration-300">
            {["sushi", "sets", "sauces", "drinks"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={`uppercase transition-all duration-200 pb-1 translate-y-0.5 hover:bg-zinc-900 hover:text-white px-1 ${
                  activeSection === id
                    ? 'text-primary-container border-b-2 border-primary-container'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {id}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 md:gap-6 transition-all duration-300">
            <div className={`hidden lg:flex items-center gap-6 transition-all duration-300 overflow-hidden ${headerScrolled ? 'max-w-0 opacity-0' : 'max-w-[500px] opacity-100'}`}>
              <div className="flex flex-col text-right font-body-regular normal-case">
                <span className="font-bold">11:00 - 23:00</span>
                <a className="text-xs underline hover:text-primary-container" href="#">Delivery Info</a>
              </div>
              <div className="flex items-center gap-2 font-body-regular">
                <span className="material-symbols-outlined">phone</span>
                <span className="font-bold">+375(29)000-00-00</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollToSection('checkout')}
              className="flex items-center gap-2 bg-primary-container text-white border-b-2 border-on-background rounded-none hover:opacity-90 transition-opacity px-3 md:px-4 py-2 font-label-caps text-label-caps cursor-pointer"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              <span className="hidden sm:inline">
                {cartCount === 0 ? "Cart" : `Cart (${cartCount}) - ${totalPrice.toFixed(2)} BYN`}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 border-t-2 border-zinc-900 ${mobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <nav className="flex flex-col bg-[#f3f5eb] dark:bg-zinc-950">
            <a
              className="px-8 py-4 text-primary-container border-b border-zinc-300 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white transition-all duration-200"
              href="#sushi"
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setTimeout(() => scrollToSection('sushi'), 300); }}
            >
              SUSHI
            </a>
            <a
              className="px-8 py-4 text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white transition-all duration-200"
              href="#sets"
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setTimeout(() => scrollToSection('sets'), 300); }}
            >
              SETS
            </a>
            <a
              className="px-8 py-4 text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white transition-all duration-200"
              href="#sauces"
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setTimeout(() => scrollToSection('sauces'), 300); }}
            >
              SAUCES
            </a>
            <a
              className="px-8 py-4 text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white transition-all duration-200"
              href="#drinks"
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setTimeout(() => scrollToSection('drinks'), 300); }}
            >
              DRINKS
            </a>
            <a
              className="px-8 py-4 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-200"
              href="#checkout"
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setTimeout(() => scrollToSection('checkout'), 300); }}
            >
              CHECKOUT
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[1200px] mx-auto w-full px-8 py-lg">
        
        {successMessage && (
          <section className="mb-xl rounded-xl border-2 border-green-500 bg-green-50 p-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
              <p className="text-lg font-bold text-green-700">{successMessage}</p>
            </div>
          </section>
        )}

        {/* Hero Section */}
        <section className="mb-xl pt-8">
          <h1 className="font-heading-xl text-heading-xl mb-4">Fresh sushi made every day.</h1>
          <p className="font-body-regular text-body-regular max-w-2xl text-zinc-700">
            Explore our handcrafted menu with premium ingredients and balanced flavors.
          </p>
        </section>

        {/* Sushi Section */}
        <section ref={sushiRef} className="mb-xl" id="sushi">
          <h2 className="font-heading-lg text-heading-lg mb-lg border-b-2 border-on-background pb-xs inline-block">SUSHI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {sushiMenuItems.filter(i => i.category === "sushi").map((item) => (
              <SushiMenuCard
                key={item.id}
                item={item}
                quantityInCart={cartItems[item.id] ?? 0}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
              />
            ))}
          </div>
        </section>

        <hr className="border-t-2 border-on-background mb-xl"/>

        {/* Sets Section */}
        <section ref={setsRef} className="mb-xl" id="sets">
          <h2 className="font-heading-lg text-heading-lg mb-lg border-b-2 border-on-background pb-xs inline-block">SETS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {sushiMenuItems.filter(i => i.category === "sets").map((item) => (
              <SushiMenuCard
                key={item.id}
                item={item}
                quantityInCart={cartItems[item.id] ?? 0}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
              />
            ))}
          </div>
        </section>

        <hr className="border-t-2 border-on-background mb-xl"/>

        {/* Sauces Section */}
        <section ref={saucesRef} className="mb-xl" id="sauces">
          <h2 className="font-heading-lg text-heading-lg mb-lg border-b-2 border-on-background pb-xs inline-block">SAUCES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {sushiMenuItems.filter(i => i.category === "sauces").map((item) => (
              <SushiMenuCard
                key={item.id}
                item={item}
                quantityInCart={cartItems[item.id] ?? 0}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
              />
            ))}
          </div>
        </section>

        <hr className="border-t-2 border-on-background mb-xl"/>

        {/* Drinks Section */}
        <section ref={drinksRef} className="mb-xl" id="drinks">
          <h2 className="font-heading-lg text-heading-lg mb-lg border-b-2 border-on-background pb-xs inline-block">DRINKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {sushiMenuItems.filter(i => i.category === "drinks").map((item) => (
              <SushiMenuCard
                key={item.id}
                item={item}
                quantityInCart={cartItems[item.id] ?? 0}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
              />
            ))}
          </div>
        </section>

        <hr className="border-t-2 border-on-background mb-xl"/>

        {/* Checkout Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-xl" id="checkout">
          {/* Order Form */}
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

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmitOrder(); }}>
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

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-5 mt-lg lg:mt-0">
            <div className="border-2 border-on-background bg-transparent p-md sticky top-32 bg-white">
              <h3 className="font-heading-lg text-heading-lg mb-md">YOUR ORDER</h3>
              
              {/* Cart Items */}
              {lineItems.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p>Your cart is empty</p>
                  <p className="text-sm mt-2">Add some sushi from the menu above</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-md">
                    {lineItems.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        onIncrease={() => handleAddToCart(item.id)}
                        onDecrease={() => handleRemoveFromCart(item.id)}
                      />
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="pt-4 space-y-2 mb-lg">
                    <div className="flex justify-between font-body-regular text-tertiary-container">
                      <span>Subtotal</span>
                      <span className="min-w-[60px] text-right">{totalPrice.toFixed(2)} BYN</span>
                    </div>
                    <div className="flex justify-between font-body-regular text-tertiary-container">
                      <span>Delivery</span>
                      <span className="min-w-[60px] text-right">0.00 BYN</span>
                    </div>
                    <div className="flex justify-between font-price text-xl mt-4 pt-4 border-t-2 border-on-background">
                      <span>Total</span>
                      <span className="text-primary-container min-w-[60px] text-right">{totalPrice.toFixed(2)} BYN</span>
                    </div>
                  </div>

                  {requestError && (
                    <p className="text-sm font-medium text-red-600 mb-3 text-center">{requestError}</p>
                  )}
                  <button 
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="bg-primary-container text-white border-b-2 border-on-background rounded-none hover:opacity-90 transition-opacity w-full py-4 font-heading-lg text-xl uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Placing order..." : "Place Order"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 dark:bg-black text-zinc-100 text-xs font-light tracking-wider w-full mt-20 border-t-4 border-zinc-900">
        <div className="max-w-[1200px] mx-auto px-8 py-16 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="text-xl font-bold text-white mb-4 md:mb-0">
            MORESUSHI
          </div>
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
            <div className="flex flex-col gap-2">
              <span className="text-zinc-400">Working Hours: 11:00 - 23:00</span>
            </div>
            <div className="flex flex-col gap-2">
              <a className="text-zinc-400 hover:text-primary-container transition-colors" href="#">Sustainability</a>
              <a className="text-zinc-400 hover:text-primary-container transition-colors" href="#">Terms of Service</a>
              <a className="text-zinc-400 hover:text-primary-container transition-colors" href="#">Privacy Policy</a>
            </div>
          </div>
          <div className="mt-8 md:mt-0 text-zinc-500">
            © 2024 MORESUSHI ATELIER. PRECISION IN EVERY ROLL.
          </div>
        </div>
      </footer>
    </>
  );
}
