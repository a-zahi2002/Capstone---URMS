"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-none bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border animate-pulse" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#0EA5E9]/40 hover:bg-[#F0F9FF] dark:hover:bg-slate-800 transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: 20, opacity: 0, rotate: 45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: -45 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-cyan-400" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
