
import type { CartLineItem } from "@/lib/types";

type CartItemCardProps = {
  item: CartLineItem;
  onIncrease: () => void;
  onDecrease: () => void;
};

export default function CartItemCard({ item, onIncrease, onDecrease }: CartItemCardProps) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-dashed border-zinc-300">
      <img 
        src={item.image} 
        alt={item.name} 
        className="w-16 h-16 object-cover border border-on-background flex-shrink-0"
      />
      
      <div className="flex-grow min-w-0">
        <h4 className="font-product-name text-sm truncate">{item.name}</h4>
        <span className="font-price text-sm text-primary-container">{item.price.toFixed(2)} BYN</span>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex border border-on-background w-[80px]">
          <button 
            type="button"
            onClick={onDecrease}
            className="px-2 py-1 hover:bg-zinc-200 text-xs w-7 h-7 text-center"
            aria-label={`Decrease ${item.name} quantity`}
          >
            -
          </button>
          <span className="px-2 py-1 font-product-name text-xs border-l border-r border-on-background w-7 h-7 text-center">
            {item.quantity}
          </span>
          <button 
            type="button"
            onClick={onIncrease}
            className="px-2 py-1 hover:bg-zinc-200 text-xs w-7 h-7 text-center"
            aria-label={`Increase ${item.name} quantity`}
          >
            +
          </button>
        </div>
        <span className="font-price text-sm font-bold text-primary-container min-w-[60px] text-right">
          {item.lineTotal.toFixed(2)} BYN
        </span>
      </div>
    </div>
  );
}
