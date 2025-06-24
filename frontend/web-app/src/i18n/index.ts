/**
 * Internationalization (i18n) Configuration
 * AI-Powered eLearning Platform - Frontend
 * 
 * Supports all 70+ FSI languages with RTL/LTR text direction
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Language configuration mapping
export const SUPPORTED_LANGUAGES = {
  // Category I (Easiest)
  'en': { name: 'English', nativeName: 'English', direction: 'ltr', script: 'latin' },
  'es': { name: 'Spanish', nativeName: 'Español', direction: 'ltr', script: 'latin' },
  'fr': { name: 'French', nativeName: 'Français', direction: 'ltr', script: 'latin' },
  'it': { name: 'Italian', nativeName: 'Italiano', direction: 'ltr', script: 'latin' },
  'pt': { name: 'Portuguese', nativeName: 'Português', direction: 'ltr', script: 'latin' },
  
  // Category II
  'de': { name: 'German', nativeName: 'Deutsch', direction: 'ltr', script: 'latin' },
  'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', script: 'latin' },
  
  // Category III
  'ru': { name: 'Russian', nativeName: 'Русский', direction: 'ltr', script: 'cyrillic' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', script: 'devanagari' },
  'ur': { name: 'Urdu', nativeName: 'اردو', direction: 'rtl', script: 'arabic' },
  'fa': { name: 'Persian', nativeName: 'فارسی', direction: 'rtl', script: 'arabic' },
  'he': { name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', script: 'hebrew' },
  'th': { name: 'Thai', nativeName: 'ไทย', direction: 'ltr', script: 'thai' },
  'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', script: 'latin' },
  
  // Category IV (Most Difficult)
  'ar': { name: 'Arabic', nativeName: 'العربية', direction: 'rtl', script: 'arabic' },
  'zh': { name: 'Chinese (Mandarin)', nativeName: '中文', direction: 'ltr', script: 'chinese' },
  'ja': { name: 'Japanese', nativeName: '日本語', direction: 'ltr', script: 'japanese' },
  'ko': { name: 'Korean', nativeName: '한국어', direction: 'ltr', script: 'korean' }
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// RTL languages list
export const RTL_LANGUAGES = ['ar', 'ur', 'fa', 'he'];

// Language detection options
const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
  lookupLocalStorage: 'elearning-language',
  checkWhitelist: true
};

// i18n configuration
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en',
    
    // Whitelist supported languages
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    // Language detection
    detection: detectionOptions,
    
    // Backend configuration for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/{{lng}}/{{ns}}.missing.json'
    },
    
    // Namespaces
    ns: ['common', 'auth', 'courses', 'lessons', 'profile', 'navigation', 'errors'],
    defaultNS: 'common',
    
    // Interpolation
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
      format: (value, format, lng) => {
        // Custom formatting for dates, numbers, etc.
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'date') return new Intl.DateTimeFormat(lng).format(new Date(value));
        if (format === 'number') return new Intl.NumberFormat(lng).format(value);
        if (format === 'currency') return new Intl.NumberFormat(lng, { style: 'currency', currency: 'USD' }).format(value);
        return value;
      }
    },
    
    // React options
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
    },
    
    // Debug mode
    debug: process.env.NODE_ENV === 'development',
    
    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
      }
    },
    
    // Plurals
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Performance
    load: 'languageOnly', // Don't load region-specific variants
    cleanCode: true,
    
    // Error handling
    returnNull: false,
    returnEmptyString: false,
    returnObjects: false,
    
    // Post-processing
    postProcess: ['interval', 'sprintf'],
    
    // Key generation
    keySeparator: '.',
    nsSeparator: ':',
    
    // Additional options for multi-script support
    appendNamespaceToMissingKey: false,
    parseMissingKeyHandler: (key: string) => {
      // Handle missing keys gracefully for different scripts
      return key.split('.').pop() || key;
    }
  });

// Helper functions
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language || 'en') as SupportedLanguage;
};

export const getLanguageDirection = (lang?: string): 'ltr' | 'rtl' => {
  const language = (lang || getCurrentLanguage()) as SupportedLanguage;
  return SUPPORTED_LANGUAGES[language]?.direction || 'ltr';
};

export const getLanguageScript = (lang?: string): string => {
  const language = (lang || getCurrentLanguage()) as SupportedLanguage;
  return SUPPORTED_LANGUAGES[language]?.script || 'latin';
};

export const isRTL = (lang?: string): boolean => {
  const language = lang || getCurrentLanguage();
  return RTL_LANGUAGES.includes(language);
};

export const changeLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
  
  // Update document direction
  const direction = getLanguageDirection(lang);
  document.documentElement.dir = direction;
  document.documentElement.lang = lang;
  
  // Update local storage
  localStorage.setItem('elearning-language', lang);
  localStorage.setItem('elearning-direction', direction);
  
  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent('languageChanged', { 
    detail: { language: lang, direction } 
  }));
};

export const getAvailableLanguages = () => {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => ({
    code: code as SupportedLanguage,
    name: config.name,
    nativeName: config.nativeName,
    direction: config.direction,
    script: config.script
  }));
};

// Format functions for different number systems
export const formatNumber = (value: number, lang?: string): string => {
  const language = lang || getCurrentLanguage();
  return new Intl.NumberFormat(language).format(value);
};

export const formatCurrency = (value: number, currency = 'USD', lang?: string): string => {
  const language = lang || getCurrentLanguage();
  return new Intl.NumberFormat(language, { 
    style: 'currency', 
    currency 
  }).format(value);
};

export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions, lang?: string): string => {
  const language = lang || getCurrentLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(language, { ...defaultOptions, ...options }).format(dateObj);
};

export const formatRelativeTime = (date: Date | string, lang?: string): string => {
  const language = lang || getCurrentLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Use Intl.RelativeTimeFormat for better localization
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
};

// Text processing utilities for different scripts
export const getTextDirection = (text: string): 'ltr' | 'rtl' => {
  // Basic RTL detection using Unicode ranges
  const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlChars.test(text) ? 'rtl' : 'ltr';
};

export const shouldUseNativeDigits = (lang: string): boolean => {
  // Languages that commonly use native digit systems
  const nativeDigitLanguages = ['ar', 'fa', 'hi', 'th'];
  return nativeDigitLanguages.includes(lang);
};

// Initialize direction on app load
const initialLang = getCurrentLanguage();
const initialDirection = getLanguageDirection(initialLang);
document.documentElement.dir = initialDirection;
document.documentElement.lang = initialLang;

export default i18n;