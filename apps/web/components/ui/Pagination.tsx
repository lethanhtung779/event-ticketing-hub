'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | string)[] = []
  const delta = 2

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const btn =
    'inline-flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200'

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        className={cn(btn, 'text-slate-500 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10', page <= 1 && 'opacity-40 pointer-events-none')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`ellipsis-${i}`} className={cn(btn, 'cursor-default text-slate-300 dark:text-gray-500')}>
            ...
          </span>
        ) : (
          <button
            key={p}
            className={cn(
              btn,
              p === page
                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                : 'text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-white/10'
            )}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className={cn(btn, 'text-slate-500 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10', page >= totalPages && 'opacity-40 pointer-events-none')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
