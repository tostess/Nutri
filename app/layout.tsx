import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/lib/data/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colo nutrição materno-infantil",
  description: "Atendimento nutricional de gestantes, lactantes e crianças, com acompanhamento pela paciente.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#7d2a52" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
