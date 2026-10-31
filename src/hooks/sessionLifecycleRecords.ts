import { SudokuApiError } from '../api/client';
import type { AccountGame, GameState } from '../api/types';
import { ACTIVE_GAME_KEY, type ActiveGameRecord } from '../presentation';
import type { GuestGameRecord } from '../storage/guestGameRepository';

export type GameMode = 'guest' | 'account';

export const sessionFromGuest = (record: GuestGameRecord): GameState => ({
  id: record.local_id,
  revision: record.game.revision,
  actual_difficulty: record.game.actual_difficulty,
  snapshot: record.game.snapshot,
});

export const sessionFromAccountGame = (game: AccountGame): GameState => ({
  id: game.id,
  revision: game.revision,
  actual_difficulty: game.actual_difficulty,
  snapshot: game.snapshot,
});

export const activeGameFromGuest = (
  record: GuestGameRecord,
): ActiveGameRecord => ({
  sessionId: record.local_id,
  difficulty: record.game.actual_difficulty,
  elapsedSeconds: record.presentation.elapsed_seconds,
  paused: record.presentation.paused,
  resumedAt: record.presentation.resumed_at,
});

export const activeGameFromAccount = (game: AccountGame): ActiveGameRecord => ({
  sessionId: game.id,
  difficulty: game.actual_difficulty,
  elapsedSeconds: game.elapsed_seconds,
  paused: false,
});

export const createLocalId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const isSignedOut = (error: unknown) =>
  error instanceof SudokuApiError &&
  (error.status === 401 || error.status === 403);

export const saveActiveAccountGame = (record: ActiveGameRecord) => {
  try {
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(record));
  } catch {
    // Account recovery remains available from My games when storage is unavailable.
  }
};

export const clearActiveAccountGame = () => {
  try {
    localStorage.removeItem(ACTIVE_GAME_KEY);
  } catch {
    // Storage restrictions must not block account actions.
  }
};
