/** Stroke icons shared by the desktop and mobile journey dashboard skins. */
const PATHS = {
  copy: "M9 9h11v11H9zM5 15V4h11",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 17v.2",
  home: "M4 11l8-7 8 7v9H4zM10 20v-6h4v6",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  up: "M7 17L17 7M9 7h8v8",
  plus: "M12 5v14M5 12h14",
  doc: "M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z",
  pin: "M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  note: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",
  book: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM5 16a4 4 0 0 1 4-4h10",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a6 6 0 0 1 3 6",
  chat: "M4 5h16v11H9l-5 4z",
  lock: "M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3",
  wallet: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3M16 14h3",
  vault: "M7 3h8l4 4v14H7zM15 3v4h4",
  alert: "M12 4l9 16H3zM12 10v4M12 17v.5",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  chev: "M9 6l6 6-6 6",
  chevL: "M15 6l-6 6 6 6",
  building: "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6",
  cross: "M12 4v16M4 12h16",
  camera: "M4 8h4l2-3h4l2 3h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  check: "M5 12l4 4 10-10",
  refresh: "M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4",
  tool: "M14.7 6.3a4 4 0 00-5.4 5.1L4 16.7V20h3.3l5.3-5.3a4 4 0 005.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z",
  box: "M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  x: "M6 6l12 12M18 6L6 18",
  search: "M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM16 16l4.5 4.5",
  trash: "M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12",
  pinTack: "M9 3h6l-1 6 3 3v2H7v-2l3-3zM12 14v7",
  layout: "M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z",
  ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  question: "M9.6 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 17v.2",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ n, className, size }: { n: IconName; className?: string; size?: number }) {
  return (
    <svg
      className={className ? `rv-ic ${className}` : "rv-ic"}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[n]} />
    </svg>
  );
}

/** Icon per toolbox group id (tools / guides / services). */
export const GROUP_ICON: Record<string, IconName> = {
  tools: "tool",
  guides: "book",
  services: "box",
};
