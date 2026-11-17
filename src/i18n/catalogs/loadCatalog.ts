import { sourceMessages } from './en';
import type { IntlMessageCatalog, RuntimeLocale } from './types';

type CatalogLoader = () => Promise<IntlMessageCatalog>;

const catalogLoaders = {
  en: async () => sourceMessages,
  ar: async () => (await import('./ar')).ar,
  cs: async () => (await import('./cs')).cs,
  de: async () => (await import('./de')).de,
  es: async () => (await import('./es')).es,
  fil: async () => (await import('./fil')).fil,
  fr: async () => (await import('./fr')).fr,
  hi: async () => (await import('./hi')).hi,
  id: async () => (await import('./id')).id,
  it: async () => (await import('./it')).it,
  ja: async () => (await import('./ja')).ja,
  ko: async () => (await import('./ko')).ko,
  ms: async () => (await import('./ms')).ms,
  nl: async () => (await import('./nl')).nl,
  pl: async () => (await import('./pl')).pl,
  'pt-BR': async () => (await import('./pt-BR')).ptBR,
  ru: async () => (await import('./ru')).ru,
  sv: async () => (await import('./sv')).sv,
  th: async () => (await import('./th')).th,
  tr: async () => (await import('./tr')).tr,
  uk: async () => (await import('./uk')).uk,
  vi: async () => (await import('./vi')).vi,
  'zh-Hans': async () => (await import('./zh-Hans')).zhHans,
  'zh-Hant': async () => (await import('./zh-Hant')).zhHant,
  'en-XA': async () => (await import('./pseudo')).pseudoCatalog,
} satisfies Record<RuntimeLocale, CatalogLoader>;

const catalogPromises = new Map<RuntimeLocale, Promise<IntlMessageCatalog>>([
  ['en', Promise.resolve(sourceMessages)],
]);

export function loadCatalog(
  locale: RuntimeLocale,
): Promise<IntlMessageCatalog> {
  const cached = catalogPromises.get(locale);
  if (cached) return cached;

  const pending = catalogLoaders[locale]().catch((error: unknown) => {
    catalogPromises.delete(locale);
    throw error;
  });
  catalogPromises.set(locale, pending);
  return pending;
}
