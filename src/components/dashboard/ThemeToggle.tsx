"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 opacity-50 flex items-center justify-center">
        <Sun className="w-4 h-4 text-white/50" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-1.5 rounded-lg border border-white/10 bg-white/[0.05] text-[#9AA2B1] hover:text-white hover:bg-white/10 transition-all duration-150 shadow-sm flex items-center justify-center"
      aria-label="Alternar modo de color"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-white" />
      )}
    </button>
  );
}
