export function ProgressBar({ value, max = 100, label, className = "" }: { value: number; max?: number; label?: string; className?: string }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`progress-track block ${className}`}
    >
      <span className="progress-fill block" style={{ inlineSize: `${percent}%` }} />
    </span>
  );
}
