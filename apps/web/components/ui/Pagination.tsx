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
    'inline-flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium transition-colors'

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        className={cn(btn, 'text-gray-500 hover:bg-gray-100', page <= 1 && 'opacity-50 pointer-events-none')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`ellipsis-${i}`} className={cn(btn, 'cursor-default')}>
            ...
          </span>
        ) : (
          <button
            key={p}
            className={cn(
              btn,
              p === page
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className={cn(btn, 'text-gray-500 hover:bg-gray-100', page >= totalPages && 'opacity-50 pointer-events-none')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
