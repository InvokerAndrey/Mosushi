import type { SushiMenuItem } from "@/data/sushiMenu";

type SushiMenuCardProps = {
  item: SushiMenuItem;
  quantityInCart: number;
  onAddToCart: (itemId: string) => void;
  onRemoveFromCart: (itemId: string) => void;
};

export default function SushiMenuCard({
  item,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart
}: SushiMenuCardProps) {
  return (
    <article className="border-2 border-on-background bg-transparent p-md flex flex-col h-full hover:translate-y-[-4px] transition-transform duration-200">
      <div className="mb-md bg-white border-2 border-on-background overflow-hidden aspect-square">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-grow">
        <div className="flex justify-between items-start mb-xs">
          <h3 className="font-product-name text-product-name">{item.name}</h3>
        </div>
        <p className="font-ingredient-list text-ingredient-list text-tertiary-container mb-md">
          {item.ingredients.join(", ")}
        </p>
      </div>

      <div className="flex justify-between items-end mt-auto pt-md border-t border-on-background border-dashed">
        <span className="font-price text-price text-primary-container">${item.price.toFixed(2)}</span>
        
        {quantityInCart === 0 ? (
          <button 
            type="button"
            onClick={() => onAddToCart(item.id)}
            className="bg-primary-container text-white border-b-2 border-on-background rounded-none hover:opacity-90 transition-opacity px-6 py-2 font-label-caps text-label-caps uppercase cursor-pointer"
          >
            Add to Cart
          </button>
        ) : (
          <div className="flex border-2 border-on-background">
            <button 
              type="button"
              onClick={() => onRemoveFromCart(item.id)}
              className="px-3 py-1 hover:bg-zinc-200 font-bold cursor-pointer"
              aria-label={`Decrease ${item.name} quantity`}
            >
              -
            </button>
            <span className="px-4 py-1 font-product-name border-l-2 border-r-2 border-on-background">
              {quantityInCart}
            </span>
            <button 
              type="button"
              onClick={() => onAddToCart(item.id)}
              className="px-3 py-1 hover:bg-zinc-200 font-bold cursor-pointer"
              aria-label={`Increase ${item.name} quantity`}
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
