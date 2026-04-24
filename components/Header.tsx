import { useState, useEffect, useRef } from "react";

interface HeaderProps {
  cartCount: number;
  totalPrice: number;
  activeSection: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onScrollToSection: (id: string) => void;
}

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

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileMenuClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => onScrollToSection(sectionId), 300);
  };

  return (
    <header
      ref={headerRef}
      className={`bg-[#c4edff] dark:bg-zinc-950 uppercase tracking-widest text-sm font-bold sticky top-0 w-full z-50 border-b-2 border-zinc-900 dark:border-zinc-100 transition-all duration-300 ${headerScrolled ? 'scrolled' : ''}`}
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
              onClick={() => onScrollToSection(id)}
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
            onClick={() => onScrollToSection('checkout')}
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
            onClick={(e) => { e.preventDefault(); handleMobileMenuClick('sushi'); }}
          >
            SUSHI
          </a>
          <a
            className="px-8 py-4 text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white transition-all duration-200"
            href="#sets"
            onClick={(e) => { e.preventDefault(); handleMobileMenuClick('sets'); }}
          >
            SETS
          </a>
          <a
            className="px-8 py-4 text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white transition-all duration-200"
            href="#sauces"
            onClick={(e) => { e.preventDefault(); handleMobileMenuClick('sauces'); }}
          >
            SAUCES
          </a>
          <a
            className="px-8 py-4 text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white transition-all duration-200"
            href="#drinks"
            onClick={(e) => { e.preventDefault(); handleMobileMenuClick('drinks'); }}
          >
            DRINKS
          </a>
          <a
            className="px-8 py-4 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-200"
            href="#checkout"
            onClick={(e) => { e.preventDefault(); handleMobileMenuClick('checkout'); }}
          >
            CHECKOUT
          </a>
        </nav>
      </div>
    </header>
  );
}