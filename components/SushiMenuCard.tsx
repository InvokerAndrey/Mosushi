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
    <article className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full overflow-hidden">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-background">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-5">
        <div className="flex-grow">
          <h3 className="font-semibold text-text text-base leading-snug mb-1">{item.name}</h3>
          <p className="text-sm text-secondary leading-relaxed">
            {item.ingredients.join(", ")}
          </p>
        </div>

        {/* Price + Action */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary/20">
          <span className="font-bold text-accent text-lg">{item.price.toFixed(2)} BYN</span>

          {quantityInCart === 0 ? (
            <button
              type="button"
              onClick={() => onAddToCart(item.id)}
              className="bg-accent text-white hover:bg-accent-dark transition-colors px-5 py-2 rounded-lg font-semibold text-sm cursor-pointer"
            >
              Добавить
            </button>
          ) : (
            <div className="flex items-center border border-secondary/40 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onRemoveFromCart(item.id)}
                className="w-8 h-8 flex items-center justify-center hover:bg-primary/10 text-primary font-bold transition-colors cursor-pointer"
                aria-label={"Decrease " + item.name + " quantity"}
              >
                −
              </button>
              <span className="w-8 h-8 flex items-center justify-center font-bold text-text text-sm border-x border-secondary/40">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={() => onAddToCart(item.id)}
                className="w-8 h-8 flex items-center justify-center hover:bg-primary/10 text-primary font-bold transition-colors cursor-pointer"
                aria-label={"Increase " + item.name + " quantity"}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
