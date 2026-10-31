// @vitest-environment jsdom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SudokuApiError } from '../api/client';
import type { GuestGame } from '../api/types';
import { DIFFICULTY_PREFERENCE_KEY } from '../presentation';
import { makeSnapshot } from '../test/fixtures';
import {
  api,
  guest,
  readyHook,
  record,
  storage,
} from './useSessionLifecycle.testSupport';

describe('useSessionLifecycle guest and transactions', () => {
  it('checks health, persists difficulty, starts a guest game, applies an action, and leaves', async () => {
    const initial = guest();
    api.createGuestGame.mockResolvedValue(initial);
    api.applyGuestAction.mockResolvedValue({
      ...guest('sealed-2', 4),
      snapshot: makeSnapshot({ can_undo: true }),
      result: {},
    });
    const { result } = await readyHook();
    expect(result.current.connection).toBe('online');
    act(() => result.current.setDifficulty('expert'));
    expect(localStorage.getItem(DIFFICULTY_PREFERENCE_KEY)).toBe('expert');

    await act(async () => void (await result.current.startGame()));
    expect(api.createGuestGame).toHaveBeenCalledWith('expert');
    expect(result.current.session?.id).toEqual(expect.any(String));
    expect(result.current.message).toEqual({
      id: 'status.puzzleReady',
      values: { difficulty: { id: 'common.difficulty.hard' } },
    });
    expect(result.current.activeDifficulty).toBe('hard');
    expect(storage.replace).toHaveBeenCalledWith(
      expect.objectContaining({ game: initial, schema_version: 1 }),
    );

    await act(
      async () => void (await result.current.applyAction({ kind: 'undo' })),
    );
    expect(api.applyGuestAction).toHaveBeenCalledWith(initial, {
      kind: 'undo',
    });
    expect(result.current.session?.revision).toBe(4);
    expect(result.current.message).toEqual({ id: 'status.moveSaved' });

    await act(async () => void (await result.current.leaveGame()));
    expect(storage.clear).toHaveBeenCalledOnce();
    expect(result.current.session).toBeUndefined();
  });

  it('previews the current guest hint and rejects a mismatched revision', async () => {
    api.createGuestGame.mockResolvedValue(guest());
    const hook = await readyHook();
    await act(async () => void (await hook.result.current.startGame('hard')));
    const preview = {
      revision: 3,
      hint: {
        plan_id: 'a'.repeat(64),
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
    api.previewGuestHint.mockResolvedValue(preview);
    await expect(hook.result.current.previewHint()).resolves.toEqual(preview);
    expect(api.previewGuestHint).toHaveBeenCalledWith(
      expect.objectContaining({ document: 'sealed-1' }),
    );

    api.previewGuestHint.mockResolvedValue({ ...preview, revision: 2 });
    await expect(hook.result.current.previewHint()).resolves.toBeUndefined();
    await waitFor(() =>
      expect(hook.result.current.retryLabel).toEqual({ id: 'retry.hint' }),
    );
    api.previewGuestHint.mockResolvedValue(preview);
    await act(
      async () => void (await hook.result.current.retryAction.current()),
    );
    expect(api.previewGuestHint).toHaveBeenCalledTimes(3);
  });

  it('restores one IndexedDB guest game and its presentation state', async () => {
    const saved = record();
    storage.get.mockResolvedValue(saved);
    const { result } = await readyHook();
    expect(result.current.session).toMatchObject({
      id: 'local-guest-1',
      revision: 3,
      actual_difficulty: 'hard',
    });
    expect(result.current.difficulty).toBe('hard');
    expect(result.current.restoredGame).toEqual({
      sessionId: 'local-guest-1',
      difficulty: 'hard',
      elapsedSeconds: 12,
      paused: true,
      resumedAt: 1_700_000_000_000,
    });
    expect(result.current.message).toEqual({ id: 'status.restored' });
  });

  it('offers retry when health, restore, creation, or storage fails', async () => {
    api.health.mockRejectedValue(new Error('offline'));
    const offline = await readyHook();
    expect(offline.result.current.connection).toBe('offline');
    expect(offline.result.current.retryLabel).toEqual({
      id: 'retry.connection',
    });
    offline.unmount();

    api.health.mockResolvedValue(true);
    storage.get.mockRejectedValueOnce(new Error('restore failed'));
    const restoring = await readyHook();
    expect(restoring.result.current.retryLabel).toEqual({
      id: 'retry.restoring',
    });
    storage.get.mockResolvedValueOnce(record());
    await act(
      async () => void (await restoring.result.current.retryAction.current()),
    );
    expect(restoring.result.current.session?.id).toBe('local-guest-1');
    restoring.unmount();

    storage.get.mockResolvedValue(undefined);
    api.createGuestGame.mockRejectedValue(
      new SudokuApiError('down', 503, 'server'),
    );
    const creating = await readyHook();
    await act(
      async () => void (await creating.result.current.startGame('evil')),
    );
    expect(creating.result.current.retryLabel).toEqual({
      id: 'retry.starting',
    });
    expect(creating.result.current.message).toEqual({
      id: 'error.unavailable',
    });

    api.createGuestGame.mockResolvedValue(guest());
    storage.replace.mockRejectedValueOnce(new Error('storage unavailable'));
    await act(
      async () => void (await creating.result.current.retryAction.current()),
    );
    expect(creating.result.current.session).toBeUndefined();
    expect(creating.result.current.message).toEqual({ id: 'error.starting' });
  });

  it('persists timer presentation with the latest sealed game', async () => {
    api.createGuestGame.mockResolvedValue(guest());
    const { result } = await readyHook();
    await act(async () => void (await result.current.startGame('easy')));
    storage.replace.mockClear();

    act(() =>
      result.current.persistPresentation({
        sessionId: result.current.session!.id,
        difficulty: 'hard',
        elapsedSeconds: 19,
        paused: false,
        resumedAt: 1_800_000_000_000,
      }),
    );
    await waitFor(() => expect(storage.replace).toHaveBeenCalledOnce());
    expect(storage.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        game: expect.objectContaining({ document: 'sealed-1' }),
        presentation: {
          elapsed_seconds: 19,
          paused: false,
          resumed_at: 1_800_000_000_000,
        },
      }),
    );
  });

  it('retries failed presentation persistence and local deletion', async () => {
    api.createGuestGame.mockResolvedValue(guest());
    const { result } = await readyHook();
    await act(async () => void (await result.current.startGame('easy')));

    storage.replace.mockClear();
    storage.replace.mockRejectedValueOnce(new Error('timer storage failed'));
    act(() =>
      result.current.persistPresentation({
        sessionId: result.current.session!.id,
        difficulty: 'hard',
        elapsedSeconds: 8,
        paused: false,
      }),
    );
    await waitFor(() =>
      expect(result.current.retryLabel).toEqual({ id: 'retry.progress' }),
    );
    storage.replace.mockResolvedValue(undefined);
    act(() => result.current.retryAction.current());
    await waitFor(() => expect(storage.replace).toHaveBeenCalledTimes(2));

    storage.clear.mockRejectedValueOnce(new Error('clear failed'));
    await act(async () => void (await result.current.leaveGame()));
    expect(result.current.retryLabel).toEqual({ id: 'retry.leaving' });
    storage.clear.mockResolvedValue(undefined);
    await act(async () => void (await result.current.retryAction.current()));
    expect(storage.clear).toHaveBeenCalledTimes(2);
    expect(result.current.session).toBeUndefined();
  });

  it('covers replacement loading and solved/default action messages', async () => {
    api.createGuestGame.mockResolvedValue(guest());
    const { result } = await readyHook();
    await act(async () => void (await result.current.startGame('easy')));

    let resolveReplacement!: (game: GuestGame) => void;
    api.createGuestGame.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReplacement = resolve;
        }),
    );
    let replacement: Promise<unknown>;
    act(() => {
      replacement = result.current.startGame('hard');
    });
    expect(result.current.preparingDifficulty).toBe('hard');
    await act(async () => {
      resolveReplacement(guest('replacement', 0, 'hard'));
      await replacement!;
    });
    expect(result.current.preparingDifficulty).toBeUndefined();

    api.applyGuestAction
      .mockResolvedValueOnce({
        ...guest('solved', 1),
        snapshot: makeSnapshot({ status: 'solved' }),
        result: {},
      })
      .mockResolvedValueOnce({
        ...guest('redo', 2),
        snapshot: makeSnapshot(),
        result: {},
      });
    await act(
      async () => void (await result.current.applyAction({ kind: 'undo' })),
    );
    expect(result.current.message).toEqual({ id: 'status.solved' });
    await act(
      async () => void (await result.current.applyAction({ kind: 'redo' })),
    );
    expect(result.current.message).toEqual({ id: 'status.moveSaved' });
  });

  it('discards dependent queued actions after a failed request', async () => {
    const initial = guest();
    api.createGuestGame.mockResolvedValue(initial);
    let rejectFirst!: (error: Error) => void;
    api.applyGuestAction.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );
    const { result } = await readyHook();
    await act(async () => void (await result.current.startGame('easy')));

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.applyAction({
        kind: 'set-value',
        row: 1,
        column: 1,
        value: 1,
      });
      second = result.current.applyAction({ kind: 'undo' });
    });
    expect(result.current.pendingActions).toHaveLength(2);

    await act(async () => {
      rejectFirst(new Error('move unavailable'));
      expect(await first).toBe(false);
      expect(await second).toBe(false);
    });
    expect(result.current.consumeActionErrorCode()).toBeUndefined();
    expect(api.applyGuestAction).toHaveBeenCalledTimes(1);
    expect(result.current.pendingActions).toHaveLength(0);
    expect(result.current.retryLabel).toEqual({ id: 'retry.move' });
    expect(result.current.session?.revision).toBe(initial.revision);
  });

  it('keeps history transitions single-flight and unlocks after failure', async () => {
    const initial = {
      ...guest(),
      snapshot: makeSnapshot({ can_undo: true }),
    };
    api.createGuestGame.mockResolvedValue(initial);
    let resolveUndo!: (response: GuestGame & { result: object }) => void;
    api.applyGuestAction
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveUndo = resolve;
          }),
      )
      .mockRejectedValueOnce(new Error('history unavailable'));
    const { result } = await readyHook();
    await act(async () => void (await result.current.startGame('easy')));

    let undo!: Promise<boolean>;
    let duplicateUndo!: Promise<boolean>;
    let duplicateRedo!: Promise<boolean>;
    act(() => {
      undo = result.current.applyAction({ kind: 'undo' });
      duplicateUndo = result.current.applyAction({ kind: 'undo' });
      duplicateRedo = result.current.applyAction({ kind: 'redo' });
    });

    expect(result.current.historyTransition).toBe('undo');
    expect(result.current.message).toEqual({ id: 'controls.undoing' });
    expect(result.current.pendingActions).toHaveLength(1);
    expect(api.applyGuestAction).toHaveBeenCalledTimes(1);
    await expect(duplicateUndo).resolves.toBe(false);
    await expect(duplicateRedo).resolves.toBe(false);

    await act(async () => {
      resolveUndo({
        ...guest('sealed-after-undo', 4),
        snapshot: makeSnapshot({ can_redo: true }),
        result: {},
      });
      expect(await undo).toBe(true);
    });
    expect(result.current.historyTransition).toBeUndefined();
    expect(result.current.pendingActions).toHaveLength(0);

    await act(async () => {
      expect(await result.current.applyAction({ kind: 'redo' })).toBe(false);
    });
    expect(result.current.historyTransition).toBeUndefined();
    expect(result.current.pendingActions).toHaveLength(0);
    expect(result.current.retryLabel).toEqual({ id: 'retry.move' });
    expect(api.applyGuestAction).toHaveBeenCalledTimes(2);
  });

  it('serializes rapid guest actions against each replacement document', async () => {
    const initial = guest('sealed-3', 3);
    api.createGuestGame.mockResolvedValue(initial);
    let resolveFirst!: (response: GuestGame & { result: object }) => void;
    let resolveSecond!: (response: GuestGame & { result: object }) => void;
    api.applyGuestAction
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const { result } = await readyHook();
    await act(async () => void (await result.current.startGame('easy')));

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.applyAction({
        kind: 'set-value',
        row: 1,
        column: 1,
        value: 1,
      });
      second = result.current.applyAction({
        kind: 'set-value',
        row: 1,
        column: 4,
        value: 2,
      });
    });

    expect(result.current.pendingActions).toHaveLength(2);
    expect(api.applyGuestAction).toHaveBeenCalledTimes(1);
    expect(api.applyGuestAction).toHaveBeenNthCalledWith(1, initial, {
      kind: 'set-value',
      row: 1,
      column: 1,
      value: 1,
    });

    const firstSnapshot = makeSnapshot({ can_undo: true });
    firstSnapshot.values[0]![0] = 1;
    await act(async () => {
      resolveFirst({
        ...guest('sealed-4', 4),
        snapshot: firstSnapshot,
        result: {},
      });
      expect(await first).toBe(true);
    });
    await waitFor(() => expect(api.applyGuestAction).toHaveBeenCalledTimes(2));
    expect(api.applyGuestAction.mock.calls[1]?.[0]).toMatchObject({
      document: 'sealed-4',
      revision: 4,
    });
    expect(result.current.pendingActions).toHaveLength(1);

    const secondSnapshot = makeSnapshot({ can_undo: true });
    secondSnapshot.values[0]![0] = 1;
    secondSnapshot.values[0]![3] = 2;
    await act(async () => {
      resolveSecond({
        ...guest('sealed-5', 5),
        snapshot: secondSnapshot,
        result: {},
      });
      expect(await second).toBe(true);
    });
    expect(result.current.pendingActions).toHaveLength(0);
    expect(result.current.session?.revision).toBe(5);
  });
});
