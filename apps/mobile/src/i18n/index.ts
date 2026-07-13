import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import vi from './locales/vi.json'
import en from './locales/en.json'

const LANGUAGE_KEY = 'app_language'

i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
})

AsyncStorage.getItem(LANGUAGE_KEY).then((lang) => {
  if (lang) i18n.changeLanguage(lang)
})

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang)
  await AsyncStorage.setItem(LANGUAGE_KEY, lang)
}

export default i18n
