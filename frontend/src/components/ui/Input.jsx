import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, hint, className = '', containerClassName = '', id, ...rest },
  ref
) {
  const inputId = id || rest.name

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600 ${
          error
            ? 'border-rose-400 focus:border-rose-500 dark:border-rose-700'
            : 'border-slate-300 focus:border-indigo-500 dark:border-slate-700'
        } ${className}`}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
})

export default Input
