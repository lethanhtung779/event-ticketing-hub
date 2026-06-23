'use client'

import { Search, MapPin } from 'lucide-react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import type { Category } from '@/types'

interface EventFiltersProps {
  search: string
  categoryId: string
  location: string
  categories: Category[]
  onSearchChange: (val: string) => void
  onCategoryChange: (val: string) => void
  onLocationChange: (val: string) => void
  onClear: () => void
}

export default function EventFilters({
  search,
  categoryId,
  location,
  categories,
  onSearchChange,
  onCategoryChange,
  onLocationChange,
  onClear,
}: EventFiltersProps) {
  const hasFilters = search || categoryId || location

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <Select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="Danh mục"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Địa điểm..."
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Xoá bộ lọc
          </Button>
        </div>
      )}
    </div>
  )
}
