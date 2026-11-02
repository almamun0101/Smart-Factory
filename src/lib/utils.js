import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Returns today's date as YYYY-MM-DD in the local timezone.
function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

// Detects which shift a given moment (default: now) falls into, based on a
// "HH:MM" day-shift start time. Day shift runs from day_shift_start to
// night_shift_start; night shift wraps past midnight back to day_shift_start.
// Used both for "what shift is it right now" (production entry form) and
// "what shift will an ETA land in" (orders page).
function detectShift(dayStart = "09:00", nightStart = "21:00", at = new Date()) {
  const minutesNow = at.getHours() * 60 + at.getMinutes();
  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const dayStartM = toMinutes(dayStart);
  const nightStartM = toMinutes(nightStart);

  if (dayStartM < nightStartM) {
    return minutesNow >= dayStartM && minutesNow < nightStartM ? "day" : "night";
  }
  return minutesNow >= dayStartM || minutesNow < nightStartM ? "day" : "night";
}
function formatCurrency(amount, currency = "BDT") {
  const symbols = { BDT: "\u09F3", USD: "$", EUR: "\u20AC", GBP: "\xA3", INR: "\u20B9" };
  const symbol = symbols[currency] ?? currency + " ";
  return `${symbol}${amount.toLocaleString(void 0, { maximumFractionDigits: 2 })}`;
}
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Turns a minute count into "45m" / "3h 20m" / "2d 4h" for ETA displays.
function formatMinutes(minutes) {
  if (minutes == null || !isFinite(minutes) || minutes < 0) return "—";
  const totalMin = Math.round(minutes);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDateTime(date) {
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function genId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function daysBetween(startISO, endISO) {
  const out = [];
  const start = /* @__PURE__ */ new Date(startISO + "T00:00:00");
  const end = /* @__PURE__ */ new Date(endISO + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
export {
  cn,
  daysBetween,
  detectShift,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMinutes,
  genId,
  todayISO
};
