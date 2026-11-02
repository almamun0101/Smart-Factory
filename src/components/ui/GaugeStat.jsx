"use client";
const toneMap = {
  gauge: { stroke: "#F5A623", bg: "#FFF8EB" },
  instrument: { stroke: "#2A5486", bg: "#EEF3F8" },
  ok: { stroke: "#4C9A6A", bg: "#EFF7F2" }
};
function GaugeStat({ label, value, subvalue, icon: Icon, fill = 65, tone = "gauge" }) {
  const { stroke } = toneMap[tone];
  const radius = 34;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, fill));
  const dash = clamped / 100 * circumference;
  return <div className="group relative overflow-hidden rounded-panel border border-steel-200 bg-white p-5 shadow-panel transition-shadow hover:shadow-lg dark:border-steel-700 dark:bg-steel-800 dark:shadow-panel-dark">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-steel-400 dark:text-steel-400">
            {label}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-steel-800 dark:text-steel-50">{value}</p>
          {subvalue && <p className="mt-1 text-xs text-steel-400">{subvalue}</p>}
        </div>
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 80 46" className="h-16 w-16 overflow-visible animate-needle-sweep">
            <path
    d="M 6 40 A 34 34 0 0 1 74 40"
    fill="none"
    stroke="currentColor"
    className="text-steel-100 dark:text-steel-700"
    strokeWidth="6"
    strokeLinecap="round"
  />
            <path
    d="M 6 40 A 34 34 0 0 1 74 40"
    fill="none"
    stroke={stroke}
    strokeWidth="6"
    strokeLinecap="round"
    strokeDasharray={`${dash} ${circumference}`}
  />
          </svg>
          <Icon className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 text-steel-500 dark:text-steel-300" />
        </div>
      </div>
      <div
    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06] transition-opacity group-hover:opacity-[0.1]"
    style={{ background: stroke }}
  />
    </div>;
}
export {
  GaugeStat
};
