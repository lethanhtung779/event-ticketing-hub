import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import vi from './locales/vi.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { common: vi },
    },
    ns: ['common'],
    defaultNS: 'common',
    fallbackLng: 'vi',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export async function loadLocale(lng: string) {
  if (lng === 'vi') return
  if (i18n.hasResourceBundle(lng, 'common')) return
  const mod = await import('./locales/en.json')
  i18n.addResourceBundle(lng, 'common', mod.default)
}

export default i18n
