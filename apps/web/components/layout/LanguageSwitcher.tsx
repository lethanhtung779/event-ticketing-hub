'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, Check } from 'lucide-react'

const languages = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const current = languages.find((l) => l.code === i18n.language) || languages[0]

  const switchLang = (code: string) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-white/85 hover:bg-white/10 transition-all duration-200"
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline text-base leading-none">{current.flag}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-[0_4px_16px_-4px_rgb(0_0_0_/_0.1),0_2px_4px_-4px_rgb(0_0_0_/_0.04)] animate-scale-in origin-top-right dark:border-gray-800 dark:bg-neutral-900">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLang(lang.code)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-gray-200 dark:hover:bg-white/5"
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span>{lang.label}</span>
                {lang.code === i18n.language && (
                  <Check className="ml-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
