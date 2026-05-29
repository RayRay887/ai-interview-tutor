import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

interface QuestionPaginationProps {
  page: number
  totalItems: number
  onPageChange: (page: number) => void
}

export { PAGE_SIZE }

export function QuestionPagination({ page, totalItems, onPageChange }: QuestionPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  if (totalItems <= PAGE_SIZE) {
    return null
  }

  const start = (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, totalItems)

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6"
      aria-label="Question bank pagination"
    >
      <p className="text-sm text-text-secondary">
        Showing {start}–{end} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-bg-primary/80 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <span className="px-2 text-sm text-text-secondary">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-bg-primary/80 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
