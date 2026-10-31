// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SudokuApiError } from '../api/client';
import { createLocalId, isSignedOut } from './sessionLifecycleRecords';

afterEach(() => vi.unstubAllGlobals());

describe('session lifecycle record helpers', () => {
  it('recognizes both signed-out statuses and rejects unrelated failures', () => {
    expect(isSignedOut(new SudokuApiError('expired', 403, 'forbidden'))).toBe(
      true,
    );
    expect(isSignedOut(new SudokuApiError('server', 500, 'internal'))).toBe(
      false,
    );
    expect(isSignedOut(new Error('network'))).toBe(false);
  });

  it('creates a local identifier when random UUID support is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(createLocalId()).toBe('guest-1700000000000-i');
  });
});
