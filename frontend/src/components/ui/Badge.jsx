const COLORS = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  red: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
}

export default function Badge({ children, color = 'slate', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[color]} ${className}`}
    >
      {children}
    </span>
  )
}
