import { describe, expect, it } from 'vitest';
import { sourceMessages } from './en';
import { loadCatalog } from './loadCatalog';

describe('loadCatalog', () => {
  it('keeps English available without loading another module', async () => {
    await expect(loadCatalog('en')).resolves.toBe(sourceMessages);
  });

  it('loads and caches a translated catalog on demand', async () => {
    const first = await loadCatalog('zh-Hant');
    const second = await loadCatalog('zh-Hant');

    expect(first['welcome.title']).toBe('選擇難度');
    expect(second).toBe(first);
    expect(Object.keys(first)).toEqual(Object.keys(sourceMessages));
  });
});
