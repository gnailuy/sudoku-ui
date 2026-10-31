import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SudokuApiClient, SudokuApiError } from '../api/client';
import type {
  Account,
  AccountGame,
  AccountGameSummary,
  Difficulty,
  GameAction,
  GuestGame,
  HintPreview,
  GameState,
} from '../api/types';
import {
  DIFFICULTY_PREFERENCE_KEY,
  actionableError,
  readActiveGame,
  readDifficultyPreference,
  type AccountOperation,
  type ActiveGameRecord,
} from '../presentation';
import { difficultyMessageIds } from '../i18n/localization';
import {
  message as catalogMessage,
  type DisplayMessage,
  type MessageReference,
} from '../i18n/messages';
import {
  GuestGameRepository,
  type GuestGameRecord,
  type GuestPresentationState,
} from '../storage/guestGameRepository';
import type {
  ActiveGameTransaction,
  HintPreparation,
  PendingAction,
  QueuedAction,
} from './sessionLifecycleTransactions';
import {
  activeGameFromAccount,
  activeGameFromGuest,
  clearActiveAccountGame,
  createLocalId,
  isSignedOut,
  saveActiveAccountGame,
  sessionFromAccountGame,
  sessionFromGuest,
  type GameMode,
} from './sessionLifecycleRecords';

export type {
  ActiveGameTransaction,
  HintPreparation,
  PendingAction,
} from './sessionLifecycleTransactions';

