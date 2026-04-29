import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Доставка — SushiMō",
  description: "Информация о доставке SushiMō"
};

export default function DeliveryInfoPage() {
  return (
    <main className="max-w-[800px] mx-auto px-4 md:px-8 py-16">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-secondary hover:text-accent transition-colors text-sm font-semibold mb-10"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        На главную
      </Link>

      <h1 className="font-bold text-text text-3xl md:text-4xl tracking-tight mb-10">
        Информация о доставке
      </h1>

      {/* Delivery details */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8 space-y-5 text-text leading-relaxed">
        <p>
          Мы осуществляем доставку по городу быстро и удобно.
        </p>

        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="material-symbols-outlined text-accent mt-0.5">check_circle</span>
            <span>
              <strong>Бесплатная доставка</strong> при заказе от <span className="text-accent font-bold">40 BYN</span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
            <span>
              Если сумма заказа меньше 40 BYN, стоимость доставки составляет <span className="font-bold">6 BYN</span>
            </span>
          </li>
        </ul>

        <p>
          Среднее время доставки — около <strong>60 минут</strong>.
        </p>

        <p className="text-secondary text-sm border-t border-secondary/20 pt-4">
          Пожалуйста, учитывайте загруженность кухни и погодные условия.
        </p>
      </div>

      {/* Map placeholder */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h2 className="font-bold text-text text-lg mb-4">Зоны доставки</h2>
        <div className="bg-background rounded-lg border border-secondary/20 h-64 flex items-center justify-center">
          <p className="text-secondary text-sm">Здесь будет карта с зонами доставки</p>
        </div>
      </div>
    </main>
  );
}
