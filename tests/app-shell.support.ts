import { expect, test, type Page } from '@playwright/test';

export { expect, test };
import type { MessageArgument } from '../src/api/types';

export const puzzle =
  '.56.4.7...1.5....6.......19...9.....3.58..2...4...6...1.....93....4....22.3.1....';
export const nakedPairPuzzle =
  '4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......';
export const nakedPairValues =
  '4.....8.5.3..........7......2.....6.....8.4...4..1.......6.3.7.5.32.1...1.4......';

export const messageDescriptor = (
  id: string,
  text: string,
  args: MessageArgument[] = [],
) => ({
  id,
  arguments: args,
  text,
});
export const strategySummary = (
  strategy: string,
  steps: number,
  text: string,
) => ({
  id: 'hint.strategy.summary',
  arguments: [
    { name: 'steps', kind: 'count', count: steps },
    { name: 'strategy', kind: 'strategy', strategy },
  ],
  text,
});
export const hintStrategy = (id: string, name: string, grade: string) => ({
  id,
  name: messageDescriptor(`strategy.${id}.name`, name),
  grade: grade.toLowerCase(),
  grade_name: messageDescriptor(
    `difficulty.${grade.toLowerCase()}.name`,
    grade,
  ),
});

export const gridFromPuzzle = (source = puzzle) =>
  Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, column) => {
      const value = source[row * 9 + column];
      return value === '.' ? 0 : Number(value);
    }),
  );

export const emptyBooleanGrid = () =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false));
export const emptyDigitSetGrid = () =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [] as number[]),
  );
export const legalCandidates = (values: number[][]) =>
  values.map((rowValues, row) =>
    rowValues.map((value, column) => {
      if (value !== 0) return [];
      const boxRow = Math.floor(row / 3) * 3;
      const boxColumn = Math.floor(column / 3) * 3;
      return Array.from({ length: 9 }, (_, index) => index + 1).filter(
        (candidate) =>
          !rowValues.includes(candidate) &&
          values.every((candidateRow) => candidateRow[column] !== candidate) &&
          values
            .slice(boxRow, boxRow + 3)
            .every((candidateRow) =>
              candidateRow
                .slice(boxColumn, boxColumn + 3)
                .every((cell) => cell !== candidate),
            ),
      );
    }),
  );

export const replaceGrid = <T>(target: T[][], source: T[][]) => {
  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      target[row]![column] = source[row]![column]!;
    }
  }
};

