"use client";

import { useEffect, useState, useRef } from "react";

type HeaderProps = {
  cartCount: number;
  totalPrice: number;
  activeSection: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onScrollToSection: (id: string) => void;
};

export default function Header({
  cartCount,
  totalPrice,
  activeSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  onScrollToSection
}: HeaderProps) {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileMenuClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => onScrollToSection(sectionId), 300);
  };

  return (
    <header
      ref={headerRef}
      className={
        "bg-background sticky top-0 w-full z-50 transition-all duration-300 " +
        (headerScrolled ? "shadow-md" : "shadow-sm border-b border-secondary/20")
      }
    >
      <div
        className={
          "max-w-[1200px] mx-auto flex items-center justify-between px-4 md:px-8 transition-all duration-300 " +
          (headerScrolled ? "py-2" : "py-4")
        }
      >
        {/* Left: mobile menu toggle + logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-primary"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={
              "font-black tracking-tighter text-primary transition-all duration-300 hover:text-accent cursor-pointer " +
              (headerScrolled ? "text-2xl" : "text-3xl")
            }
          >
            MoreSushi
          </a>
        </div>

        {/* Center: desktop nav */}
        <nav className="hidden md:flex gap-6 uppercase tracking-widest text-sm font-bold">
          {["sushi", "sets", "sauces", "drinks"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onScrollToSection(id)}
              className={
                "uppercase transition-colors duration-200 pb-1 " +
                (activeSection === id
                  ? "text-accent border-b-2 border-accent"
                  : "text-primary hover:text-accent")
              }
            >
              {id}
            </button>
          ))}
        </nav>

        {/* Right: info + cart */}
        <div className="flex items-center gap-4 md:gap-6 transition-all duration-300">
          <div
            className={
              "hidden lg:flex items-center gap-6 transition-all duration-300 overflow-hidden " +
              (headerScrolled ? "max-w-0 opacity-0" : "max-w-[500px] opacity-100")
            }
          >
            <div className="flex flex-col text-right text-sm">
              <span className="font-semibold text-text">11:00 – 23:00</span>
              <a className="text-xs text-secondary underline hover:text-accent" href="#">
                Delivery Info
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <span className="material-symbols-outlined text-secondary">phone</span>
              <span>+375(29)000-00-00</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onScrollToSection("checkout")}
            className="flex items-center gap-2 bg-accent text-background hover:bg-accent-dark transition-colors px-4 py-2 rounded-lg font-bold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            <span className="hidden sm:inline">
              {cartCount === 0
                ? "Cart"
                : `Cart (${cartCount}) — ${totalPrice.toFixed(2)} BYN`}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={
          "md:hidden overflow-hidden transition-all duration-300 border-t border-secondary/20 " +
          (mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0")
        }
      >
        <nav className="flex flex-col bg-background">
          {["sushi", "sets", "sauces", "drinks", "checkout"].map((section, index) => (
            <a
              key={section}
              className={
                "px-8 py-4 uppercase text-sm font-bold tracking-widest transition-colors duration-200 " +
                (index === 0 ? "text-accent" : "text-primary") +
                " " +
                (index < 4 ? "border-b border-secondary/20" : "") +
                " hover:bg-primary/5 hover:text-accent"
              }
              href={"#" + section}
              onClick={(e) => {
                e.preventDefault();
                handleMobileMenuClick(section);
              }}
            >
              {section}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
