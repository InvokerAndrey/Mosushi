type CartLineItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
};

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
        className="w-16 h-16 object-cover border border-on-background"
      />
      
      <div className="flex-grow">
        <h4 className="font-product-name text-sm">{item.name}</h4>
        <span className="font-price text-sm text-primary-container">${item.price.toFixed(2)}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex border border-on-background">
          <button 
            type="button"
            onClick={onDecrease}
            className="px-2 py-1 hover:bg-zinc-200 text-xs"
            aria-label={`Decrease ${item.name} quantity`}
          >
            -
          </button>
          <span className="px-3 py-1 font-product-name text-xs border-l border-r border-on-background">
            {item.quantity}
          </span>
          <button 
            type="button"
            onClick={onIncrease}
            className="px-2 py-1 hover:bg-zinc-200 text-xs"
            aria-label={`Increase ${item.name} quantity`}
          >
            +
          </button>
        </div>
        <span className="font-price text-sm font-bold text-primary-container min-w-[50px] text-right">
          ${item.lineTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}