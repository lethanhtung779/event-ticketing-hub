import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, showPasswordToggle, type, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const [focused, setFocused] = useState(false)
    const isPassword = type === 'password'
    const resolvedType = isPassword && showPasswordToggle ? (visible ? 'text' : 'password') : type

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={resolvedType}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
            className={cn(
              'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 transition-all duration-200 dark:bg-neutral-900 dark:text-white',
              'placeholder:text-slate-400 dark:placeholder:text-gray-500',
              'shadow-[0_1px_2px_0_rgb(0_0_0_/_0.02)]',
              props.disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed dark:bg-neutral-800 dark:text-gray-400',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20',
              isPassword && showPasswordToggle && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              tabIndex={-1}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 animate-fade-in">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
