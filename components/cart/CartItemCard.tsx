import type { SushiMenuItem } from "@/data/sushiMenu";

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
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <img
          src={item.image}
          alt={item.name}
          className="h-14 w-14 rounded-md border border-zinc-200 object-cover"
        />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-zinc-900">{item.name}</h2>
          <p className="text-sm text-zinc-600">${item.price.toFixed(2)} each</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center rounded-md border border-zinc-300">
          <button
            type="button"
            onClick={onDecrease}
            className="px-4 py-2 text-lg font-bold text-zinc-700 transition hover:bg-zinc-100"
            aria-label={`Decrease ${item.name} quantity`}
          >
            -
          </button>
          <span className="min-w-10 px-2 text-center text-sm font-semibold text-zinc-800">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            className="px-4 py-2 text-lg font-bold text-zinc-700 transition hover:bg-zinc-100"
            aria-label={`Increase ${item.name} quantity`}
          >
            +
          </button>
        </div>
        <p className="min-w-24 text-right text-base font-bold text-zinc-900">
          ${item.lineTotal.toFixed(2)}
        </p>
      </div>
    </article>
  );
}