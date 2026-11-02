"use client";
import { useEffect, useState } from "react";
import { todayISO } from "@/lib/utils";

/**
 * Returns null on the very first render (server-rendered HTML and the
 * client's first paint both show null, so they match) and the real date
 * immediately after mount. Use this instead of calling todayISO() directly
 * during render anywhere its result gets displayed as text or bound to an
 * input's value — otherwise a page pre-rendered at build time will disagree
 * with the browser about what day it is and React will throw a hydration
 * mismatch, which can break event handlers on the affected page.
 */
export function useToday() {
  const [today, setToday] = useState(null);
  useEffect(() => setToday(todayISO()), []);
  return today;
}
