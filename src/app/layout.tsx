import type { Metadata } from "next";
import { Inter, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const zen_kaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Near - ニア",
  description: "いつもそばに。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${zen_kaku.className}`}>
        {children}
      </body>
    </html>
  );
}
