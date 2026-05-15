import type { CartLineItem } from "@/lib/types";

type CartItemCardProps = {
  item: CartLineItem;
  onIncrease: () => void;
  onDecrease: () => void;
};

export default function CartItemCard({ item, onIncrease, onDecrease }: CartItemCardProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-secondary/20">
      <img
        src={item.image}
        alt={item.name}
        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
      />

      <div className="flex-grow min-w-0">
        <h4 className="font-semibold text-text text-sm truncate">{item.name}</h4>
        <span className="text-accent text-sm font-medium">{item.price.toFixed(2)} BYN</span>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center border border-secondary/40 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={onDecrease}
            className="w-7 h-7 flex items-center justify-center hover:bg-primary/10 text-primary font-bold text-xs transition-colors cursor-pointer"
            aria-label={`Уменьшить количество: ${item.name}`}
          >
            −
          </button>
          <span className="w-7 h-7 flex items-center justify-center text-text text-xs font-bold border-x border-secondary/40">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            className="w-7 h-7 flex items-center justify-center hover:bg-primary/10 text-primary font-bold text-xs transition-colors cursor-pointer"
            aria-label={`Увеличить количество: ${item.name}`}
          >
            +
          </button>
        </div>
        <span className="text-accent text-sm font-bold">
          {item.lineTotal.toFixed(2)} BYN
        </span>
      </div>
    </div>
  );
}
