import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme");
  return stored ? stored : "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>(getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed bottom-5 right-5 z-50 group"
    >
      <motion.div
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className="relative grid h-12 w-12 place-items-center rounded-full bg-white dark:bg-slate-800/80 ring-1 ring-gray-200 dark:ring-white/10 shadow-lg"
      >
        <AnimatePresence initial={false} mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-blue-200"
            >
              <Moon size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-amber-500"
            >
              <Sun size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}