export const mockGameApi = async (
  page: Page,
  initialNotes?: { row: number; column: number; values: number[] },
) => {
  const givens = gridFromPuzzle();
  const values = gridFromPuzzle();
  const invalid = emptyBooleanGrid();
  const candidates = emptyDigitSetGrid();
  candidates[0][0] = [1, 3, 8];
  candidates[0][5] = [6];
  candidates[0][3] = [2, 5, 9];
  if (initialNotes) {
    candidates[initialNotes.row - 1][initialNotes.column - 1] =
      initialNotes.values;
  }
  let revision = 0;
  let canUndo = false;
  let canRedo = false;
  let actionRequests = 0;
  let completedActions = 0;
  const actions: Array<{
    kind: string;
    value?: number;
    values?: number[];
    plan_id?: string;
  }> = [];
  const actionTargets: Array<{ row?: number; column?: number }> = [];
  const expectedRevisions: number[] = [];
  let adoptionPreviousNotes: number[][][] | undefined;
  let adoptionNotes: number[][][] | undefined;
  let sessionRequests = 0;
  let nextValueIsInvalid = true;
  let mistakes = 0;
  let failNextAction = false;
  let staleNextHintAction = false;
  let useNakedPairHint = false;
  let useCandidateCorrectionHint = false;
  let nextStatus: 'in-progress' | 'solved' = 'in-progress';
  let actionDelayMs = 0;
  let hintDelayMs = 0;
  let sessionDelayMs = 0;
  const requestedDifficulties: string[] = [];
  let requestedDifficulty = 'easy';

  await page.route('**/healthz', (route) =>
    route.fulfill({ json: { status: 'healthy' } }),
  );
  await page.route('**/api/v1/account', (route) =>
    route.fulfill({
      status: 401,
      json: {
        error: {
          code: 'unauthenticated',
          message: messageDescriptor(
            'error.account-unauthorized',
            'Sign in required.',
          ),
        },
      },
    }),
  );
  await page.route('**/api/v1/guest/games', async (route) => {
    if (route.request().method() === 'POST') {
      sessionRequests += 1;
      revision = 0;
      mistakes = 0;
      requestedDifficulty = (
        route.request().postDataJSON() as {
          source: { difficulty: string };
        }
      ).source.difficulty;
      requestedDifficulties.push(requestedDifficulty);
      if (sessionDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, sessionDelayMs));
      }
      await route.fulfill({
        status: 201,
        json: {
          document: `sealed-${sessionRequests}-${revision}`,
          revision,
          actual_difficulty: requestedDifficulty,
          snapshot: {
            givens,
            values,
            invalid,
            candidates,
            mistakes,
            status: 'in-progress',
            can_undo: canUndo,
            can_redo: canRedo,
          },
        },
      });
    }
  });
  await page.route('**/api/v1/guest/games/hint', async (route) => {
    const request = route.request().postDataJSON() as { document: string };
    expect(request.document).toBe(`sealed-${sessionRequests}-${revision}`);
    if (hintDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, hintDelayMs));
    }
    let hint: object;
    if (useCandidateCorrectionHint) {
      hint = {
        plan_id: 'c'.repeat(64),
        kind: 'candidate-correction',
        title: messageDescriptor(
          'hint.candidate-correction.title',
          'Fix this candidate cell',
        ),
        summary: {
          id: 'hint.candidate-correction.summary',
          arguments: [
            { name: 'cell', kind: 'cell', cell: { row: 1, column: 1 } },
          ],
          text: 'Correct the candidates at row 1, column 1.',
        },
        steps: [
          {
            id: 'find-candidate-problem',
            kind: 'observe',
            message: {
              id: 'hint.candidate-correction.observe',
              arguments: [
                {
                  name: 'cell',
                  kind: 'cell',
                  cell: { row: 1, column: 1 },
                },
              ],
              text: 'Candidate 3 is impossible at row 1, column 1.',
            },
            marks: [
              {
                target: { kind: 'cell', row: 1, column: 1 },
                role: 'problem',
              },
              {
                target: { kind: 'candidate', row: 1, column: 1, value: 3 },
                role: 'extra',
              },
            ],
          },
          {
            id: 'compare-candidate-cell',
            kind: 'explain',
            message: messageDescriptor(
              'hint.candidate-correction.compare',
              'Discard this cell’s deductions and rebuild them from row, column, and box values.',
            ),
            marks: [
              {
                target: { kind: 'candidate', row: 1, column: 1, value: 3 },
                role: 'extra',
              },
            ],
          },
          {
            id: 'set-candidate-cell',
            kind: 'apply',
            message: {
              id: 'hint.candidate-correction.conclude',
              arguments: [
                {
                  name: 'cell',
                  kind: 'cell',
                  cell: { row: 1, column: 1 },
                },
              ],
              text: 'Reset candidates to every locally allowed digit: 1 and 8.',
            },
            marks: [
              {
                target: { kind: 'candidate', row: 1, column: 1, value: 1 },
                role: 'conclusion',
              },
              {
                target: { kind: 'candidate', row: 1, column: 1, value: 8 },
                role: 'conclusion',
              },
            ],
            effect: {
              kind: 'set-candidates',
              set_candidates: { row: 1, column: 1, values: [1, 8] },
            },
          },
        ],
        conclusion: {
          kind: 'set-candidates',
          set_candidates: { row: 1, column: 1, values: [1, 8] },
        },
      };
    } else if (useNakedPairHint) {
      const eliminations = [1, 2, 3].flatMap((row) =>
        [2, 6].map((value) => ({ row, column: 6, value })),
      );
      hint = {
        plan_id: 'b'.repeat(64),
        kind: 'strategy',
        title: messageDescriptor('strategy.naked-pair.name', 'Naked pair'),
        strategy: hintStrategy('naked-pair', 'Naked pair', 'Medium'),
        summary: strategySummary(
          'naked-pair',
          3,
          'Naked pair 2, 6 in column 6 eliminates candidates from the other cells.',
        ),
        steps: [
          {
            id: 'observe-pair',
            kind: 'observe',
            message: messageDescriptor(
              'hint.subset-reservation.observe',
              'R5C6 and R6C6 contain only 2 and 6.',
              [
                {
                  name: 'unit',
                  kind: 'units',
                  units: [{ kind: 'column', index: 6 }],
                },
                {
                  name: 'cells',
                  kind: 'cells',
                  cells: [
                    { row: 5, column: 6 },
                    { row: 6, column: 6 },
                  ],
                },
                { name: 'digits', kind: 'digits', digits: [2, 6] },
              ],
            ),
            marks: [
              ...[5, 6].flatMap((row) =>
                [2, 6].map((value) => ({
                  target: { kind: 'candidate', row, column: 6, value },
                  role: 'premise',
                })),
              ),
            ],
          },
          {
            id: 'reserve-pair',
            kind: 'explain',
            message: messageDescriptor(
              'hint.subset-reservation.explain',
              'Those digits must occupy the pair cells, so they cannot appear elsewhere in column 6.',
              [
                {
                  name: 'unit',
                  kind: 'units',
                  units: [{ kind: 'column', index: 6 }],
                },
                {
                  name: 'cells',
                  kind: 'cells',
                  cells: [
                    { row: 5, column: 6 },
                    { row: 6, column: 6 },
                  ],
                },
                { name: 'digits', kind: 'digits', digits: [2, 6] },
              ],
            ),
            marks: [],
          },
          {
            id: 'eliminate-peers',
            kind: 'apply',
            message: messageDescriptor(
              'hint.subset-reservation.apply',
              'Remove 2 and 6 from rows 1, 2, and 3 in column 6.',
              [
                {
                  name: 'candidates',
                  kind: 'candidates',
                  candidates: eliminations.map(({ row, column, value }) => ({
                    cell: { row, column },
                    digit: value,
                  })),
                },
                { name: 'strategy', kind: 'strategy', strategy: 'naked-pair' },
              ],
            ),
            marks: eliminations.map(({ row, column, value }) => ({
              target: { kind: 'candidate', row, column, value },
              role: 'conclusion',
            })),
            effect: { kind: 'eliminate-candidates', eliminations },
          },
        ],
        conclusion: { kind: 'eliminate-candidates', eliminations },
      };
    } else {
      hint = {
        plan_id: 'a'.repeat(64),
        kind: 'strategy',
        title: messageDescriptor(
          'strategy.hidden-single.name',
          'Hidden single',
        ),
        strategy: hintStrategy('hidden-single', 'Hidden single', 'Easy'),
        summary: strategySummary(
          'hidden-single',
          2,
          'Only one value can fit in the highlighted row.',
        ),
        steps: [
          {
            id: 'observe-row',
            kind: 'observe',
            message: messageDescriptor(
              'hint.hidden-single.inspect',
              'Scan row 1 and compare the remaining candidates.',
              [
                {
                  name: 'unit',
                  kind: 'units',
                  units: [{ kind: 'row', index: 1 }],
                },
                { name: 'digit', kind: 'digit', digit: 1 },
              ],
            ),
            marks: [
              { target: { kind: 'row', index: 1 }, role: 'premise' },
              {
                target: { kind: 'candidate', row: 1, column: 1, value: 3 },
                role: 'eliminated',
              },
            ],
          },
          {
            id: 'conclude-cell',
            kind: 'apply',
            message: messageDescriptor(
              'hint.hidden-single.apply',
              'Cell R1C1 must be 1.',
              [
                { name: 'digit', kind: 'digit', digit: 1 },
                { name: 'cell', kind: 'cell', cell: { row: 1, column: 1 } },
                {
                  name: 'strategy',
                  kind: 'strategy',
                  strategy: 'hidden-single',
                },
              ],
            ),
            marks: [
              {
                target: { kind: 'cell', row: 1, column: 1 },
                role: 'conclusion',
              },
            ],
            effect: {
              kind: 'place-value',
              placement: { row: 1, column: 1, value: 1 },
            },
          },
        ],
        conclusion: {
          kind: 'place-value',
          placement: { row: 1, column: 1, value: 1 },
        },
      };
    }

    const completeHint = hint as { steps: Array<Record<string, unknown>> };
    await route.fulfill({
      json: {
        revision,
        hint: {
          ...completeHint,
          steps: completeHint.steps.map((step) => ({
            ...step,
            nodes: [],
            links: [],
          })),
        },
      },
    });
  });
  await page.route('**/api/v1/guest/games/actions', async (route) => {
    actionRequests += 1;
    if (actionDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, actionDelayMs));
    }
    if (failNextAction) {
      failNextAction = false;
      await route.fulfill({
        status: 503,
        json: {
          error: {
            code: 'unavailable',
            message: messageDescriptor('error.internal-error', 'try later'),
          },
        },
      });
      return;
    }
    if (staleNextHintAction) {
      staleNextHintAction = false;
      await route.fulfill({
        status: 409,
        json: {
          error: {
            code: 'stale-hint',
            message: messageDescriptor(
              'error.stale-hint',
              'hint conclusion is already consumed',
            ),
          },
        },
      });
      return;
    }
    const request = route.request().postDataJSON() as {
      document: string;
      action: {
        kind: string;
        expected_revision: number;
        row?: number;
        column?: number;
        value?: number;
        values?: number[];
        plan_id?: string;
      };
    };
    const action = request.action;
    expectedRevisions.push(action.expected_revision);
    actions.push({
      kind: action.kind,
      ...(action.value === undefined ? {} : { value: action.value }),
      ...(action.values === undefined ? {} : { values: action.values }),
      ...(action.plan_id === undefined ? {} : { plan_id: action.plan_id }),
    });
    actionTargets.push({ row: action.row, column: action.column });
    if (action.kind === 'set-value' && action.row && action.column) {
      values[action.row - 1][action.column - 1] = action.value ?? 0;
      invalid[action.row - 1][action.column - 1] = nextValueIsInvalid;
      if (nextValueIsInvalid) mistakes += 1;
      canUndo = true;
      canRedo = false;
    }
    if (action.kind === 'set-candidates' && action.row && action.column) {
      adoptionPreviousNotes = candidates.map((row) =>
        row.map((cell) => [...cell]),
      );
      candidates[action.row - 1][action.column - 1] = [
        ...(action.values ?? []),
      ];
      adoptionNotes = candidates.map((row) => row.map((cell) => [...cell]));
      canUndo = true;
      canRedo = false;
    }
    if (action.kind === 'apply-hint') {
      if (useCandidateCorrectionHint) {
        candidates[0]![0] = [1, 8];
      } else if (useNakedPairHint) {
        adoptionPreviousNotes = candidates.map((row) =>
          row.map((cell) => [...cell]),
        );
        for (const row of [0, 1, 2]) {
          candidates[row]![5] = candidates[row]![5]!.filter(
            (value) => value !== 2 && value !== 6,
          );
        }
        adoptionNotes = candidates.map((row) => row.map((cell) => [...cell]));
      } else {
        values[0]![0] = 1;
        invalid[0]![0] = false;
      }
      canUndo = true;
      canRedo = false;
    }
    if (action.kind === 'clear-value' && action.row && action.column) {
      values[action.row - 1][action.column - 1] = 0;
      invalid[action.row - 1][action.column - 1] = false;
      canUndo = true;
      canRedo = false;
    }
    if (action.kind === 'restart') {
      replaceGrid(
        values,
        givens.map((row) => [...row]),
      );
      replaceGrid(invalid, emptyBooleanGrid());
      replaceGrid(candidates, legalCandidates(values));
      mistakes = 0;
      canUndo = false;
      canRedo = false;
      nextStatus = 'in-progress';
    }
    if (action.kind === 'undo') {
      if (adoptionPreviousNotes) {
        for (let row = 0; row < 9; row += 1)
          for (let column = 0; column < 9; column += 1)
            candidates[row]![column] = [
              ...adoptionPreviousNotes[row]![column]!,
            ];
      }
      canUndo = false;
      canRedo = true;
    }
    if (action.kind === 'redo') {
      if (adoptionNotes) {
        for (let row = 0; row < 9; row += 1)
          for (let column = 0; column < 9; column += 1)
            candidates[row]![column] = [...adoptionNotes[row]![column]!];
      }
      canUndo = true;
      canRedo = false;
    }
    revision += 1;
    await route.fulfill({
      json: {
        document: `sealed-${sessionRequests}-${revision}`,
        revision,
        actual_difficulty: requestedDifficulty,
        snapshot: {
          givens,
          values,
          invalid,
          candidates,
          mistakes,
          status: nextStatus,
          can_undo: canUndo,
          can_redo: canRedo,
        },
        result: {
          action: action.kind,
          changes: [],
          status: nextStatus,
          can_undo: canUndo,
          can_redo: canRedo,
        },
      },
    });
    completedActions += 1;
  });

  return {
    actionRequests: () => actionRequests,
    completedActions: () => completedActions,
    actions: () => actions,
    actionTargets: () => actionTargets,
    expectedRevisions: () => expectedRevisions,
    sessionRequests: () => sessionRequests,
    requestedDifficulties: () => requestedDifficulties,
    setNextValueIsInvalid: (value: boolean) => {
      nextValueIsInvalid = value;
    },
    failNextAction: () => {
      failNextAction = true;
    },
    staleNextHintAction: () => {
      staleNextHintAction = true;
    },
    useCandidateCorrectionHint: () => {
      useCandidateCorrectionHint = true;
    },
    useNakedPairHint: () => {
      useNakedPairHint = true;
      replaceGrid(givens, gridFromPuzzle(nakedPairPuzzle));
      replaceGrid(values, gridFromPuzzle(nakedPairValues));
      const pairCandidates = legalCandidates(values);
      pairCandidates[4]![5] = [2, 6];
      pairCandidates[5]![5] = [2, 6];
      replaceGrid(candidates, pairCandidates);
    },
    setNextStatus: (value: 'in-progress' | 'solved') => {
      nextStatus = value;
    },
    setActionDelay: (milliseconds: number) => {
      actionDelayMs = milliseconds;
    },
    setHintDelay: (milliseconds: number) => {
      hintDelayMs = milliseconds;
    },
    setSessionDelay: (milliseconds: number) => {
      sessionDelayMs = milliseconds;
    },
  };
};

