import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/doctors", label: "Find Doctor" },
  { to: "/nutrition", label: "Nutritionist" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#07202a] backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-transparent">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <NavLink to="/" className="text-xl font-semibold tracking-tight flex items-baseline gap-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-sky-400">
            Swasthya
          </span>
          <span className="text-slate-800 dark:text-white text-sm font-medium">AI</span>
        </NavLink>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative px-1 py-2 text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors ${
                  isActive ? "text-slate-900 dark:text-white" : ""
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="active-tab"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-emerald-300 to-fuchsia-500"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <a href="/doctors" className="ml-4 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-300 to-fuchsia-500 px-4 py-2 text-slate-900 font-semibold shadow hover:shadow-md transition-shadow">
            Get Started
          </a>
        </nav>
        <div className="md:hidden">
          {/* Simple mobile menu placeholder - could be enhanced later */}
          <button className="px-3 py-2 rounded-md bg-slate-100 dark:bg-white/10 ring-1 ring-slate-200 dark:ring-white/10 text-slate-700 dark:text-white/90 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
            Menu
          </button>
        </div>
      </div>
    </header>
  );
}
