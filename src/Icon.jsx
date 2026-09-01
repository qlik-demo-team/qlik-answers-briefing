// Inline SVG icons used across the app. No icon font needed.
const ICONS = {
  assistant: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />,
  reload: (
    <>
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  warning: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  'bar-chart': <path d="M18 20V10M12 20V4M6 20v-6" />,
  code: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  add: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  settings: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />,
};

export default function Icon({ name, size = 18, className }) {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
