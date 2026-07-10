'use client'

import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-lg',
  lg: 'h-16 w-16 text-xl',
}

export default function Avatar({ src, name, size = 'sm', className = '' }: AvatarProps) {
  const [error, setError] = useState(false)

  if (src && !error) {
    return (
      <div className={`${sizeMap[size]} rounded-full overflow-hidden shrink-0 ${className}`}>
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      </div>
    )
  }

  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0 ${className}`}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}
