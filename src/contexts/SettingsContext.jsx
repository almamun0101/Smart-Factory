"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_SETTINGS } from "@/types";
const SETTINGS_DOC = "app_config/settings";
const SettingsContext = createContext(void 0);
function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ref = doc(db, SETTINGS_DOC);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const applyDark = (dark) => root.classList.toggle("dark", dark);
    // "system" mode watches the OS preference live and unsubscribes on cleanup;
    // "light"/"dark" just force the class once.
    if (settings.theme === "dark") applyDark(true);
    else if (settings.theme === "light") applyDark(false);
    else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyDark(mq.matches);
      const listener = (e) => applyDark(e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [settings.theme]);
  async function updateSettings(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await setDoc(doc(db, SETTINGS_DOC), next, { merge: true });
  }
  return <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>;
}
function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
export {
  SettingsProvider,
  useSettings
};
