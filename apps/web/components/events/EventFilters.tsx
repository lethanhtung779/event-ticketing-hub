'use client'

import { Search, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Category } from '@/types'

interface EventFiltersProps {
  search: string
  categoryId: string
  location: string
  sortBy: string
  minPrice: string
  maxPrice: string
  fromDate: string
  toDate: string
  categories: Category[]
  onSearchChange: (val: string) => void
  onCategoryChange: (val: string) => void
  onLocationChange: (val: string) => void
  onSortChange: (val: string) => void
  onMinPriceChange: (val: string) => void
  onMaxPriceChange: (val: string) => void
  onFromDateChange: (val: string) => void
  onToDateChange: (val: string) => void
  onClear: () => void
}

export default function EventFilters({
  search,
  categoryId,
  location,
  sortBy,
  minPrice,
  maxPrice,
  fromDate,
  toDate,
  categories,
  onSearchChange,
  onCategoryChange,
  onLocationChange,
  onSortChange,
  onMinPriceChange,
  onMaxPriceChange,
  onFromDateChange,
  onToDateChange,
  onClear,
}: EventFiltersProps) {
  const { t } = useTranslation()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const hasFilters = search || categoryId || location || sortBy !== 'startTime_asc' || minPrice || maxPrice || fromDate || toDate

  const sortOptions = useMemo(() => [
    { value: 'startTime_asc', label: t('events.sortEarliest') },
    { value: 'startTime_desc', label: t('events.sortLatest') },
    { value: 'newest', label: t('events.sortNewest') },
    { value: 'price_asc', label: t('events.sortPriceLow') },
    { value: 'price_desc', label: t('events.sortPriceHigh') },
  ], [t])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-neutral-900">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('events.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:placeholder:text-gray-500"
          />
        </div>
        <Select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder={t('events.filterCategory')}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('events.filterLocation')}
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:placeholder:text-gray-500"
          />
        </div>
        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          options={sortOptions}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {t('events.advancedFilters')}
      </button>

      {showAdvanced && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            type="number"
            min={0}
            placeholder={t('events.priceFrom')}
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            placeholder={t('events.priceTo')}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
          />
          <Input
            type="date"
            placeholder={t('events.dateFrom')}
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
          />
          <Input
            type="date"
            placeholder={t('events.dateTo')}
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
          />
        </div>
      )}

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t('events.clearFilters')}
          </Button>
        </div>
      )}
    </div>
  )
}
