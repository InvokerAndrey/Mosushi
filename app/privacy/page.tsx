"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const SECTIONS = [
  {
    number: "1",
    title: "Общие положения",
    items: [
      "Используя Сайт и оформляя заказ, пользователь подтверждает ознакомление с настоящей Политикой и выражает согласие на обработку своих персональных данных в порядке и на условиях, указанных в ней.",
      "Оператором персональных данных является владелец Сайта (далее — «Оператор»).",
      "Оператор осуществляет обработку персональных данных только в объеме, необходимом для приема, подтверждения и выполнения заказов, а также связи с пользователем.",
    ],
  },
  {
    number: "2",
    title: "Какие данные обрабатываются",
    intro: "Оператор может обрабатывать следующие персональные данные пользователя:",
    items: [
      "имя или псевдоним, указанные пользователем;",
      "номер мобильного телефона;",
      "адрес доставки (только при оформлении доставки);",
      "иные сведения, которые пользователь добровольно сообщает при оформлении заказа или общении с оператором.",
    ],
  },
  {
    number: "3",
    title: "Цели обработки персональных данных",
    intro: "Персональные данные обрабатываются исключительно для следующих целей:",
    items: [
      "оформления и обработки заказов;",
      "связи с пользователем для подтверждения заказа;",
      "доставки заказов;",
      "уточнения деталей заказа;",
      "ведения учета заказов;",
      "разрешения возможных спорных ситуаций;",
      "исполнения обязанностей, предусмотренных законодательством Республики Беларусь.",
    ],
  },
  {
    number: "4",
    title: "Правовые основания обработки",
    items: [
      "Обработка персональных данных осуществляется на основании согласия пользователя.",
      "Предоставляя свои данные через формы на Сайте, пользователь дает согласие на их обработку в объеме и целях, указанных в настоящей Политике.",
    ],
  },
  {
    number: "5",
    title: "Порядок обработки и хранения данных",
    items: [
      {
        text: "Оператор принимает необходимые организационные и технические меры для защиты персональных данных от:",
        subitems: [
          "несанкционированного доступа;",
          "изменения;",
          "раскрытия;",
          "уничтожения;",
          "иных неправомерных действий.",
        ],
      },
      "Доступ к персональным данным имеют только лица, которым такая информация необходима для обработки и выполнения заказов.",
      "Персональные данные хранятся не дольше, чем это необходимо для целей обработки, либо в течение сроков, установленных законодательством Республики Беларусь.",
    ],
  },
  {
    number: "6",
    title: "Передача персональных данных третьим лицам",
    items: [
      {
        text: "Оператор не продает и не передает персональные данные третьим лицам, за исключением случаев:",
        subitems: [
          "когда это необходимо для выполнения доставки заказа;",
          "когда передача обязательна в соответствии с законодательством Республики Беларусь;",
          "когда пользователь дал отдельное согласие на такую передачу.",
        ],
      },
      "При доставке заказа адрес и контактный номер телефона могут быть переданы курьеру или службе доставки исключительно для выполнения заказа.",
    ],
  },
  {
    number: "7",
    title: "Права пользователя",
    intro: "Пользователь имеет право:",
    items: [
      "получать информацию о своих персональных данных и порядке их обработки;",
      "требовать изменения или удаления своих персональных данных;",
      "отзывать согласие на обработку персональных данных;",
      "обращаться с жалобой в уполномоченные органы Республики Беларусь в случае нарушения своих прав.",
    ],
  },
  {
    number: "8",
    title: "Отзыв согласия",
    items: [
      "Пользователь вправе в любое время отозвать согласие на обработку персональных данных путем обращения к Оператору.",
      "Отзыв согласия не влияет на законность обработки данных, осуществленной до момента отзыва.",
    ],
  },
  {
    number: "9",
    title: "Использование файлов cookie",
    items: [
      "Сайт может использовать файлы cookie и технические данные, необходимые для корректной работы Сайта.",
      {
        text: "Cookie могут использоваться для:",
        subitems: [
          "обеспечения функционирования Сайта;",
          "сохранения пользовательских настроек;",
          "анализа работы Сайта и улучшения пользовательского опыта.",
        ],
      },
    ],
  },
  {
    number: "10",
    title: "Заключительные положения",
    items: [
      "Оператор вправе вносить изменения в настоящую Политику без предварительного уведомления пользователей.",
      "Актуальная версия Политики всегда размещается на Сайте.",
      "По всем вопросам, связанным с обработкой персональных данных, пользователь может связаться с Оператором по контактным данным, указанным на Сайте.",
    ],
  },
];

type SectionItem =
  | string
  | { text: string; subitems: string[] };

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="bg-background min-h-screen flex flex-col font-satoshi">
      {/* Minimal header */}
      <header className="bg-primary sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center gap-4 px-4 md:px-8 py-4">
          <Link
            href="/"
            className="font-black tracking-tighter text-3xl text-background hover:opacity-80 transition-opacity"
          >
            СУШИ<span style={{ color: "#E36414" }}>МŌ</span>
          </Link>
        </div>
      </header>

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 md:px-8 py-10">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent transition-colors mb-8 group"
        >
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          Назад
        </button>

        {/* Page title */}
        <h1 className="font-bold text-text text-2xl md:text-3xl uppercase tracking-widest mb-2 pb-3 border-b-2 border-secondary/30">
          Политика обработки персональных данных
        </h1>
        <p className="text-sm text-secondary mb-10">
          В соответствии с Законом Республики Беларусь от 7 мая 2021 г. № 99-З «О защите персональных данных»
        </p>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.number} className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <h2 className="font-bold text-text text-base uppercase tracking-wider mb-4">
                {section.number}. {section.title}
              </h2>
              {section.intro && (
                <p className="text-sm text-text leading-relaxed mb-3">{section.intro}</p>
              )}
              <ol className="space-y-3">
                {(section.items as SectionItem[]).map((item, idx) => {
                  if (typeof item === "string") {
                    return (
                      <li key={idx} className="flex gap-3 text-sm text-text leading-relaxed">
                        {!section.intro && (
                          <span className="text-secondary font-semibold shrink-0 w-6 text-right">
                            {section.number}.{idx + 1}
                          </span>
                        )}
                        <span className={section.intro ? "pl-4 before:content-['•'] before:mr-2 before:text-accent" : ""}>
                          {item}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={idx}>
                      <div className="flex gap-3 text-sm text-text leading-relaxed mb-2">
                        <span className="text-secondary font-semibold shrink-0 w-6 text-right">
                          {section.number}.{idx + 1}
                        </span>
                        <span>{item.text}</span>
                      </div>
                      <ul className="ml-9 space-y-1">
                        {item.subitems.map((sub, si) => (
                          <li key={si} className="text-sm text-text leading-relaxed before:content-['•'] before:mr-2 before:text-accent">
                            {sub}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        {/* Bottom back button */}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent transition-colors group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            Назад
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-background w-full mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 text-center text-background/40 text-xs">
          
        </div>
      </footer>
    </div>
  );
}
