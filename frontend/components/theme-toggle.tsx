"use client";

import { Moon02Icon, Sun02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "dark" | "light";

const themeStorageKey = "webhook-demo-theme";
const themeCookieName = "webhook-demo-theme";

const isTheme = (value: string | null): value is Theme => {
  return value === "dark" || value === "light";
};

const readCookieTheme = (): Theme | null => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${themeCookieName}=`));

  if (!cookie) {
    return null;
  }

  const value = decodeURIComponent(cookie.split("=").slice(1).join("="));
  return isTheme(value) ? value : null;
};

const readStoredTheme = (): Theme => {
  const localTheme = window.localStorage.getItem(themeStorageKey);

  if (isTheme(localTheme)) {
    return localTheme;
  }

  return readCookieTheme() ?? "dark";
};

const applyTheme = (theme: Theme): void => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(themeStorageKey, theme);
  document.cookie = `${themeCookieName}=${encodeURIComponent(
    theme,
  )}; Path=/; Max-Age=31536000; SameSite=Lax`;
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const storedTheme = readStoredTheme();
    applyTheme(storedTheme);
    setTheme(storedTheme);
  }, []);

  const isDark = theme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Button
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      className="fixed right-4 bottom-4 z-50 size-11 rounded-full border bg-card/95 text-card-foreground shadow-lg backdrop-blur hover:bg-accent hover:text-accent-foreground"
      onClick={handleToggle}
      size="icon-lg"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
      variant="outline"
    >
      <HugeiconsIcon
        aria-hidden
        icon={isDark ? Moon02Icon : Sun02Icon}
        size={18}
        strokeWidth={1.7}
      />
    </Button>
  );
};

export { ThemeToggle };
