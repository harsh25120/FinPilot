import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

export default function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-1 pt-4 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Page {page} of {pages} <span className="hidden sm:inline">· {total} total</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={ChevronRight}
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
