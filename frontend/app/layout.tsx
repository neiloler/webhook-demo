import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Webhook Demo",
  description: "Local frontend for the webhook demo service",
};

const themeScript = `
(() => {
  const storageKey = "webhook-demo-theme";
  const cookieName = "webhook-demo-theme";
  const isTheme = (value) => value === "dark" || value === "light";
  const cookieTheme = document.cookie
    .split("; ")
    .find((item) => item.startsWith(cookieName + "="))
    ?.split("=")
    .slice(1)
    .join("=");
  const storedTheme = localStorage.getItem(storageKey);
  const theme = isTheme(storedTheme)
    ? storedTheme
    : isTheme(cookieTheme)
      ? decodeURIComponent(cookieTheme)
      : "dark";

  document.documentElement.classList.toggle("dark", theme === "dark");
})();
`;

const RootLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  return (
    <html
      lang="en"
      className={cn("dark font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
};

export default RootLayout;
