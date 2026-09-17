import Image from "next/image";

import { MAX_CUTLERY_SETS } from "@/lib/constants";

type CutleryCartItemProps = {
  quantity: number;
  onChange: (quantity: number) => void;
};

const clampQuantity = (quantity: number) =>
  Math.min(MAX_CUTLERY_SETS, Math.max(0, Math.trunc(quantity)));

export default function CutleryCartItem({ quantity, onChange }: CutleryCartItemProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-secondary/20">
      <Image
        src="/images/chopsticks.png"
        alt="Комплекты палочек"
        width={56}
        height={56}
        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
      />

      <div className="flex-grow min-w-0">
        <h4 className="font-semibold text-text text-sm">Комплекты палочек</h4>
        <span className="text-accent text-sm font-medium">Бесплатно</span>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center border border-secondary/40 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => onChange(quantity - 1)}
            disabled={quantity === 0}
            className="w-7 h-7 flex items-center justify-center hover:bg-primary/10 text-primary font-bold text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Уменьшить количество комплектов палочек"
          >
            −
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantity}
            onChange={(event) => {
              const nextQuantity = Number(event.target.value);
              onChange(Number.isFinite(nextQuantity) ? clampQuantity(nextQuantity) : 0);
            }}
            className="w-7 h-7 border-x border-y-0 border-secondary/40 p-0 text-center text-text text-xs font-bold focus:border-secondary focus:ring-0"
            aria-label="Количество комплектов палочек"
          />
          <button
            type="button"
            onClick={() => onChange(quantity + 1)}
            disabled={quantity === MAX_CUTLERY_SETS}
            className="w-7 h-7 flex items-center justify-center hover:bg-primary/10 text-primary font-bold text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Увеличить количество комплектов палочек"
          >
            +
          </button>
        </div>
        <span className="text-accent text-sm font-bold">0 BYN</span>
      </div>
    </div>
  );
}
