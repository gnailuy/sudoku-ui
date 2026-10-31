// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import type { Account, AccountGame, GuestGame } from '../api/types';
import { makeSnapshot } from '../test/fixtures';

const api = vi.hoisted(() => ({
  health: vi.fn(),
  createGuestGame: vi.fn(),
  applyGuestAction: vi.fn(),
  previewGuestHint: vi.fn(),
  getCurrentAccount: vi.fn(),
  listAccountGames: vi.fn(),
  claimGuestGame: vi.fn(),
  createAccountGame: vi.fn(),
  getAccountGame: vi.fn(),
  applyAccountGameAction: vi.fn(),
  previewAccountGameHint: vi.fn(),
  deleteAccountGame: vi.fn(),
  deleteAllAccountGames: vi.fn(),
  updateAccountGamePresentation: vi.fn(),
  logout: vi.fn(),
  revokeAccountSessions: vi.fn(),
  deleteCurrentAccount: vi.fn(),
}));

const storage = vi.hoisted(() => ({
  get: vi.fn(),
  replace: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    SudokuApiClient: class {
      health = api.health;
      createGuestGame = api.createGuestGame;
      applyGuestAction = api.applyGuestAction;
      previewGuestHint = api.previewGuestHint;
      getCurrentAccount = api.getCurrentAccount;
      listAccountGames = api.listAccountGames;
      claimGuestGame = api.claimGuestGame;
      createAccountGame = api.createAccountGame;
      getAccountGame = api.getAccountGame;
      applyAccountGameAction = api.applyAccountGameAction;
      previewAccountGameHint = api.previewAccountGameHint;
      deleteAccountGame = api.deleteAccountGame;
      deleteAllAccountGames = api.deleteAllAccountGames;
      updateAccountGamePresentation = api.updateAccountGamePresentation;
      logout = api.logout;
      revokeAccountSessions = api.revokeAccountSessions;
      deleteCurrentAccount = api.deleteCurrentAccount;
      googleLoginUrl = (returnTo: string) => `/login?return_to=${returnTo}`;
    },
  };
});

vi.mock('../storage/guestGameRepository', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../storage/guestGameRepository')>();
  return {
    ...actual,
    GuestGameRepository: class {
      get = storage.get;
      replace = storage.replace;
      clear = storage.clear;
    },
  };
});

import { SudokuApiError } from '../api/client';
import type { GuestGameRecord } from '../storage/guestGameRepository';
import { useSessionLifecycle } from './useSessionLifecycle';

export const guest = (
  document = 'sealed-1',
  revision = 3,
  actualDifficulty: GuestGame['actual_difficulty'] = 'hard',
): GuestGame => ({
  document,
  revision,
  actual_difficulty: actualDifficulty,
  snapshot: makeSnapshot(),
});

export const record = (
  game = guest(),
  localId = 'local-guest-1',
): GuestGameRecord => ({
  schema_version: 1,
  local_id: localId,
  game,
  presentation: {
    elapsed_seconds: 12,
    paused: true,
    resumed_at: 1_700_000_000_000,
  },
});

export const signedInAccount: Account = {
  email: 'player@example.test',
  display_name: 'Puzzle Player',
  csrf_token: 'csrf-proof',
};

export const accountGame = (
  id = 'account-game-1',
  revision = 2,
): AccountGame => ({
  id,
  revision,
  actual_difficulty: 'medium',
  elapsed_seconds: 12,
  snapshot: makeSnapshot(),
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  api.health.mockResolvedValue(true);
  api.getCurrentAccount.mockRejectedValue(
    new SudokuApiError('sign in required', 401, 'unauthenticated'),
  );
  api.listAccountGames.mockResolvedValue({ games: [] });
  storage.get.mockResolvedValue(undefined);
  storage.replace.mockResolvedValue(undefined);
  storage.clear.mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

export const readyHook = async () => {
  const hook = renderHook(() => useSessionLifecycle());
  await waitFor(() => expect(hook.result.current.initializing).toBe(false));
  return hook;
};

export { api, storage };
