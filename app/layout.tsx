import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoreSushi - Premium Sushi Delivery",
  description: "Fresh premium sushi delivery. Precision in every roll."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      <body className="text-on-background min-h-screen flex flex-col font-satoshi">{children}</body>
    </html>
  );
}