export const useSessionLifecycle = () => {
  const client = useMemo(() => new SudokuApiClient(), []);
  const repository = useMemo(() => new GuestGameRepository(), []);
  const [initializing, setInitializing] = useState(true);
  const [connection, setConnection] = useState<
    'checking' | 'online' | 'offline'
  >('checking');
  const [difficulty, setDifficulty] = useState<Difficulty>(
    readDifficultyPreference,
  );
  const [session, setSession] = useState<GameState>();
  const activeDifficulty = session?.actual_difficulty ?? difficulty;
  const [account, setAccount] = useState<Account>();
  const [accountGames, setAccountGames] = useState<AccountGameSummary[]>([]);
  const [accountOperation, setAccountOperation] = useState<AccountOperation>();
  const [claimingGuest, setClaimingGuest] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('guest');
  const guestRef = useRef<GuestGameRecord | undefined>(undefined);
  const accountRef = useRef<Account | undefined>(undefined);
  const accountGameRef = useRef<AccountGame | undefined>(undefined);
  const lastSyncedAccountElapsed = useRef(0);
  const presentationRef = useRef<GuestPresentationState>({
    elapsed_seconds: 0,
    paused: false,
  });
  const storageQueue = useRef<Promise<void>>(Promise.resolve());
  const leavingGameRef = useRef(false);
  const [preparingDifficulty, setPreparingDifficulty] = useState<Difficulty>();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [hintPreparation, setHintPreparation] = useState<HintPreparation>();
  const [activeTransaction, setActiveTransaction] =
    useState<ActiveGameTransaction>();
  const activeTransactionRef = useRef<ActiveGameTransaction | undefined>(
    undefined,
  );
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [historyTransition, setHistoryTransition] = useState<'undo' | 'redo'>();
  const historyTransitionRef = useRef<'undo' | 'redo' | undefined>(undefined);
  const actionQueue = useRef<QueuedAction[]>([]);
  const processingActions = useRef(false);
  const nextSequence = useRef(1);
  const processActionQueueRef = useRef<() => Promise<void>>(
    async () => undefined,
  );
  const enqueueActionRef = useRef<(action: GameAction) => Promise<boolean>>(
    async () => false,
  );
  const previewHintRef = useRef<() => Promise<HintPreview | undefined>>(
    async () => undefined,
  );
  const [retryLabel, setRetryLabel] = useState<DisplayMessage>();
  const retryAction = useRef<() => void>(() => undefined);
  const lastActionErrorCode = useRef<string | undefined>(undefined);
  const [message, setMessage] = useState<DisplayMessage>();
  const [restoredGame, setRestoredGame] = useState<ActiveGameRecord>();

  const setBusyState = useCallback((nextBusy: boolean) => {
    busyRef.current = nextBusy;
    setBusy(nextBusy);
  }, []);

  const setCurrentAccount = useCallback((next?: Account) => {
    accountRef.current = next;
    setAccount(next);
  }, []);

  const showRetry = useCallback(
    (
      label: MessageReference,
      action: () => void,
      nextMessage: DisplayMessage,
    ) => {
      retryAction.current = action;
      setRetryLabel(label);
      setMessage(nextMessage);
    },
    [],
  );

  const consumeActionErrorCode = useCallback(() => {
    const code = lastActionErrorCode.current;
    lastActionErrorCode.current = undefined;
    return code;
  }, []);

  const persistRecord = useCallback(
    async (record: GuestGameRecord) => {
      const next = storageQueue.current
        .catch(() => undefined)
        .then(() => repository.replace(record));
      storageQueue.current = next;
      await next;
    },
    [repository],
  );

  const setCurrentGuest = useCallback((record?: GuestGameRecord) => {
    guestRef.current = record;
    accountGameRef.current = undefined;
    setGameMode('guest');
    if (record) presentationRef.current = record.presentation;
    setSession(record ? sessionFromGuest(record) : undefined);
  }, []);

  const setCurrentAccountGame = useCallback((game?: AccountGame) => {
    accountGameRef.current = game;
    lastSyncedAccountElapsed.current = game?.elapsed_seconds ?? 0;
    setGameMode('account');
    setSession(game ? sessionFromAccountGame(game) : undefined);
  }, []);

  const refreshAccountGames = useCallback(async () => {
    if (!accountRef.current) {
      setAccountGames([]);
      return;
    }
    const result = await client.listAccountGames();
    setAccountGames(result.games);
    return result.games;
  }, [client]);

  const claimGuest = useCallback(
    async (record: GuestGameRecord, currentAccount: Account) => {
      setClaimingGuest(true);
      setMessage(catalogMessage('status.savingAccount'));
      try {
        const claimed = await client.claimGuestGame(
          record.game.document,
          currentAccount.csrf_token,
        );
        await storageQueue.current.catch(() => undefined);
        await repository.clear();
        guestRef.current = undefined;
        setCurrentAccountGame(claimed);
        setRestoredGame(activeGameFromAccount(claimed));
        await refreshAccountGames();
        setRetryLabel(undefined);
        setMessage(catalogMessage('status.accountSaved'));
        return true;
      } catch (error) {
        setCurrentGuest(record);
        setRestoredGame(activeGameFromGuest(record));
        showRetry(
          catalogMessage('retry.saving'),
          () => void claimGuest(record, currentAccount),
          actionableError(error, catalogMessage('error.accountSave')),
        );
        return false;
      } finally {
        setClaimingGuest(false);
      }
    },
    [
      client,
      refreshAccountGames,
      repository,
      setCurrentAccountGame,
      setCurrentGuest,
      showRetry,
    ],
  );

  const restoreApplication = useCallback(async () => {
    setBusyState(true);
    setMessage(catalogMessage('status.restoring'));
    try {
      const restored = await repository.get();
      const activeGame = readActiveGame();
      let currentAccount: Account | undefined;
      try {
        currentAccount = await client.getCurrentAccount();
      } catch (error) {
        if (!isSignedOut(error)) throw error;
      }
      setCurrentAccount(currentAccount);
      if (currentAccount) {
        const games = await refreshAccountGames();
        if (restored) {
          await claimGuest(restored, currentAccount);
          return;
        }
        const activeSummary = activeGame
          ? games?.find((game) => game.id === activeGame.sessionId)
          : undefined;
        if (activeSummary && activeGame) {
          const game = await client.getAccountGame(activeGame.sessionId);
          setCurrentAccountGame(game);
          setDifficulty(game.actual_difficulty);
          setRestoredGame({
            ...activeGameFromAccount(game),
            paused: activeGame.paused,
          });
          setRetryLabel(undefined);
          setMessage(
            catalogMessage('status.puzzleRestored', {
              difficulty: catalogMessage(
                difficultyMessageIds[game.actual_difficulty],
              ),
            }),
          );
          return;
        }
        if (activeGame) clearActiveAccountGame();
        setCurrentAccountGame(undefined);
        setMessage(undefined);
        return;
      }
      if (!restored) {
        setMessage(undefined);
        return;
      }
      setCurrentGuest(restored);
      setDifficulty(restored.game.actual_difficulty);
      setRestoredGame(activeGameFromGuest(restored));
      setRetryLabel(undefined);
      setMessage(catalogMessage('status.restored'));
    } catch (error) {
      showRetry(
        catalogMessage('retry.restoring'),
        () => void restoreApplication(),
        actionableError(error, catalogMessage('error.restoring')),
      );
    } finally {
      setBusyState(false);
    }
  }, [
    claimGuest,
    client,
    refreshAccountGames,
    repository,
    setBusyState,
    setCurrentAccount,
    setCurrentAccountGame,
    setCurrentGuest,
    showRetry,
  ]);

  useEffect(() => {
    let active = true;
    void client
      .health()
      .then(async (healthy) => {
        if (!active) return;
        setConnection(healthy ? 'online' : 'offline');
        if (healthy) await restoreApplication();
      })
      .catch(() => {
        if (!active) return;
        setConnection('offline');
        showRetry(
          catalogMessage('retry.connection'),
          () => window.location.reload(),
          catalogMessage('error.connection'),
        );
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [client, restoreApplication, showRetry]);

  useEffect(() => {
    try {
      localStorage.setItem(DIFFICULTY_PREFERENCE_KEY, difficulty);
    } catch {
      // The app still works when browser storage is unavailable.
    }
  }, [difficulty]);

  const startGame = useCallback(
    async (requestedDifficulty: Difficulty = difficulty) => {
      leavingGameRef.current = false;
      if (busyRef.current || activeTransactionRef.current) return undefined;
      if (actionQueue.current.length > 0) {
        setMessage(catalogMessage('status.waitBeforeStarting'));
        return undefined;
      }
      setPreparingDifficulty(requestedDifficulty);
      setBusyState(true);
      setMessage(
        catalogMessage('welcome.starting', {
          difficulty: catalogMessage(difficultyMessageIds[requestedDifficulty]),
        }),
      );
      try {
        const currentAccount = accountRef.current;
        if (currentAccount) {
          const nextGame = await client.createAccountGame(
            requestedDifficulty,
            currentAccount.csrf_token,
          );
          setCurrentAccountGame(nextGame);
          await refreshAccountGames();
          setDifficulty(requestedDifficulty);
          setRestoredGame(undefined);
          setRetryLabel(undefined);
          setMessage(
            catalogMessage('status.puzzleReady', {
              difficulty: catalogMessage(
                difficultyMessageIds[nextGame.actual_difficulty],
              ),
            }),
          );
          return sessionFromAccountGame(nextGame);
        }
        const game = await client.createGuestGame(requestedDifficulty);
        const nextRecord: GuestGameRecord = {
          schema_version: 1,
          local_id: createLocalId(),
          game,
          presentation: { elapsed_seconds: 0, paused: false },
        };
        await persistRecord(nextRecord);
        setCurrentGuest(nextRecord);
        setDifficulty(requestedDifficulty);
        setRestoredGame(undefined);
        setRetryLabel(undefined);
        setMessage(
          catalogMessage('status.puzzleReady', {
            difficulty: catalogMessage(
              difficultyMessageIds[game.actual_difficulty],
            ),
          }),
        );
        return sessionFromGuest(nextRecord);
      } catch (error) {
        showRetry(
          catalogMessage('retry.starting'),
          () => void startGame(requestedDifficulty),
          actionableError(error, catalogMessage('error.starting')),
        );
        return undefined;
      } finally {
        setPreparingDifficulty(undefined);
        setBusyState(false);
      }
    },
    [
      client,
      difficulty,
      persistRecord,
      refreshAccountGames,
      setBusyState,
      setCurrentAccountGame,
      setCurrentGuest,
      showRetry,
    ],
  );

  const currentGameKey = useCallback(() => {
    if (gameMode === 'account') return accountGameRef.current?.id;
    return guestRef.current?.local_id;
  }, [gameMode]);

  const syncPendingActions = useCallback(() => {
    setPendingActions(
      actionQueue.current.map(({ sequence, action }) => ({ sequence, action })),
    );
  }, []);

  const discardQueuedActions = useCallback(() => {
    const discarded = actionQueue.current.splice(0);
    for (const queued of discarded) queued.resolve(false);
    syncPendingActions();
  }, [syncPendingActions]);

  const processActionQueue = useCallback(async () => {
    if (processingActions.current) return;
    processingActions.current = true;
    try {
      while (actionQueue.current.length > 0) {
        const queued = actionQueue.current[0]!;
        if (currentGameKey() !== queued.gameKey) {
          actionQueue.current.shift();
          queued.resolve(false);
          syncPendingActions();
          continue;
        }
        try {
          if (accountGameRef.current) {
            const currentAccount = accountRef.current;
            if (!currentAccount) throw catalogMessage('error.signInAgain');
            const response = await client.applyAccountGameAction(
              accountGameRef.current,
              queued.action,
              currentAccount.csrf_token,
            );
            if (currentGameKey() !== queued.gameKey) {
              actionQueue.current.shift();
              queued.resolve(false);
              syncPendingActions();
              continue;
            }
            setCurrentAccountGame(response.game);
            setAccountGames((games) =>
              games.map((summary) => {
                if (summary.id !== response.game.id) return summary;
                return {
                  ...summary,
                  revision: response.game.revision,
                  status: response.game.snapshot.status,
                  elapsed_seconds: response.game.elapsed_seconds,
                };
              }),
            );
          } else {
            const currentRecord = guestRef.current;
            if (!currentRecord) throw catalogMessage('error.localUnavailable');
            const response = await client.applyGuestAction(
              currentRecord.game,
              queued.action,
            );
            if (currentGameKey() !== queued.gameKey) {
              actionQueue.current.shift();
              queued.resolve(false);
              syncPendingActions();
              continue;
            }
            const nextGame: GuestGame = {
              document: response.document,
              revision: response.revision,
              actual_difficulty: response.actual_difficulty,
              snapshot: response.snapshot,
            };
            const nextRecord: GuestGameRecord = {
              ...currentRecord,
              game: nextGame,
              presentation: presentationRef.current,
            };
            await persistRecord(nextRecord);
            setCurrentGuest(nextRecord);
          }
          actionQueue.current.shift();
          queued.resolve(true);
          syncPendingActions();
          lastActionErrorCode.current = undefined;
          setRetryLabel(undefined);
          const solved =
            accountGameRef.current?.snapshot.status === 'solved' ||
            guestRef.current?.game.snapshot.status === 'solved';
          setMessage(
            catalogMessage(solved ? 'status.solved' : 'status.moveSaved'),
          );
        } catch (error) {
          const failedAction = queued.action;
          lastActionErrorCode.current =
            error instanceof SudokuApiError ? error.code : undefined;
          showRetry(
            catalogMessage('retry.move'),
            () => void enqueueActionRef.current(failedAction),
            actionableError(error, catalogMessage('error.move')),
          );
          discardQueuedActions();
          break;
        }
      }
    } finally {
      processingActions.current = false;
    }
  }, [
    client,
    currentGameKey,
    discardQueuedActions,
    persistRecord,
    setCurrentAccountGame,
    setCurrentGuest,
    showRetry,
    syncPendingActions,
  ]);

  useEffect(() => {
    processActionQueueRef.current = processActionQueue;
  }, [processActionQueue]);

  const enqueueAction = useCallback(
    (action: GameAction): Promise<boolean> => {
      const gameKey = currentGameKey();
      if (!gameKey || busyRef.current || activeTransactionRef.current)
        return Promise.resolve(false);
      const transaction: ActiveGameTransaction | undefined =
        action.kind === 'apply-hint'
          ? 'applying-hint'
          : action.kind === 'restart'
            ? 'restarting-puzzle'
            : undefined;
      const historyAction =
        action.kind === 'undo' || action.kind === 'redo'
          ? action.kind
          : undefined;
      if (historyAction && historyTransitionRef.current)
        return Promise.resolve(false);
      if (transaction) {
        activeTransactionRef.current = transaction;
        setActiveTransaction(transaction);
        setMessage(
          transaction === 'applying-hint'
            ? catalogMessage('hint.applying')
            : catalogMessage('loading.restart.title'),
        );
      }
      if (historyAction) {
        historyTransitionRef.current = historyAction;
        setHistoryTransition(historyAction);
        setMessage(
          catalogMessage(
            historyAction === 'undo' ? 'controls.undoing' : 'controls.redoing',
          ),
        );
      }
      const queued = new Promise<boolean>((resolve) => {
        actionQueue.current.push({
          sequence: nextSequence.current++,
          action,
          gameKey,
          resolve,
        });
        syncPendingActions();
        void processActionQueueRef.current();
      });
      if (!historyAction && !transaction) return queued;
      return queued.finally(() => {
        if (historyAction && historyTransitionRef.current === historyAction) {
          historyTransitionRef.current = undefined;
          setHistoryTransition(undefined);
        }
        if (transaction && activeTransactionRef.current === transaction) {
          activeTransactionRef.current = undefined;
          setActiveTransaction(undefined);
        }
      });
    },
    [currentGameKey, syncPendingActions],
  );

  useEffect(() => {
    enqueueActionRef.current = enqueueAction;
  }, [enqueueAction]);

  const previewHint = useCallback(
    async (
      preparation: HintPreparation = 'preparing-hint',
    ): Promise<HintPreview | undefined> => {
      if (
        actionQueue.current.length > 0 ||
        busyRef.current ||
        activeTransactionRef.current
      ) {
        setMessage(catalogMessage('status.waitBeforeHint'));
        return undefined;
      }
      setHintPreparation(preparation);
      setBusyState(true);
      setMessage(
        preparation === 'refreshing-hint'
          ? catalogMessage('hint.refreshing')
          : catalogMessage('controls.hint.preparing'),
      );
      try {
        const currentAccountGame = accountGameRef.current;
        const currentGuest = guestRef.current;
        const preview = currentAccountGame
          ? await client.previewAccountGameHint(currentAccountGame)
          : currentGuest
            ? await client.previewGuestHint(currentGuest.game)
            : undefined;
        if (!preview) throw catalogMessage('error.currentUnavailable');
        const currentRevision =
          accountGameRef.current?.revision ?? guestRef.current?.game.revision;
        if (preview.revision !== currentRevision)
          throw catalogMessage('error.hintChanged');
        setRetryLabel(undefined);
        setMessage(catalogMessage('status.hintReady'));
        return preview;
      } catch (error) {
        showRetry(
          catalogMessage('retry.hint'),
          () => void previewHintRef.current(),
          actionableError(error, catalogMessage('error.hint')),
        );
        return undefined;
      } finally {
        setHintPreparation(undefined);
        setBusyState(false);
      }
    },
    [client, setBusyState, showRetry],
  );

  useEffect(() => {
    previewHintRef.current = () => previewHint();
  }, [previewHint]);

  const persistPresentation = useCallback(
    (record: ActiveGameRecord, force = false) => {
      if (gameMode === 'account') {
        saveActiveAccountGame(record);
        const currentGame = accountGameRef.current;
        const currentAccount = accountRef.current;
        if (
          !currentGame ||
          !currentAccount ||
          currentGame.id !== record.sessionId
        )
          return;
        const finalState =
          record.paused || currentGame.snapshot.status === 'solved';
        if (
          !force &&
          (record.elapsedSeconds <= lastSyncedAccountElapsed.current ||
            (!finalState &&
              record.elapsedSeconds - lastSyncedAccountElapsed.current < 5))
        )
          return;
        lastSyncedAccountElapsed.current = record.elapsedSeconds;
        void client
          .updateAccountGamePresentation(
            currentGame.id,
            record.elapsedSeconds,
            currentAccount.csrf_token,
          )
          .catch((error) => {
            showRetry(
              catalogMessage('retry.time'),
              () => persistPresentation(record, true),
              actionableError(error, catalogMessage('error.time')),
            );
          });
        return;
      }
      if (leavingGameRef.current) return;
      const presentation: GuestPresentationState = {
        elapsed_seconds: record.elapsedSeconds,
        paused: record.paused,
        resumed_at: record.resumedAt,
      };
      presentationRef.current = presentation;
      const currentRecord = guestRef.current;
      if (!currentRecord || currentRecord.local_id !== record.sessionId) return;
      void persistRecord({ ...currentRecord, presentation }).catch((error) => {
        showRetry(
          catalogMessage('retry.progress'),
          () => persistPresentation(record),
          actionableError(error, catalogMessage('error.timer')),
        );
      });
    },
    [client, gameMode, persistRecord, showRetry],
  );

  const leaveGame = useCallback(async () => {
    if (actionQueue.current.length > 0) {
      setMessage(catalogMessage('status.waitBeforeLeaving'));
      return false;
    }
    leavingGameRef.current = true;
    setBusyState(true);
    try {
      if (accountGameRef.current) {
        clearActiveAccountGame();
        setCurrentAccountGame(undefined);
      } else {
        const currentGuest = guestRef.current;
        await storageQueue.current.catch(() => undefined);
        setCurrentGuest(undefined);
        try {
          await repository.clear();
        } catch (error) {
          setCurrentGuest(currentGuest);
          throw error;
        }
      }
      setRetryLabel(undefined);
      setRestoredGame(undefined);
      setMessage(undefined);
      return true;
    } catch (error) {
      leavingGameRef.current = false;
      showRetry(
        catalogMessage('retry.leaving'),
        () => void leaveGame(),
        actionableError(error, catalogMessage('error.leaving')),
      );
      return false;
    } finally {
      setBusyState(false);
    }
  }, [
    repository,
    setBusyState,
    setCurrentAccountGame,
    setCurrentGuest,
    showRetry,
  ]);

  const resumeAccountGame = useCallback(
    async (gameId: string) => {
      setAccountOperation({ kind: 'opening-game', gameId });
      setBusyState(true);
      setMessage(catalogMessage('status.openingSaved'));
      try {
        const game = await client.getAccountGame(gameId);
        setCurrentAccountGame(game);
        setDifficulty(game.actual_difficulty);
        setRestoredGame(activeGameFromAccount(game));
        setRetryLabel(undefined);
        setMessage(
          catalogMessage('status.puzzleRestored', {
            difficulty: catalogMessage(
              difficultyMessageIds[game.actual_difficulty],
            ),
          }),
        );
        return true;
      } catch (error) {
        showRetry(
          catalogMessage('retry.opening'),
          () => void resumeAccountGame(gameId),
          actionableError(error, catalogMessage('error.opening')),
        );
        return false;
      } finally {
        setAccountOperation(undefined);
        setBusyState(false);
      }
    },
    [client, setBusyState, setCurrentAccountGame, showRetry],
  );

  const deleteAccountGame = useCallback(
    async (gameId: string) => {
      const currentAccount = accountRef.current;
      if (!currentAccount) return false;
      setAccountOperation({ kind: 'deleting-game', gameId });
      setBusyState(true);
      setMessage(catalogMessage('account.confirm.deleteGame.pending'));
      try {
        await client.deleteAccountGame(gameId, currentAccount.csrf_token);
        if (accountGameRef.current?.id === gameId) {
          clearActiveAccountGame();
          setCurrentAccountGame(undefined);
        }
        await refreshAccountGames();
        setRetryLabel(undefined);
        setMessage(catalogMessage('status.savedDeleted'));
        return true;
      } catch (error) {
        showRetry(
          catalogMessage('retry.deleting'),
          () => void deleteAccountGame(gameId),
          actionableError(error, catalogMessage('error.deleteGame')),
        );
        return false;
      } finally {
        setAccountOperation(undefined);
        setBusyState(false);
      }
    },
    [
      client,
      refreshAccountGames,
      setBusyState,
      setCurrentAccountGame,
      showRetry,
    ],
  );

  const deleteAllAccountGames = useCallback(async () => {
    const currentAccount = accountRef.current;
    if (!currentAccount) return false;
    setAccountOperation({ kind: 'deleting-all-games' });
    setBusyState(true);
    setMessage(catalogMessage('account.confirm.deleteAll.pending'));
    try {
      await client.deleteAllAccountGames(currentAccount.csrf_token);
      setAccountGames([]);
      clearActiveAccountGame();
      setCurrentAccountGame(undefined);
      setRestoredGame(undefined);
      setRetryLabel(undefined);
      setMessage(catalogMessage('status.allDeleted'));
      return true;
    } catch (error) {
      showRetry(
        catalogMessage('retry.deleting'),
        () => void deleteAllAccountGames(),
        actionableError(error, catalogMessage('error.deleteAll')),
      );
      return false;
    } finally {
      setAccountOperation(undefined);
      setBusyState(false);
    }
  }, [client, setBusyState, setCurrentAccountGame, showRetry]);

  const logout = useCallback(async () => {
    const currentAccount = accountRef.current;
    if (!currentAccount) return false;
    setAccountOperation({ kind: 'signing-out' });
    setBusyState(true);
    setMessage(catalogMessage('account.signingOut'));
    try {
      await client.logout(currentAccount.csrf_token);
      setCurrentAccount(undefined);
      setAccountGames([]);
      clearActiveAccountGame();
      setCurrentAccountGame(undefined);
      setRetryLabel(undefined);
      setMessage(catalogMessage('status.signedOut'));
      return true;
    } catch (error) {
      showRetry(
        catalogMessage('retry.signOut'),
        () => void logout(),
        actionableError(error, catalogMessage('error.signOut')),
      );
      return false;
    } finally {
      setAccountOperation(undefined);
      setBusyState(false);
    }
  }, [
    client,
    setBusyState,
    setCurrentAccount,
    setCurrentAccountGame,
    showRetry,
  ]);

  const revokeAccountSessions = useCallback(async () => {
    const currentAccount = accountRef.current;
    if (!currentAccount) return false;
    setAccountOperation({ kind: 'revoking-sessions' });
    setBusyState(true);
    setMessage(catalogMessage('account.confirm.revoke.pending'));
    try {
      await client.revokeAccountSessions(currentAccount.csrf_token);
      setCurrentAccount(undefined);
      setAccountGames([]);
      clearActiveAccountGame();
      setCurrentAccountGame(undefined);
      setRetryLabel(undefined);
      setMessage(catalogMessage('status.revoked'));
      return true;
    } catch (error) {
      showRetry(
        catalogMessage('retry.revoke'),
        () => void revokeAccountSessions(),
        actionableError(error, catalogMessage('error.revoke')),
      );
      return false;
    } finally {
      setAccountOperation(undefined);
      setBusyState(false);
    }
  }, [
    client,
    setBusyState,
    setCurrentAccount,
    setCurrentAccountGame,
    showRetry,
  ]);

  const deleteAccount = useCallback(async () => {
    const currentAccount = accountRef.current;
    if (!currentAccount) return false;
    setAccountOperation({ kind: 'deleting-account' });
    setBusyState(true);
    setMessage(catalogMessage('account.confirm.deleteAccount.pending'));
    try {
      await client.deleteCurrentAccount(currentAccount.csrf_token);
      setCurrentAccount(undefined);
      setAccountGames([]);
      clearActiveAccountGame();
      setCurrentAccountGame(undefined);
      setRetryLabel(undefined);
      setMessage(catalogMessage('status.accountDeleted'));
      return true;
    } catch (error) {
      showRetry(
        catalogMessage('retry.deleteAccount'),
        () => void deleteAccount(),
        actionableError(error, catalogMessage('error.deleteAccount')),
      );
      return false;
    } finally {
      setAccountOperation(undefined);
      setBusyState(false);
    }
  }, [
    client,
    setBusyState,
    setCurrentAccount,
    setCurrentAccountGame,
    showRetry,
  ]);

  const signInUrl = client.googleLoginUrl(
    typeof window === 'undefined'
      ? '/'
      : `${window.location.pathname}${window.location.search}`,
  );

  return {
    initializing,
    connection,
    difficulty,
    activeDifficulty,
    setDifficulty,
    session,
    preparingDifficulty,
    busy: busy || activeTransaction !== undefined,
    hintPreparation,
    activeTransaction,
    pendingActions,
    hasPendingActions: pendingActions.length > 0,
    historyTransition,
    retryLabel,
    retryAction,
    message,
    setMessage,
    restoredGame,
    persistPresentation,
    startGame,
    applyAction: enqueueAction,
    consumeActionErrorCode,
    previewHint,
    leaveGame,
    account,
    accountGames,
    accountOperation,
    claimingGuest,
    isAccountGame:
      gameMode === 'account' && accountGameRef.current !== undefined,
    signInUrl,
    resumeAccountGame,
    deleteAccountGame,
    deleteAllAccountGames,
    logout,
    revokeAccountSessions,
    deleteAccount,
  };
};
