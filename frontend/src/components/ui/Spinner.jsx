import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 24, className = '', label = 'Loading…' }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-slate-400 ${className}`} role="status">
      <Loader2 size={size} className="animate-spin" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
