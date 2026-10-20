/* Line icons for the portal, 1.6 stroke to match the prototype's weight. */

type P = { size?: number; className?: string };

function S({ size = 17, className = "", children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IGrid = (p: P) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
  </S>
);
export const IBox = (p: P) => (
  <S {...p}>
    <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" />
    <path d="m4 8 8 4.5M20 8l-8 4.5M12 20.5v-8" />
  </S>
);
export const IPin = (p: P) => (
  <S {...p}>
    <path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.8" r="2.3" />
  </S>
);
export const IDoc = (p: P) => (
  <S {...p}>
    <path d="M6 3.5h7l5 5v12H6z" />
    <path d="M13 3.5v5h5M9 13h6M9 16.5h6" />
  </S>
);
export const IUsers = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
    <path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.8c1.8.6 3 2.2 3.5 4.7" />
  </S>
);
export const ICalendar = (p: P) => (
  <S {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </S>
);
export const ITag = (p: P) => (
  <S {...p}>
    <path d="M11 3.5H20.5V13L11.5 22a1.5 1.5 0 0 1-2.1 0l-7.4-7.4a1.5 1.5 0 0 1 0-2.1L11 3.5Z" />
    <circle cx="16.3" cy="7.7" r="1.3" />
  </S>
);
export const IChart = (p: P) => (
  <S {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </S>
);
export const ICog = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.93-1.16l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.1 14h-.1a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.16-2.93l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.93 1.16l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.9 10h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5.5Z" />
  </S>
);
export const ISearch = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </S>
);
export const IBell = (p: P) => (
  <S {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 4.5-1.5 6-1.5 6h15S18 13.5 18 9Z" />
    <path d="M10.3 19a2 2 0 0 0 3.4 0" />
  </S>
);
export const IPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const IMenu = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
);
export const IClose = (p: P) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </S>
);
export const IExternal = (p: P) => (
  <S {...p}>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M19 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6.5A1.5 1.5 0 0 1 5 5h4.5" />
  </S>
);
export const ISparkle = (p: P) => (
  <S {...p}>
    <path d="M12 3.5c.6 4.6 3.9 7.9 8.5 8.5-4.6.6-7.9 3.9-8.5 8.5-.6-4.6-3.9-7.9-8.5-8.5 4.6-.6 7.9-3.9 8.5-8.5Z" />
  </S>
);
export const IInbox = (p: P) => (
  <S {...p}>
    <path d="M3.5 13.5h4l1.5 3h6l1.5-3h4" />
    <path d="M5.5 4.5h13l2 9v4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-4l2-9Z" />
  </S>
);
