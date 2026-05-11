"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InfoBlock } from "@/lib/types";

const SCROLL_AMOUNT = 260;

function InfoBlockCard({ block }: { block: InfoBlock }) {
  const iconColor = block.type === "promo" ? "text-accent" : "text-primary";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-secondary/10 p-5 flex items-start gap-4 w-[240px] lg:w-[calc(25%-12px)] snap-start hover:shadow-md transition-shadow shrink-0 self-stretch">
      <span className={`material-symbols-outlined text-3xl mt-0.5 shrink-0 ${iconColor}`}>
        {block.icon}
      </span>
      <div className="min-w-0">
        <p className="font-bold text-text text-sm leading-snug">{block.title}</p>
        {block.text && (
          <p className="text-secondary text-xs mt-1 leading-relaxed">{block.text}</p>
        )}
      </div>
    </div>
  );
}

export default function InfoBlocks() {
  const [blocks, setBlocks] = useState<InfoBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [thumb, setThumb] = useState({ width: 100, left: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    if (scrollWidth > clientWidth) {
      setThumb({
        width: (clientWidth / scrollWidth) * 100,
        left: (scrollLeft / scrollWidth) * 100,
      });
    }
  }, []);

  // Recalculate after blocks appear in DOM
  useEffect(() => {
    const id = setTimeout(updateScrollState, 50);
    return () => clearTimeout(id);
  }, [blocks, updateScrollState]);

  // Wheel → horizontal scroll (non-passive so we can preventDefault)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: "auto" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [blocks]);

  useEffect(() => {
    fetch("/info-blocks")
      .then((r) => (r.ok ? (r.json() as Promise<InfoBlock[]>) : Promise.resolve([])))
      .catch(() => [])
      .then((data) => setBlocks(data))
      .finally(() => setIsLoading(false));
  }, []);

  const handleScroll = () => {
    updateScrollState();
    setIsScrolling(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsScrolling(false), 900);
  };

  const scrollLeft = () =>
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });

  const scrollRight = () =>
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });

  if (isLoading) {
    return (
      <section className="mb-10 pt-4">
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-secondary/10 p-5 min-w-[220px] h-[82px] animate-pulse shrink-0"
            />
          ))}
        </div>
      </section>
    );
  }

  if (blocks.length === 0) return null;

  return (
    <section className="mb-10 pt-4">
      <div className="relative">
        {/* Left arrow — desktop only */}
        <button
          type="button"
          onClick={scrollLeft}
          aria-label="Прокрутить влево"
          className={`hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-secondary/20 shadow-md text-secondary hover:text-accent hover:border-accent/50 hover:shadow-lg transition-all duration-200 ${
            canScrollLeft ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
          }`}
        >
          <span className="material-symbols-outlined text-[18px] leading-none">chevron_left</span>
        </button>

        {/* Scroll container — native scrollbar hidden */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex flex-nowrap gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {blocks.map((block) => (
            <InfoBlockCard key={block.id} block={block} />
          ))}
        </div>

        {/* Right arrow — desktop only */}
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Прокрутить вправо"
          className={`hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-secondary/20 shadow-md text-secondary hover:text-accent hover:border-accent/50 hover:shadow-lg transition-all duration-200 ${
            canScrollRight ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
          }`}
        >
          <span className="material-symbols-outlined text-[18px] leading-none">chevron_right</span>
        </button>
      </div>

      {/* Minimal scroll indicator — visible only while scrolling */}
      <div
        className={`mt-3 mx-auto max-w-[120px] h-[2px] rounded-full bg-secondary/10 relative overflow-hidden transition-opacity duration-500 ${
          isScrolling ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute top-0 h-full rounded-full bg-secondary/40 transition-[left,width] duration-150"
          style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }}
        />
      </div>
    </section>
  );
}
