import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dist = 'dist';
const manifestPath = join(dist, '.vite', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
if (!entry) throw new Error('Build manifest has no application entry.');

const productionCatalogs = [
  'ar',
  'cs',
  'de',
  'es',
  'fil',
  'fr',
  'hi',
  'id',
  'it',
  'ja',
  'ko',
  'ms',
  'nl',
  'pl',
  'pt-BR',
  'ru',
  'sv',
  'th',
  'tr',
  'uk',
  'vi',
  'zh-Hans',
  'zh-Hant',
].map((locale) => `src/i18n/catalogs/${locale}.ts`);

const staticKeys = new Set();
const visitStatic = (key) => {
  if (staticKeys.has(key)) return;
  staticKeys.add(key);
  for (const dependency of manifest[key]?.imports ?? [])
    visitStatic(dependency);
};
const entryKey = Object.entries(manifest).find(
  ([, chunk]) => chunk === entry,
)[0];
visitStatic(entryKey);

for (const source of productionCatalogs) {
  const chunk = manifest[source];
  if (!chunk?.isDynamicEntry) {
    throw new Error(`${source} is not an independent dynamic entry.`);
  }
  if (staticKeys.has(source)) {
    throw new Error(`${source} is reachable from the initial static graph.`);
  }
}

const initialJavaScript = [...staticKeys]
  .map((key) => manifest[key]?.file)
  .filter((file) => file?.endsWith('.js'));
const initialBytes = initialJavaScript.reduce(
  (total, file) => total + readFileSync(join(dist, file)).length,
  0,
);
const initialGzipBytes = initialJavaScript.reduce(
  (total, file) => total + gzipSync(readFileSync(join(dist, file))).length,
  0,
);

const baselineGzipBytes = 110_745;
const maximumGzipBytes = Math.ceil(baselineGzipBytes * 1.1);
if (initialGzipBytes > maximumGzipBytes) {
  throw new Error(
    `Initial JavaScript is ${initialGzipBytes} gzip bytes; budget is ${maximumGzipBytes}.`,
  );
}

console.log(
  JSON.stringify({
    initialJavaScript,
    initialBytes,
    initialGzipBytes,
    baselineGzipBytes,
    maximumGzipBytes,
    dynamicProductionCatalogs: productionCatalogs.length,
  }),
);
