'use client'

import { useEffect } from 'react'

interface SeoHeadProps {
  title: string
  description?: string
}

export default function SeoHead({ title, description }: SeoHeadProps) {
  useEffect(() => {
    const prev = document.title
    document.title = `${title} | TicketHub`
    return () => { document.title = prev }
  }, [title])

  useEffect(() => {
    if (!description) return
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    const prev = meta.content
    meta.content = description
    return () => { meta!.content = prev }
  }, [description])

  return null
}