/** Green tick when a connection is live, hollow ring when it isn't. */
export function ICheckless({ ok }: { ok: boolean }) {
  return (
    <span
      className="mt-0.5 grid size-6 flex-none place-items-center rounded-full"
      style={{
        background: ok ? "var(--a-ok-soft)" : "var(--a-sand)",
        color: ok ? "var(--a-ok)" : "var(--a-ink-400)",
      }}
      aria-hidden="true"
    >
      {ok ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <span className="size-2 rounded-full border-[1.5px] border-current" />
      )}
    </span>
  );
}
