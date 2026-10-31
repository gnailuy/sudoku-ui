// @vitest-environment jsdom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACTIVE_GAME_KEY } from '../presentation';
import {
  accountGame,
  api,
  readyHook,
  record,
  signedInAccount,
  storage,
} from './useSessionLifecycle.testSupport';

describe('useSessionLifecycle account', () => {
  it('keeps a healthy signed-in welcome free of idle status copy', async () => {
    api.getCurrentAccount.mockResolvedValue(signedInAccount);
    api.listAccountGames.mockResolvedValue({ games: [] });

    const { result } = await readyHook();

    expect(result.current.account).toEqual(signedInAccount);
    expect(result.current.session).toBeUndefined();
    expect(result.current.message).toBeUndefined();
  });

  it('automatically claims the one local game after sign-in and only then clears it', async () => {
    const saved = record();
    storage.get.mockResolvedValue(saved);
    api.getCurrentAccount.mockResolvedValue(signedInAccount);
    api.claimGuestGame.mockResolvedValue(accountGame());
    api.listAccountGames.mockResolvedValue({
      games: [
        {
          id: 'account-game-1',
          revision: 2,
          actual_difficulty: 'medium',
          status: 'in-progress',
          elapsed_seconds: 12,
          updated_at: '2026-10-05T00:00:00Z',
        },
      ],
    });

    const { result } = await readyHook();

    expect(api.claimGuestGame).toHaveBeenCalledWith(
      saved.game.document,
      'csrf-proof',
    );
    expect(storage.clear).toHaveBeenCalledOnce();
    expect(result.current.account).toEqual(signedInAccount);
    expect(result.current.session?.id).toBe('account-game-1');
    expect(result.current.message).toEqual({ id: 'status.accountSaved' });
    expect(result.current.accountGames).toHaveLength(1);

    act(() =>
      result.current.persistPresentation({
        sessionId: 'account-game-1',
        difficulty: 'medium',
        elapsedSeconds: 0,
        paused: false,
      }),
    );
    expect(api.updateAccountGamePresentation).not.toHaveBeenCalled();
  });

  it('retains a local game and offers an idempotent claim retry when claim fails', async () => {
    const saved = record();
    storage.get.mockResolvedValue(saved);
    api.getCurrentAccount.mockResolvedValue(signedInAccount);
    api.claimGuestGame.mockRejectedValueOnce(new Error('claim interrupted'));

    const { result } = await readyHook();

    expect(storage.clear).not.toHaveBeenCalled();
    expect(result.current.session?.id).toBe(saved.local_id);
    expect(result.current.retryLabel).toEqual({ id: 'retry.saving' });

    api.claimGuestGame.mockResolvedValueOnce(accountGame());
    await act(async () => void (await result.current.retryAction.current()));
    expect(storage.clear).toHaveBeenCalledOnce();
    expect(result.current.session?.id).toBe('account-game-1');
  });

  it('reopens the active browser account game from its authoritative route', async () => {
    api.getCurrentAccount.mockResolvedValue(signedInAccount);
    api.listAccountGames.mockResolvedValue({
      games: [
        {
          id: 'saved-game',
          revision: 4,
          actual_difficulty: 'medium',
          status: 'in-progress',
          elapsed_seconds: 12,
          updated_at: '2026-10-09T17:00:00Z',
        },
      ],
    });
    api.getAccountGame.mockResolvedValue(accountGame('saved-game', 4));
    localStorage.setItem(
      ACTIVE_GAME_KEY,
      JSON.stringify({
        sessionId: 'saved-game',
        difficulty: 'medium',
        elapsedSeconds: 12,
        paused: true,
      }),
    );

    const { result } = await readyHook();

    expect(api.getAccountGame).toHaveBeenCalledWith('saved-game');
    expect(result.current.session?.id).toBe('saved-game');
    expect(result.current.restoredGame).toEqual({
      sessionId: 'saved-game',
      difficulty: 'medium',
      elapsedSeconds: 12,
      paused: true,
    });
    expect(result.current.message).toEqual({
      id: 'status.puzzleRestored',
      values: { difficulty: { id: 'common.difficulty.medium' } },
    });
  });

  it('previews an authenticated game through its owner-scoped route', async () => {
    api.getCurrentAccount.mockResolvedValue(signedInAccount);
    api.createAccountGame.mockResolvedValue(accountGame('created-game', 0));
    const preview = {
      revision: 0,
      hint: {
        plan_id: 'b'.repeat(64),
        strategy: {
          id: 'naked-single',
          name: {
            id: 'strategy.naked-single.name',
            arguments: [],
            text: 'Single',
          },
          grade: 'easy',
          grade_name: {
            id: 'difficulty.easy.name',
            arguments: [],
            text: 'Easy',
          },
        },
        summary: 'One candidate remains.',
        steps: [
          {
            id: 'one',
            kind: 'observe' as const,
            message: 'Look.',
            marks: [],
            nodes: [],
            links: [],
          },
        ],
        conclusion: { eliminations: [] },
      },
    };
    api.previewAccountGameHint.mockResolvedValue(preview);

    const { result } = await readyHook();
    await act(async () => void (await result.current.startGame('medium')));
    await expect(result.current.previewHint()).resolves.toEqual(preview);
    expect(api.previewAccountGameHint).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'created-game', revision: 0 }),
    );
    expect(api.previewGuestHint).not.toHaveBeenCalled();
  });

  it('creates, resumes, mutates, deletes, and signs out of account games', async () => {
    api.getCurrentAccount.mockResolvedValue(signedInAccount);
    const created = accountGame('created-game', 0);
    const resumed = accountGame('saved-game', 4);
    api.createAccountGame.mockResolvedValue(created);
    api.getAccountGame.mockResolvedValue(resumed);
    api.applyAccountGameAction.mockResolvedValue({
      game: accountGame('saved-game', 5),
      result: {},
    });
    api.updateAccountGamePresentation.mockResolvedValue(
      accountGame('saved-game', 5),
    );
    api.deleteAccountGame.mockResolvedValue(undefined);
    api.deleteAllAccountGames.mockResolvedValue(undefined);
    api.logout.mockResolvedValue(undefined);

    const { result } = await readyHook();
    await act(async () => void (await result.current.startGame('medium')));
    expect(api.createAccountGame).toHaveBeenCalledWith('medium', 'csrf-proof');

    await act(
      async () => void (await result.current.resumeAccountGame('saved-game')),
    );
    await act(
      async () => void (await result.current.applyAction({ kind: 'undo' })),
    );
    expect(api.applyAccountGameAction).toHaveBeenCalledWith(
      resumed,
      { kind: 'undo' },
      'csrf-proof',
    );
    expect(result.current.session?.revision).toBe(5);

    act(() =>
      result.current.persistPresentation({
        sessionId: 'saved-game',
        difficulty: 'medium',
        elapsedSeconds: 17,
        paused: false,
      }),
    );
    await waitFor(() =>
      expect(api.updateAccountGamePresentation).toHaveBeenCalledWith(
        'saved-game',
        17,
        'csrf-proof',
      ),
    );

    await act(
      async () => void (await result.current.deleteAccountGame('saved-game')),
    );
    expect(api.deleteAccountGame).toHaveBeenCalledWith(
      'saved-game',
      'csrf-proof',
    );

    await act(async () => void (await result.current.deleteAllAccountGames()));
    expect(api.deleteAllAccountGames).toHaveBeenCalledWith('csrf-proof');
    expect(result.current.accountGames).toEqual([]);

    await act(async () => void (await result.current.logout()));
    expect(api.logout).toHaveBeenCalledWith('csrf-proof');
    expect(result.current.account).toBeUndefined();
  });

  it('offers retries when account time or bulk deletion cannot be saved', async () => {
    api.getCurrentAccount.mockResolvedValue(signedInAccount);
    api.getAccountGame.mockResolvedValue(accountGame('saved-game', 4));
    api.updateAccountGamePresentation.mockRejectedValueOnce(
      new Error('time unavailable'),
    );
    api.deleteAllAccountGames.mockRejectedValueOnce(
      new Error('delete unavailable'),
    );

    const { result } = await readyHook();
    await act(
      async () => void (await result.current.resumeAccountGame('saved-game')),
    );
    act(() =>
      result.current.persistPresentation({
        sessionId: 'saved-game',
        difficulty: 'medium',
        elapsedSeconds: 17,
        paused: false,
      }),
    );
    await waitFor(() =>
      expect(result.current.retryLabel).toEqual({ id: 'retry.time' }),
    );
    api.updateAccountGamePresentation.mockResolvedValue(
      accountGame('saved-game', 4),
    );
    act(() => result.current.retryAction.current());
    await waitFor(() =>
      expect(api.updateAccountGamePresentation).toHaveBeenCalledTimes(2),
    );

    await act(async () => void (await result.current.deleteAllAccountGames()));
    expect(result.current.retryLabel).toEqual({ id: 'retry.deleting' });
    api.deleteAllAccountGames.mockResolvedValue(undefined);
    act(() => result.current.retryAction.current());
    await waitFor(() =>
      expect(api.deleteAllAccountGames).toHaveBeenCalledTimes(2),
    );
  });

  it('revokes all sessions and deletes the current account through confirmed controls', async () => {
    api.getCurrentAccount.mockResolvedValue(signedInAccount);
    api.revokeAccountSessions.mockResolvedValue(undefined);
    api.deleteCurrentAccount.mockResolvedValue(undefined);

    const revokeHook = await readyHook();
    act(() =>
      revokeHook.result.current.persistPresentation({
        sessionId: 'account-game',
        difficulty: 'easy',
        elapsedSeconds: 10,
        paused: false,
      }),
    );
    await act(
      async () =>
        void (await revokeHook.result.current.revokeAccountSessions()),
    );
    expect(api.revokeAccountSessions).toHaveBeenCalledWith('csrf-proof');
    expect(revokeHook.result.current.account).toBeUndefined();
    revokeHook.unmount();

    const deleteHook = await readyHook();
    await act(
      async () => void (await deleteHook.result.current.deleteAccount()),
    );
    expect(api.deleteCurrentAccount).toHaveBeenCalledWith('csrf-proof');
    expect(deleteHook.result.current.message).toEqual({
      id: 'status.accountDeleted',
    });
  });
});
