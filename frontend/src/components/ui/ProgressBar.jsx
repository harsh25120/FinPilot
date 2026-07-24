const COLORS = {
  indigo: 'bg-indigo-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
}

export default function ProgressBar({ percentage, color = 'indigo', className = '' }) {
  const clamped = Math.min(Math.max(percentage, 0), 100)

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${COLORS[color]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
