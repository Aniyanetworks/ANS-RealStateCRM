/* eslint-disable @typescript-eslint/no-explicit-any */
// Small dependency-free SVG charts used by the dashboard.
const TEAL = "#0f766e";

export const money = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};
export const moneyFull = (n: number) => `$${Math.round(n).toLocaleString()}`;
export const num = (v: any) => parseFloat(String(v ?? "0")) || 0;

/* ---------- tiny SVG charts (no extra dependency) ---------- */
export const Sparkline = ({ values }: { values: number[] }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 80},${26 - (v / max) * 22}`).join(" ");
  return (
    <svg viewBox="0 0 80 28" className="h-7 w-20">
      <polyline points={pts} fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const AreaChart = ({ data, format }: { data: { label: string; value: number }[]; format: (n: number) => string }) => {
  const W = 900, H = 250, l = 52, r = 16, t = 14, b = 30;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const x = (i: number) => l + (i * (W - l - r)) / Math.max(data.length - 1, 1);
  const y = (v: number) => t + (1 - v / top) * (H - t - b);
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `C${(pts[i - 1][0] + p[0]) / 2},${pts[i - 1][1]} ${(pts[i - 1][0] + p[0]) / 2},${p[1]} ${p[0]},${p[1]}`)).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - b} L${x(0)},${H - b} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      <defs>
        <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.25" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={l} x2={W - r} y1={y(tk)} y2={y(tk)} stroke="#eef2f1" />
          <text x={l - 8} y={y(tk) + 4} textAnchor="end" fontSize="10" fill="#98a2b3">{format(tk)}</text>
        </g>
      ))}
      <path d={area} fill="url(#dashArea)" />
      <path d={line} fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill="#fff" stroke={TEAL} strokeWidth="2">
            <title>{`${data[i].label}: ${format(data[i].value)}`}</title>
          </circle>
          <text x={p[0]} y={H - 8} textAnchor="middle" fontSize="10" fill="#667085">{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
};

export const Donut = ({ segments, center }: { segments: { label: string; value: number; color: string }[]; center: string }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 42, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-44 w-44 shrink-0">
      <circle cx="60" cy="60" r={R} fill="none" stroke="#f2f4f7" strokeWidth="14" />
      {segments.map((s) => {
        const len = (s.value / total) * C;
        const el = (
          <circle key={s.label} cx="60" cy="60" r={R} fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 60 60)">
            <title>{`${s.label}: ${s.value}`}</title>
          </circle>
        );
        acc += len;
        return el;
      })}
      <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1d2939">{center}</text>
      <text x="60" y="74" textAnchor="middle" fontSize="9" fill="#667085">Trade sheets</text>
    </svg>
  );
};

