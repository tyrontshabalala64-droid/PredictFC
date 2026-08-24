 import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Import all translation files
import en from '../locales/en.json'
import zu from '../locales/zu.json'
import xh from '../locales/xh.json'
import af from '../locales/af.json'
import nso from '../locales/nso.json'
import tn from '../locales/tn.json'
import st from '../locales/st.json'
import ts from '../locales/ts.json'
import ss from '../locales/ss.json'
import ve from '../locales/ve.json'
import nr from '../locales/nr.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'
import de from '../locales/de.json'
import pt from '../locales/pt.json'
import it from '../locales/it.json'
import nl from '../locales/nl.json'

const translationsMap = {
  en,
  zu,
  xh,
  af,
  nso,
  tn,
  st,
  ts,
  ss,
  ve,
  nr,
  es,
  fr,
  de,
  pt,
  it,
  nl
}

const TranslationContext = createContext()

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en'
  })
  const [translations, setTranslations] = useState({})

  useEffect(() => {
    try {
      // Get translations for the current language
      const newTranslations = translationsMap[language] || translationsMap.en
      setTranslations(newTranslations)
      localStorage.setItem('language', language)
      document.documentElement.lang = language
      
      // Debug: log what's loaded
      console.log('Language changed to:', language)
      console.log('Translations loaded:', Object.keys(newTranslations).length, 'keys')
    } catch (error) {
      console.error('Error loading translations:', error)
      setTranslations(translationsMap.en)
    }
  }, [language])

  const t = useCallback((key) => {
    if (!key) return key
    
    // Check if translation exists in current language
    if (translations && translations[key] !== undefined && translations[key] !== '') {
      return translations[key]
    }
    
    // Fallback to English
    if (translationsMap.en && translationsMap.en[key] !== undefined && translationsMap.en[key] !== '') {
      return translationsMap.en[key]
    }
    
    // Return the key itself as last resort
    console.warn(`Translation missing for key: ${key}`)
    return key
  }, [translations])

  const changeLanguage = useCallback((newLanguage) => {
    if (translationsMap[newLanguage]) {
      setLanguage(newLanguage)
      localStorage.setItem('language', newLanguage)
      // Dispatch event for components that might need to react
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }))
    }
  }, [])

  const value = {
    t,
    language,
    setLanguage: changeLanguage,
    translations
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}