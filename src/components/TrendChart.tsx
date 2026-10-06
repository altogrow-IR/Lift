import { useEffect, useState } from "react";
import { displayDate } from "../lib/model";
export function TrendChart({
  points,
  unit,
  label,
}: {
  points: { date: string; value: number }[];
  unit: string;
  label: string;
}) {
  const [activeDate, setActiveDate] = useState("");
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 540px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 540px)");
    const resize = () => setCompact(query.matches);
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  const width = compact ? 420 : 680,
    height = 264,
    left = 52,
    right = 18,
    top = 26,
    bottom = 36;
  const peak = points.reduce((highest, p) => Math.max(highest, p.value), 1);
  const maximum =
    Math.ceil((peak * 1.15) / (peak > 100 ? 50 : peak > 20 ? 10 : 5)) *
    (peak > 100 ? 50 : peak > 20 ? 10 : 5);
  const first = new Date(`${points[0].date}T12:00:00`).getTime();
  const last = new Date(`${points.at(-1)!.date}T12:00:00`).getTime();
  const positions = points.map((p) => ({
    ...p,
    x:
      points.length === 1
        ? (width + left - right) / 2
        : left +
          ((new Date(`${p.date}T12:00:00`).getTime() - first) /
            (last - first)) *
            (width - left - right),
    y: top + (1 - p.value / maximum) * (height - top - bottom),
  }));
  const active =
    positions.find((p) => p.date === activeDate) ?? positions.at(-1)!;
  const line = positions
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const tickIndexes = [
    ...new Set([
      0,
      Math.floor((positions.length - 1) / 3),
      Math.floor((2 * (positions.length - 1)) / 3),
      positions.length - 1,
    ]),
  ];
  return (
    <div className="chart-container">
      <div className="chart-value">
        <span>
          {displayDate(active.date)} の{label}
        </span>
        <strong>
          {active.value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
          <small>{unit}</small>
        </strong>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="trend-svg"
        role="img"
        aria-label={`${label}の推移。${points.map((p) => `${displayDate(p.date)}: ${p.value}${unit}`).join("、")}`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#afce65" stopOpacity=".26" />
            <stop offset="100%" stopColor="#afce65" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const y = top + (i / 4) * (height - top - bottom);
          return (
            <g key={i}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="#e8ebe3"
                strokeDasharray="4 5"
              />
              <text x={left - 12} y={y + 4} textAnchor="end">
                {(maximum * (1 - i / 4)).toLocaleString("ja-JP", {
                  maximumFractionDigits: 1,
                })}
              </text>
            </g>
          );
        })}
        {points.length > 1 && (
          <path
            d={`${line} L${positions.at(-1)!.x},${height - bottom} L${positions[0].x},${height - bottom} Z`}
            fill="url(#chart-fill)"
          />
        )}
        <path
          d={line}
          stroke="#57733a"
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <line
          x1={active.x}
          x2={active.x}
          y1={top}
          y2={height - bottom}
          stroke="#c6d6ac"
          strokeDasharray="3 4"
        />
        {positions.map((p) => (
          <circle
            key={p.date}
            cx={p.x}
            cy={p.y}
            r={p.date === active.date ? 6 : 4}
            stroke="#57733a"
            strokeWidth="2"
            fill={p.date === active.date ? "#d6ef8b" : "white"}
          />
        ))}
        {tickIndexes.map((i) => (
          <text key={i} x={positions[i].x} y={height - 8} textAnchor="middle">
            {displayDate(positions[i].date)}
          </text>
        ))}
      </svg>
      <label className="chart-scrubber">
        <span>記録した日を確認</span>
        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={positions.findIndex((p) => p.date === active.date)}
          aria-label="グラフで確認する日"
          onChange={(e) => setActiveDate(points[Number(e.target.value)].date)}
          disabled={points.length < 2}
        />
      </label>
    </div>
  );
}
