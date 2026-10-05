import type { CSSProperties } from "react";
const paths = {
  dumbbell: (
    <>
      <path d="M6 5v14M3 8v8M18 5v14M21 8v8M6 12h12" />
    </>
  ),
  record: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="3" />
      <path d="M9 3h6M9 10h6M9 14h6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16M7 15l4-5 4 2 5-7" />
    </>
  ),
  history: (
    <>
      <path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7M12 7v5l3 2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="17" r="3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  edit: (
    <>
      <path d="m15 4 5 5M4 20l4-1L20 7a2 2 0 0 0-3-3L5 16z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V3m-5 5 5-5 5 5M4 17v4h16v-4" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C9 2 2 8 6 16s15 3 14-12ZM4 21 15 10" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 3h8v6a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5M8 21v-3h8v3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 22,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
