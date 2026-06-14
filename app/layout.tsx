import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "СУШИМÕ — Доставка суши",
  description: "Свежие суши, роллы и сеты каждый день с доставкой по Мозырю. Ручная работа, премиальные ингредиенты."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          precedence="default"
        />
      </head>
      <body className="bg-background text-text min-h-screen flex flex-col font-satoshi">
        {children}
      </body>
    </html>
  );
}
