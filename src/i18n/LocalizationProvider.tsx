import { IntlProvider, createIntl } from 'react-intl';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { sourceMessages } from './catalogs/en';
import type { RuntimeLocale } from './catalogs/types';
import { loadCatalog } from './catalogs/loadCatalog';
import type { IntlMessageCatalog } from './catalogs/types';
import { intlCache, LocalizationContext } from './localization';

const localeMetadata: Record<
  RuntimeLocale,
  { lang: string; dir: 'ltr' | 'rtl' }
> = {
  en: { lang: 'en', dir: 'ltr' },
  fil: { lang: 'fil', dir: 'ltr' },
  'zh-Hans': { lang: 'zh-Hans', dir: 'ltr' },
  'zh-Hant': { lang: 'zh-Hant', dir: 'ltr' },
  cs: { lang: 'cs', dir: 'ltr' },
  nl: { lang: 'nl', dir: 'ltr' },
  'pt-BR': { lang: 'pt-BR', dir: 'ltr' },
  es: { lang: 'es', dir: 'ltr' },
  sv: { lang: 'sv', dir: 'ltr' },
  ja: { lang: 'ja', dir: 'ltr' },
  ko: { lang: 'ko', dir: 'ltr' },
  ms: { lang: 'ms', dir: 'ltr' },
  pl: { lang: 'pl', dir: 'ltr' },
  fr: { lang: 'fr', dir: 'ltr' },
  de: { lang: 'de', dir: 'ltr' },
  ru: { lang: 'ru', dir: 'ltr' },
  ar: { lang: 'ar', dir: 'rtl' },
  id: { lang: 'id', dir: 'ltr' },
  hi: { lang: 'hi', dir: 'ltr' },
  it: { lang: 'it', dir: 'ltr' },
  th: { lang: 'th', dir: 'ltr' },
  tr: { lang: 'tr', dir: 'ltr' },
  vi: { lang: 'vi', dir: 'ltr' },
  uk: { lang: 'uk', dir: 'ltr' },
  'en-XA': { lang: 'en-XA', dir: 'ltr' },
};

type LocalizationProviderProps = {
  locale: RuntimeLocale;
  children: ReactNode;
};

export function LocalizationProvider({
  locale,
  children,
}: LocalizationProviderProps) {
  const [loadedCatalog, setLoadedCatalog] = useState<{
    locale: RuntimeLocale;
    messages: IntlMessageCatalog;
  }>({ locale: 'en', messages: sourceMessages });

  useEffect(() => {
    if (loadedCatalog.locale === locale) return;

    let current = true;
    void loadCatalog(locale).then(
      (messages) => {
        if (current) setLoadedCatalog({ locale, messages });
      },
      () => {
        // Keep the current complete catalog when a chunk cannot be loaded.
      },
    );
    return () => {
      current = false;
    };
  }, [loadedCatalog.locale, locale]);

  const metadata = localeMetadata[loadedCatalog.locale];
  const intl = useMemo(
    () =>
      createIntl(
        {
          locale: loadedCatalog.locale,
          defaultLocale: 'en',
          messages: loadedCatalog.messages,
        },
        intlCache,
      ),
    [loadedCatalog],
  );

  useEffect(() => {
    document.documentElement.lang = metadata.lang;
    document.documentElement.dir = metadata.dir;
  }, [metadata.dir, metadata.lang]);

  return (
    <LocalizationContext.Provider
      value={{ locale: loadedCatalog.locale, intl }}
    >
      <IntlProvider
        locale={loadedCatalog.locale}
        defaultLocale="en"
        messages={loadedCatalog.messages}
      >
        {children}
      </IntlProvider>
    </LocalizationContext.Provider>
  );
}
