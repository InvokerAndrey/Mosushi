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
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <img src={item.image} alt={item.name} className="h-44 w-full object-cover" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-dark">{item.name}</h2>
          <p className="text-base font-bold text-red-600">${item.price.toFixed(2)}</p>
        </div>

        <p className="text-sm text-zinc-600">{item.ingredients.join(", ")}</p>

        {quantityInCart === 0 ? (
          <button
            type="button"
            onClick={() => onAddToCart(item.id)}
            className="w-full rounded-md bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Add to cart
          </button>
        ) : (
          <div className="flex items-center justify-center rounded-md border border-zinc-300">
            <button
              type="button"
              onClick={() => onRemoveFromCart(item.id)}
              className="px-4 py-2 text-lg font-bold text-zinc-700 transition hover:bg-zinc-100"
              aria-label={`Decrease ${item.name} quantity`}
            >
              -
            </button>
            <span className="min-w-10 px-2 text-center text-sm font-semibold text-zinc-800">{quantityInCart}</span>
            <button
              type="button"
              onClick={() => onAddToCart(item.id)}
              className="px-4 py-2 text-lg font-bold text-zinc-700 transition hover:bg-zinc-100"
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
