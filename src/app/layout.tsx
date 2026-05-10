import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TabooParty — Competitive Word Warfare",
  description: "A live esports verbal battlefield. Competitive multiplayer word-guessing with escalating stakes, combo mechanics, and tournament-grade intensity.",
  keywords: ["taboo", "word game", "multiplayer", "competitive", "esports", "party game"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-surface-900 text-white antialiased">
        <div className="min-h-screen bg-neon-grid bg-[size:50px_50px]">
          {children}
        </div>
      </body>
    </html>
  );
}
