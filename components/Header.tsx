"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const INSTAGRAM_URL =
  "https://www.instagram.com/anastasiya.morochko?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

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
    const handleScroll = () => setHeaderScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileMenuClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => onScrollToSection(sectionId), 300);
  };

  const SECTION_LABELS: Record<string, string> = {
    sushi: "СУШИ",
    sets: "СЕТЫ",
    sauces: "СОУСЫ",
    drinks: "НАПИТКИ"
  };

  const menuSections = ["sushi", "sets", "sauces", "drinks"];

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
        {/* Left: burger + logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-primary"
            aria-label="Toggle menu"
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
              "font-black tracking-tighter text-primary hover:text-accent transition-colors cursor-pointer " +
              (headerScrolled ? "text-2xl" : "text-3xl")
            }
          >
            SushiMō
          </a>
        </div>

        {/* Center: desktop nav */}
        <nav className="hidden md:flex items-center gap-6 uppercase tracking-widest text-sm font-bold">
          {menuSections.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onScrollToSection(id)}
              className={
                "uppercase transition-colors duration-200 pb-0.5 " +
                (activeSection === id
                  ? "text-accent border-b-2 border-accent"
                  : "text-primary hover:text-accent")
              }
            >
              {SECTION_LABELS[id]}
            </button>
          ))}
        </nav>

        {/* Right: info + instagram + cart */}
        <div className="flex items-center gap-4 md:gap-5 transition-all duration-300">
          <div
            className={
              "hidden lg:flex items-center gap-5 transition-all duration-300 overflow-hidden " +
              (headerScrolled ? "max-w-0 opacity-0" : "max-w-[600px] opacity-100")
            }
          >
            <div className="flex flex-col text-right text-sm">
              <span className="font-semibold text-text">11:00 – 23:00</span>
              <Link href="/delivery-info" className="text-xs text-secondary underline hover:text-accent">
                Условия доставки
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <span className="material-symbols-outlined text-secondary">phone</span>
              <a href="tel:+375290000000" className="hover:text-accent transition-colors">
                +375(29)000-00-00
              </a>
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-secondary hover:text-accent transition-colors"
              aria-label="Наш инстаграм"
            >
              <InstagramIcon />
            </a>
          </div>

          <button
            type="button"
            onClick={() => onScrollToSection("checkout")}
            className="flex items-center gap-2 bg-accent text-background hover:bg-accent-dark transition-colors px-4 py-2 rounded-lg font-bold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            <span className="hidden sm:inline">
              {cartCount === 0
                ? "Корзина"
                : `Корзина (${cartCount}) — ${totalPrice.toFixed(2)} BYN`}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={
          "md:hidden overflow-hidden transition-all duration-300 border-t border-secondary/20 " +
          (mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")
        }
      >
        <nav className="flex flex-col bg-background">
          {menuSections.map((section, index) => (
            <a
              key={section}
              className={
                "px-8 py-4 uppercase text-sm font-bold tracking-widest transition-colors duration-200 border-b border-secondary/20 " +
                (index === 0 ? "text-accent" : "text-primary hover:text-accent") +
                " hover:bg-primary/5"
              }
              href={"#" + section}
              onClick={(e) => {
                e.preventDefault();
                handleMobileMenuClick(section);
              }}
            >
              {SECTION_LABELS[section]}
            </a>
          ))}
          <a
            className="px-8 py-4 uppercase text-sm font-bold tracking-widest text-primary hover:text-accent hover:bg-primary/5 transition-colors border-b border-secondary/20"
            href="#checkout"
            onClick={(e) => {
              e.preventDefault();
              handleMobileMenuClick("checkout");
            }}
          >
            Оформить заказ
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 flex items-center gap-3 text-sm font-bold tracking-widest text-secondary hover:text-accent hover:bg-primary/5 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <InstagramIcon className="w-4 h-4" />
            Наш инстаграм
          </a>
        </nav>
      </div>
    </header>
  );
}
