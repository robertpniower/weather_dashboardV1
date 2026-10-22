type GaugeProps = {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  label: string;
  decimals?: number;
  /** Returns a CSS color for the current value. */
  color: (value: number) => string;
};

const SIZE = 120;
const STROKE = 9;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
// 270° arc, opening at the bottom
const START = 135;
const SWEEP = 270;

function polar(angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

function arc(from: number, to: number) {
  const s = polar(from);
  const e = polar(to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function Gauge({
  value,
  min,
  max,
  unit,
  label,
  decimals = 0,
  color,
}: GaugeProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const pct = hasValue ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const end = START + SWEEP * pct;
  const text = hasValue ? value.toFixed(decimals) : "–";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`${label}: ${hasValue ? text + unit : "no data"}`}
        >
          <path
            d={arc(START, START + SWEEP)}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="stroke-neutral-200 dark:stroke-neutral-800"
          />
          {hasValue && pct > 0.005 && (
            <path
              d={arc(START, end)}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              stroke={color(value)}
              style={{ transition: "stroke 0.5s ease" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums leading-none">
            {text}
            {hasValue && (
              <span className="ml-0.5 text-sm font-normal text-neutral-400">{unit}</span>
            )}
          </span>
        </div>
      </div>
      <span className="-mt-3 text-xs uppercase tracking-widest text-neutral-400">
        {label}
      </span>
    </div>
  );
}
