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
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{current.flag}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLang(lang.code)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
                {lang.code === i18n.language && (
                  <Check className="ml-auto h-4 w-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
