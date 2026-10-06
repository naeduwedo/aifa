import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Masthead from "@/components/Masthead";

export const metadata: Metadata = {
  title: "AIFA — AI · Investing · Education",
  description: "AIFA is a bilingual magazine on AI, investing and education.",
  icons: { icon: "/favicon.svg" },
};

const themeBootstrap = `
try{
  var m = localStorage.getItem("aifa-theme");
  if (m === "dark" || (m !== "light" && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.setAttribute("data-aifa-night","on");
  }
}catch(e){}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <meta name="theme-color" content="#fafaf7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1917" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <Suspense fallback={<div className="masthead-spacer" />}>
          <Masthead />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
