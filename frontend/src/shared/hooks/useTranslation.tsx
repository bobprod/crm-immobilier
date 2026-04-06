import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import fr from '../../locales/fr.json';
import en from '../../locales/en.json';
import ar from '../../locales/ar.json';

type Locale = 'fr' | 'en' | 'ar';
type Translations = typeof fr;

const translations: Record<Locale, Translations> = { fr, en, ar };

const RTL_LOCALES: Locale[] = ['ar'];

interface I18nContextType {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
  locales: { code: Locale; label: string; flag: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALES_INFO: { code: Locale; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇹🇳' },
];

export function I18nProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>((router.locale as Locale) || 'fr');

  const isRTL = RTL_LOCALES.includes(locale);

  // Appliquer la direction RTL/LTR au document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
    }
  }, [locale, isRTL]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      // Sauvegarder la préférence
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred_locale', newLocale);
      }
      // Changer la locale Next.js (change l'URL)
      router.push(router.pathname, router.asPath, { locale: newLocale });
    },
    [router]
  );

  // Charger la préférence sauvegardée
  useEffect(() => {
    const saved = localStorage.getItem('preferred_locale') as Locale | null;
    if (saved && translations[saved] && saved !== locale) {
      setLocale(saved);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: any = translations[locale];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Fallback au français si clé manquante
          let fallback: any = translations.fr;
          for (const fk of keys) {
            fallback = fallback?.[fk];
          }
          value = fallback || key;
          break;
        }
      }

      if (typeof value !== 'string') return key;

      // Remplacer les paramètres {name}
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, paramKey) =>
          params[paramKey] !== undefined ? String(params[paramKey]) : `{${paramKey}}`
        );
      }

      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, isRTL, locales: LOCALES_INFO }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback si pas dans le provider (SSR, tests, etc.)
    return {
      locale: 'fr' as Locale,
      t: (key: string) => key,
      setLocale: () => {},
      isRTL: false,
      locales: LOCALES_INFO,
    };
  }
  return context;
}

const LOCALES_INFO_EXPORT = LOCALES_INFO;
export { LOCALES_INFO_EXPORT as LOCALES_INFO };
