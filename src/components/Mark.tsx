/** The Collage wordmark glyph - two stacked frames with an accent chip. */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      className={`shrink-0 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="7"
        width="17"
        height="17"
        rx="3.5"
        transform="rotate(-6 4 7)"
        fill="currentColor"
        opacity="0.35"
      />
      <rect
        x="11"
        y="9"
        width="17"
        height="17"
        rx="3.5"
        transform="rotate(7 11 9)"
        fill="currentColor"
      />
      <circle cx="19.5" cy="17.5" r="3" fill="var(--color-accent)" />
    </svg>
  );
}