export const storedGuestState = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ keys: IDBValidKey[]; record: unknown }>(
        (resolve, reject) => {
          const open = indexedDB.open('sudoku-ui', 1);
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const database = open.result;
            const transaction = database.transaction('guest-game', 'readonly');
            const store = transaction.objectStore('guest-game');
            const keys = store.getAllKeys();
            const record = store.get('current');
            transaction.oncomplete = () => {
              database.close();
              resolve({ keys: keys.result, record: record.result });
            };
            transaction.onerror = () => reject(transaction.error);
          };
        },
      ),
  );

export const boardGeometry = (page: Page) =>
  page.locator('.game-board').evaluate((board) => {
    const rectangle = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return [x, y, width, height].map((value) => Number(value.toFixed(3)));
    };
    return {
      board: rectangle(board),
      cells: Array.from(board.children, rectangle),
    };
  });

export type GameplayInputMethod = 'keyboard' | 'mouse' | 'touchscreen';

export const activateWith = async (
  page: Page,
  method: GameplayInputMethod,
  locator: ReturnType<Page['getByRole']>,
  key?: string,
) => {
  if (method === 'keyboard') {
    if (!key) throw new Error('Keyboard activation requires a key');
    await page.keyboard.press(key);
    return;
  }
  if (method === 'mouse') {
    await locator.click();
    return;
  }
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
};

export const burstHistoryActivation = async (
  page: Page,
  method: GameplayInputMethod,
  action: 'undo' | 'redo',
) => {
  const label = action === 'undo' ? 'Undo' : 'Redo';
  const shortcut = action === 'undo' ? 'z' : 'Z';
  const button = page.getByRole('button', { name: label });
  if (method === 'keyboard') {
    await page.evaluate(
      ({ key, shiftKey }) => {
        for (let index = 0; index < 3; index += 1) {
          window.dispatchEvent(
            new KeyboardEvent('keydown', {
              key,
              ctrlKey: true,
              shiftKey,
              bubbles: true,
            }),
          );
        }
      },
      { key: shortcut, shiftKey: action === 'redo' },
    );
    return;
  }
  if (method === 'mouse') {
    await button.evaluate((element) => {
      for (let index = 0; index < 3; index += 1)
        (element as HTMLButtonElement).click();
    });
    return;
  }
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await Promise.all([
    page.touchscreen.tap(x, y),
    page.touchscreen.tap(x, y),
    page.touchscreen.tap(x, y),
  ]);
};
