"use client";
import { useState } from "react";
import { Menu, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useRouter } from "next/navigation";
function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function handleLogout() {
    setBusy(true);
    await logout();
    router.push("/login");
  }
  function toggleTheme() {
    const next = settings.theme === "dark" ? "light" : "dark";
    updateSettings({ theme: next });
  }
  return <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-steel-200 bg-white/80 px-4 backdrop-blur dark:border-steel-700 dark:bg-steel-900/80">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="hidden font-display text-lg font-semibold text-steel-800 dark:text-steel-50 lg:block">
        {settings.factory_name}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <button
    onClick={toggleTheme}
    className="rounded-lg p-2 text-steel-500 hover:bg-steel-100 dark:text-steel-400 dark:hover:bg-steel-800"
    aria-label="Toggle theme"
  >
          {settings.theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
        <div className="hidden items-center gap-2 rounded-lg border border-steel-200 px-3 py-1.5 dark:border-steel-700 sm:flex">
          <div className="h-7 w-7 rounded-full bg-gauge-400 flex items-center justify-center text-xs font-bold text-white">
            {user?.email?.[0].toUpperCase() ?? "A"}
          </div>
          <span className="max-w-[140px] truncate text-sm text-steel-600 dark:text-steel-300">{user?.email}</span>
        </div>
        <button
    onClick={handleLogout}
    disabled={busy}
    className="rounded-lg p-2 text-steel-500 hover:bg-danger/10 hover:text-danger dark:text-steel-400"
    aria-label="Log out"
  >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>;
}
export {
  Navbar
};
