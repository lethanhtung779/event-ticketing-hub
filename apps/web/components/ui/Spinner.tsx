import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600',
          sizes[size]
        )}
      />
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
