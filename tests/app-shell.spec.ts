import { expect, test, type Page } from '@playwright/test';

const puzzle =
  '.56.4.7...1.5....6.......19...9.....3.58..2...4...6...1.....93....4....22.3.1....';
const nakedPairPuzzle =
  '4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......';
const nakedPairValues =
  '4.....8.5.3..........7......2.....6.....8.4...4..1.......6.3.7.5.32.1...1.4......';

const gridFromPuzzle = (source = puzzle) =>
  Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, column) => {
      const value = source[row * 9 + column];
      return value === '.' ? 0 : Number(value);
    }),
  );

const emptyBooleanGrid = () =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false));
const emptyDigitSetGrid = () =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [] as number[]),
  );
const legalCandidates = (values: number[][]) =>
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

const replaceGrid = <T>(target: T[][], source: T[][]) => {
  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      target[row]![column] = source[row]![column]!;
    }
  }
};

const mockGameApi = async (
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
        error: { code: 'unauthenticated', message: 'Sign in required.' },
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
    let hint: object;
    if (useCandidateCorrectionHint) {
      hint = {
        plan_id: 'c'.repeat(64),
        kind: 'candidate-correction',
        title: 'Fix this candidate cell',
        summary: 'Correct the candidates at row 1, column 1.',
        steps: [
          {
            id: 'find-candidate-problem',
            kind: 'observe',
            message: 'Candidate 3 is impossible at row 1, column 1.',
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
            kind: 'compare',
            message:
              'Discard this cell’s deductions and rebuild them from row, column, and box values.',
            marks: [
              {
                target: { kind: 'candidate', row: 1, column: 1, value: 3 },
                role: 'extra',
              },
            ],
          },
          {
            id: 'set-candidate-cell',
            kind: 'conclude',
            message:
              'Reset candidates to every locally allowed digit: 1 and 8.',
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
        title: 'Naked pair',
        strategy: {
          id: 'naked-pair',
          display_name: 'Naked pair',
          grade: 'Medium',
        },
        summary:
          'Naked pair 2, 6 in column 6 eliminates candidates from the other cells.',
        steps: [
          {
            id: 'observe-pair',
            kind: 'observe',
            message: 'R5C6 and R6C6 contain only 2 and 6.',
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
            kind: 'compare',
            message:
              'Those digits must occupy the pair cells, so they cannot appear elsewhere in column 6.',
            marks: [],
          },
          {
            id: 'eliminate-peers',
            kind: 'eliminate',
            message: 'Remove 2 and 6 from rows 1, 2, and 3 in column 6.',
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
        title: 'Hidden single',
        strategy: {
          id: 'hidden-single',
          display_name: 'Hidden single',
          grade: 'Easy',
        },
        summary: 'Only one value can fit in the highlighted row.',
        steps: [
          {
            id: 'observe-row',
            kind: 'observe',
            message: 'Scan row 1 and compare the remaining candidates.',
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
            kind: 'conclude',
            message: 'Cell R1C1 must be 1.',
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
        json: { error: { code: 'unavailable', message: 'try later' } },
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
            message: 'hint conclusion is already consumed',
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
    setSessionDelay: (milliseconds: number) => {
      sessionDelayMs = milliseconds;
    },
  };
};

const storedGuestState = (page: Page) =>
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

const boardGeometry = (page: Page) =>
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

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`supports persistent system, light, and dark themes at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ colorScheme: 'dark' });
    const api = await mockGameApi(page);
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-preference',
      'system',
    );
    const systemTheme = page.getByRole('button', { name: 'Use system theme' });
    await expect(systemTheme).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Use light theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Use light theme' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: 'Use dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(
      page.evaluate(() => localStorage.getItem('sudoku-ui.theme.v1')),
    ).resolves.toBe('dark');
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(16, 23, 21)',
    );
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-theme-welcome-${viewport.width}.png`
        : testInfo.outputPath(`theme-dark-welcome-${viewport.width}.png`),
      fullPage: true,
    });

    await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
    await expect(page.getByRole('grid')).toBeVisible();
    const firstCell = page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty',
    });
    await firstCell.click();
    await page.keyboard.press('1');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 1, 1, invalid' }),
    ).toHaveClass(/game-cell--invalid/);
    await expect(page.locator('.game-board')).toHaveCSS(
      'border-top-color',
      'rgb(205, 216, 212)',
    );

    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByRole('alertdialog')).toHaveCSS(
      'background-color',
      'rgb(24, 33, 31)',
    );
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-theme-dialog-${viewport.width}.png`
        : testInfo.outputPath(`theme-dark-dialog-${viewport.width}.png`),
      fullPage: true,
    });

    api.setSessionDelay(300);
    await page.getByRole('button', { name: 'Play a different puzzle' }).click();
    await expect(
      page.getByRole('status', { name: 'Preparing your Easy board…' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-theme-loading-${viewport.width}.png`
        : testInfo.outputPath(`theme-dark-loading-${viewport.width}.png`),
      fullPage: true,
    });
    await expect(page.getByRole('grid')).toBeVisible();

    api.setSessionDelay(0);
    api.setNextStatus('solved');
    await page
      .getByRole('gridcell', { name: 'Row 1, column 4, empty' })
      .click();
    await page.keyboard.press('2');
    await expect(page.getByText('Puzzle complete')).toBeVisible();
    await expect(page.locator('.completion-panel')).toHaveCSS(
      'background-color',
      'rgb(35, 58, 52)',
    );
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-theme-complete-${viewport.width}.png`
        : testInfo.outputPath(`theme-dark-complete-${viewport.width}.png`),
      fullPage: true,
    });
  });
}

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
  { width: 412, height: 839 },
]) {
  test(`plays a backend-backed game at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const api = await mockGameApi(page);
    await page.goto('/');
    await expect(page.locator('.connection')).toHaveCount(0);
    await expect(page.locator('.board-preview span')).toHaveCount(81);
    await expect(page.locator('.board-preview span')).toHaveText(
      Array.from(puzzle, (value) => (value === '.' ? '' : value)),
    );
    if (viewport.width <= 600) {
      await expect(page.locator('.preview-card')).toBeHidden();
    } else {
      const preview = page.locator('.preview-card');
      await expect(preview).toBeVisible();
      await expect(preview).toHaveCSS('border-top-width', '0px');
      await expect(preview).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(preview).toHaveCSS('box-shadow', 'none');
    }
    await expect(page.getByText('A real, solvable puzzle')).toHaveCount(0);
    await expect(page.getByText('81 cells · one solution')).toHaveCount(0);
    if (viewport.width > 840) {
      await expect(
        page.evaluate(
          () => document.documentElement.scrollHeight <= window.innerHeight,
        ),
      ).resolves.toBe(true);
    }
    const screenshotIndex = viewport.width > 760 ? 0 : 1;
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex}.png`
        : testInfo.outputPath(`welcome-preview-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Hard' }).click();
    await page.getByRole('button', { name: 'Start Hard puzzle' }).click();

    await expect(
      page.getByRole('heading', { name: 'Hard puzzle' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Your puzzle' }),
    ).toHaveCount(0);
    await expect(page.getByRole('gridcell')).toHaveCount(81);
    await expect(page.locator('.game-status')).toHaveCount(0);
    await expect(page.locator('.game-controls')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
    await expect(page.locator('.game-controls')).toHaveCSS(
      'border-top-width',
      '0px',
    );
    await expect(page.locator('.board-stage')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
    await expect(page.locator('.board-stage')).toHaveCSS(
      'border-top-width',
      '0px',
    );
    await expect(page.locator('.board-stage')).toHaveCSS('box-shadow', 'none');
    if (viewport.width <= 520) {
      const utilityBoxes = await Promise.all(
        [
          page.getByLabel('Elapsed time'),
          page.getByLabel(/mistakes?$/),
          page.getByRole('button', { name: 'Pause' }),
          page.getByRole('button', { name: 'Start over' }),
        ].map((item) => item.boundingBox()),
      );
      expect(utilityBoxes.every((box) => box !== null)).toBe(true);
      const utilityCenter = utilityBoxes.map((box) => box!.y + box!.height / 2);
      expect(
        Math.max(...utilityCenter) - Math.min(...utilityCenter),
      ).toBeLessThan(2);
      expect(
        (await page.locator('.board-stage').boundingBox())?.y,
      ).toBeLessThan(180);
    }
    const savedGuest = await storedGuestState(page);
    expect(savedGuest.keys).toEqual(['current']);
    expect(savedGuest.record).toMatchObject({
      key: 'current',
      schema_version: 1,
      local_id: expect.any(String),
      game: {
        document: 'sealed-1-0',
        revision: 0,
        actual_difficulty: 'hard',
      },
      presentation: { elapsed_seconds: 0, paused: false },
    });
    expect(JSON.stringify(savedGuest.record)).not.toMatch(
      /csrf_token|access_token|id_token|application_session/i,
    );
    await expect(
      page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
    ).resolves.toBe(true);
    await page.getByText('Keyboard shortcuts').click();
    await expect(page.getByText('Pause or resume')).toBeVisible();
    await expect(page.getByText('Undo', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Redo', { exact: true }).last()).toBeVisible();
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-shortcuts-${viewport.width}.png`
        : testInfo.outputPath(`keyboard-shortcuts-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByText('Keyboard shortcuts').click();
    await expect(page.getByLabel('Elapsed time')).toHaveText('0:00');
    await expect(page.getByLabel('Elapsed time')).toHaveText('0:01', {
      timeout: 2500,
    });
    const visibleTime = await page.getByLabel('Elapsed time').textContent();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(page.getByLabel('Elapsed time')).toHaveText(visibleTime ?? '');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.keyboard.press('p');
    await expect(
      page.getByText('Puzzle paused', { exact: true }),
    ).toBeVisible();
    const pausedTime = await page.getByLabel('Elapsed time').textContent();
    await page.waitForTimeout(1100);
    await expect(page.getByLabel('Elapsed time')).toHaveText(pausedTime ?? '');
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Choose your difficulty' }),
    ).toHaveCount(0);
    await expect(
      page.getByText('Puzzle paused', { exact: true }),
    ).toBeVisible();
    await expect(page.locator('.game-status')).toHaveCount(0);
    await page.keyboard.press('p');
    await expect(page.getByRole('grid')).toBeVisible();

    const initialGeometry = await boardGeometry(page);
    const firstCell = page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty',
    });
    await expect(firstCell).not.toHaveClass(/game-cell--selected/);
    await expect(page.getByRole('button', { name: 'Erase' })).toBeDisabled();
    const actionRequestsBeforeSelection = api.actionRequests();
    const availableDigit = page.getByRole('button', { name: 'Enter 1' });
    await expect(availableDigit).toBeEnabled();
    await availableDigit.click();
    await expect(
      page.getByText('Select an editable cell before entering a number.'),
    ).toBeVisible();
    await expect(firstCell).not.toHaveClass(/game-cell--selected/);
    await expect
      .poll(() => api.actionRequests())
      .toBe(actionRequestsBeforeSelection);
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex + 20}.png`
        : testInfo.outputPath('number-pad-without-selection.png'),
      fullPage: true,
    });
    await expect(page.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(
      1,
    );
    await expect(page.locator('[role="gridcell"][tabindex="-1"]')).toHaveCount(
      80,
    );
    await page.locator('#game-title').click();
    await page.keyboard.press('ArrowRight');
    await expect(firstCell).toBeFocused();
    await expect(firstCell).toHaveClass(/game-cell--selected/);
    await expect(firstCell).not.toHaveClass(/game-cell--peer/);
    await expect(firstCell).not.toHaveClass(/game-cell--matching/);
    await expect(firstCell).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('Tab');
    await expect(availableDigit).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(firstCell).toBeFocused();
    await page.locator('#game-title').click();
    await page.getByRole('button', { name: 'Start over' }).focus();
    await page.keyboard.press('Tab');
    await expect(firstCell).toBeFocused();
    await expect(firstCell).toHaveClass(/game-cell--selected/);

    const selectedRing = await firstCell.evaluate(
      (cell) => getComputedStyle(cell).boxShadow,
    );
    await page.keyboard.press('ArrowRight');
    const keyboardSelectedCell = page.getByRole('gridcell', {
      name: 'Row 1, column 2, given 5',
    });
    await expect(keyboardSelectedCell).toBeFocused();
    await expect(keyboardSelectedCell).toHaveClass(/game-cell--selected/);
    await expect(keyboardSelectedCell).toHaveCSS('outline-style', 'solid');
    await expect(keyboardSelectedCell).toHaveCSS('outline-width', '3px');
    await expect(keyboardSelectedCell).toHaveCSS(
      'outline-color',
      'rgb(31, 98, 83)',
    );
    await expect(keyboardSelectedCell).toHaveCSS('box-shadow', selectedRing);
    const actionRequestsBeforeGivenInput = api.actionRequests();
    for (const digit of Array.from({ length: 9 }, (_, index) => index + 1)) {
      await expect(
        page.getByRole('button', { name: `Enter ${digit}` }),
      ).toBeDisabled();
    }
    await expect(page.getByRole('button', { name: 'Erase' })).toBeDisabled();
    await page.keyboard.press('1');
    await expect
      .poll(() => api.actionRequests())
      .toBe(actionRequestsBeforeGivenInput);
    await expect(firstCell).not.toBeFocused();
    await expect(firstCell).not.toHaveClass(/game-cell--selected/);
    await page.keyboard.press('ArrowLeft');
    await expect(firstCell).toBeFocused();
    await expect(firstCell).toHaveClass(/game-cell--selected/);

    let enteredCell = firstCell;
    for (const digit of [1, 2, 3, 4, 5]) {
      await enteredCell.click();
      await page.keyboard.press(String(digit));
      enteredCell = page.getByRole('gridcell', {
        name: `Row 1, column 1, ${digit}, invalid`,
      });
      await expect(enteredCell).toBeVisible();
      await expect(enteredCell).toBeFocused();
      await expect(enteredCell).toHaveClass(/game-cell--invalid/);
      await expect(enteredCell).toHaveAttribute('aria-invalid', 'true');
      await expect(
        page.getByLabel(`${digit} ${digit === 1 ? 'mistake' : 'mistakes'}`),
      ).toHaveText(`Mistakes ${digit}`);
      await expect(enteredCell).toHaveCSS('outline-style', 'solid');
      await expect(
        enteredCell.locator('.cell-value').evaluate((value) => {
          const marker = getComputedStyle(value, '::after');
          return {
            content: marker.content,
            width: Number.parseFloat(marker.width),
            height: Number.parseFloat(marker.height),
            decoration: getComputedStyle(value).textDecorationLine,
          };
        }),
      ).resolves.toMatchObject({
        content: '""',
        width: expect.any(Number),
        height: expect.any(Number),
        decoration: 'none',
      });
      await expect(
        enteredCell.locator('.cell-value').evaluate((value) => {
          const marker = getComputedStyle(value, '::after');
          return (
            Number.parseFloat(marker.width) >= 11 &&
            Number.parseFloat(marker.height) >= 2 &&
            Number.parseFloat(marker.bottom) > 0
          );
        }),
      ).resolves.toBe(true);
    }
    const requestsAfterValueEntry = api.actionRequests();
    await page.keyboard.press('5');
    await expect.poll(() => api.actionRequests()).toBe(requestsAfterValueEntry);
    await expect(enteredCell).toBeFocused();

    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex + 2}.png`
        : testInfo.outputPath(`invalid-value-${viewport.width}.png`),
      fullPage: true,
    });
    await expect(boardGeometry(page)).resolves.toEqual(initialGeometry);
    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
    const requestsBeforeHistoryShortcuts = api.actionRequests();
    await page.keyboard.press('Control+z');
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsBeforeHistoryShortcuts + 1);
    expect(api.actions().at(-1)).toEqual({ kind: 'undo' });
    await expect(page.getByRole('button', { name: 'Redo' })).toBeEnabled();
    await page.keyboard.press('Control+Shift+z');
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsBeforeHistoryShortcuts + 2);
    expect(api.actions().at(-1)).toEqual({ kind: 'redo' });
    await expect(page.getByLabel('5 mistakes')).toHaveText('Mistakes 5');
    await page.reload();
    await expect(page.getByLabel('5 mistakes')).toHaveText('Mistakes 5');

    const secondOpenCell = page.getByRole('gridcell', {
      name: 'Row 1, column 4, empty',
    });
    await secondOpenCell.click();
    await expect(secondOpenCell).toHaveClass(/game-cell--selected/);
    await page.getByRole('button', { name: 'Notes off' }).click();
    const notesPad = page.getByLabel('Number pad, notes mode');
    await expect(notesPad).toHaveClass(/number-pad--notes/);
    const noteFive = page.getByRole('button', {
      name: 'Add or remove note 5',
    });
    await expect(noteFive).toHaveCSS('color', 'rgb(102, 113, 119)');
    const requestsBeforeRapidNotes = api.actionRequests();
    await notesPad.locator('button').evaluateAll((buttons) => {
      for (const digit of ['1', '4', '7']) {
        buttons.find((button) => button.textContent === digit)?.click();
      }
    });
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, candidates 1, 4, 7',
      }),
    ).toContainText('147');
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsBeforeRapidNotes + 1);
    expect(api.actions().at(-1)).toEqual({
      kind: 'set-candidates',
      values: [1, 4, 7],
    });
    await expect(
      page.getByRole('button', { name: 'Notes on' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(boardGeometry(page)).resolves.toEqual(initialGeometry);
    await expect(page.getByRole('button', { name: 'Erase' })).toBeEnabled();
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex + 24}.png`
        : testInfo.outputPath(`notes-mode-${viewport.width}.png`),
      fullPage: true,
    });

    await enteredCell.click();
    const actionRequestsBeforeBlockedNote = api.actionRequests();
    await expect(page.getByRole('button', { name: 'Erase' })).toBeDisabled();
    for (const digit of Array.from({ length: 9 }, (_, index) => index + 1)) {
      await expect(
        page.getByRole('button', { name: `Add or remove note ${digit}` }),
      ).toBeDisabled();
    }
    await page.keyboard.press('6');
    await expect
      .poll(() => api.actionRequests())
      .toBe(actionRequestsBeforeBlockedNote);
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex + 26}.png`
        : testInfo.outputPath(`disabled-note-input-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Notes on' }).click();
    await page.getByRole('button', { name: 'Erase' }).click();
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }),
    ).toBeVisible();
    await expect(boardGeometry(page)).resolves.toEqual(initialGeometry);
    await page.getByRole('button', { name: 'Notes off' }).click();

    const givenFour = page.getByRole('gridcell', {
      name: 'Row 1, column 5, given 4',
    });
    await givenFour.click();
    await expect(givenFour).toHaveClass(/game-cell--selected/);
    await expect(givenFour).not.toHaveClass(/game-cell--peer/);
    await expect(givenFour).not.toHaveClass(/game-cell--matching/);
    const matchingCell = page.locator('.game-cell--matching').first();
    await expect(matchingCell).toBeVisible();
    await expect(matchingCell).not.toHaveClass(/game-cell--selected/);
    await expect(
      matchingCell
        .locator('.cell-value')
        .evaluate(
          (value) => getComputedStyle(value, '::before').backgroundColor,
        ),
    ).resolves.toBe('rgb(200, 224, 214)');
    const matchingNote = secondOpenCell.locator('.cell-note--matching');
    await expect(matchingNote).toHaveText('4');
    await expect(matchingNote).toHaveCSS(
      'background-color',
      'rgb(200, 224, 214)',
    );
    await page.keyboard.press('ArrowLeft');
    await expect(secondOpenCell.locator('.cell-note--matching')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(givenFour).toBeFocused();
    await expect(secondOpenCell.locator('.cell-note--matching')).toHaveText(
      '4',
    );
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex + 8}.png`
        : testInfo.outputPath(`matching-note-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Notes on' }).click();

    const editableCells = page.locator('.game-cell:not(.game-cell--given)');
    for (let index = 0; index < 8; index += 1) {
      const requestsBeforeEntry = api.actionRequests();
      await editableCells.nth(index).click();
      await page.keyboard.press('7');
      await expect
        .poll(() => api.actionRequests())
        .toBe(requestsBeforeEntry + 1);
    }
    await expect(page.getByRole('button', { name: 'Enter 7' })).toBeEnabled();
    const requestsAfterInvalidDigits = api.actionRequests();
    await editableCells.nth(8).click();
    await page.getByRole('button', { name: 'Enter 7' }).click();
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsAfterInvalidDigits + 1);

    api.setNextValueIsInvalid(false);
    for (let index = 9; index < 17; index += 1) {
      const requestsBeforeEntry = api.actionRequests();
      await editableCells.nth(index).click();
      await page.keyboard.press('7');
      await expect
        .poll(() => api.actionRequests())
        .toBe(requestsBeforeEntry + 1);
    }
    await expect(page.getByRole('button', { name: 'Enter 7' })).toBeDisabled();
    const requestsAfterCompletedDigit = api.actionRequests();
    await page.keyboard.press('7');
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsAfterCompletedDigit);
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex + 4}.png`
        : testInfo.outputPath(`completed-digit-${viewport.width}.png`),
      fullPage: true,
    });

    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  });
}

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
]) {
  test(`keeps one candidate set with cell-level visibility at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const api = await mockGameApi(page, { row: 1, column: 4, values: [2, 6] });
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Easy puzzle' }).click();

    const inputModes = page.getByRole('group', { name: 'Input modes' });
    const puzzleActions = page.getByRole('group', { name: 'Puzzle actions' });
    await expect(inputModes.getByRole('button')).toHaveCount(2);
    await expect(puzzleActions.getByRole('button')).toHaveCount(4);
    await expect(
      page.getByRole('button', { name: 'Candidates off' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }),
    ).toBeVisible();
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 4, empty' }),
    ).toBeVisible();
    await page
      .getByRole('gridcell', { name: 'Row 1, column 3, given 6' })
      .click();
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-hidden-candidate-matches-${viewport.width}.png`
        : testInfo.outputPath(`hidden-candidate-matches-${viewport.width}.png`),
      fullPage: true,
    });
    await expect(page.locator('.cell-note--matching')).toHaveCount(0);

    await page
      .getByRole('gridcell', { name: 'Row 1, column 4, empty' })
      .click();
    await page.getByRole('button', { name: 'Notes off' }).click();
    const requestsBeforeNotes = api.actionRequests();
    await page.getByRole('button', { name: 'Add or remove note 5' }).click();
    await expect.poll(() => api.actionRequests()).toBe(requestsBeforeNotes + 1);
    expect(api.actions().at(-1)).toEqual({
      kind: 'set-candidates',
      values: [5],
    });
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, candidates 5',
      }),
    ).toContainText('5');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Candidates off' }).click();
    await expect(
      page.getByRole('button', { name: 'Candidates on' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 1, empty, candidates 1, 3, 8',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, candidates 5',
      }),
    ).toBeVisible();
    expect(api.actionRequests()).toBe(requestsBeforeNotes + 1);

    await page.getByRole('button', { name: 'Candidates on' }).click();
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 4, empty' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Notes on' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Candidates off' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 4, empty' }),
    ).toBeVisible();
    await expect(page.locator('.tool-grid .tool-icon')).toHaveCount(6);
  });
}

test('preserves note input entered while an earlier save is in flight', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page, { row: 1, column: 1, values: [] });
  api.setActionDelay(500);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }).click();
  await page.getByRole('button', { name: 'Notes off' }).click();

  await page.keyboard.press('1');
  await page.keyboard.press('2');
  await page.keyboard.press('3');
  await expect.poll(() => api.actionRequests()).toBe(1);
  await page.keyboard.press('4');
  await expect(
    page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty, candidates 1, 2, 3, 4',
    }),
  ).toContainText('1234');

  await expect.poll(() => api.actionRequests()).toBe(2);
  await expect
    .poll(() => api.actions().at(-1))
    .toEqual({
      kind: 'set-candidates',
      values: [1, 2, 3, 4],
    });
  await expect(
    page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty, candidates 1, 2, 3, 4',
    }),
  ).toContainText('1234');
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-30.png`
      : testInfo.outputPath('in-flight-note-entry.png'),
    fullPage: true,
  });
});

type GameplayInputMethod = 'keyboard' | 'mouse' | 'touchscreen';

const activateWith = async (
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

const burstHistoryActivation = async (
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

for (const method of ['keyboard', 'mouse', 'touchscreen'] as const) {
  test(`keeps delayed history transitions single-flight with ${method}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:4173',
      hasTouch: method === 'touchscreen',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const api = await mockGameApi(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
    await page
      .getByRole('gridcell', { name: 'Row 1, column 1, empty' })
      .click();
    await page.getByRole('button', { name: 'Enter 1' }).click();
    await expect.poll(() => api.completedActions()).toBe(1);
    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

    api.setActionDelay(2_000);
    await burstHistoryActivation(page, method, 'undo');
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/history-single-flight-${method}-pending.png`
        : testInfo.outputPath(`history-single-flight-${method}-pending.png`),
      fullPage: true,
    });
    await expect(page.locator('.game-status')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Undoing…' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Redo' })).toBeDisabled();
    await expect.poll(() => api.completedActions()).toBe(2);
    expect(api.actionRequests()).toBe(2);
    expect(api.actions().at(-1)).toEqual({ kind: 'undo' });
    await expect(page.getByRole('button', { name: 'Redo' })).toBeEnabled();

    await burstHistoryActivation(page, method, 'redo');
    await expect(page.locator('.game-status')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Redoing…' })).toBeDisabled();
    await expect.poll(() => api.completedActions()).toBe(3);
    expect(api.actionRequests()).toBe(3);
    expect(api.actions().slice(-2)).toEqual([
      { kind: 'undo' },
      { kind: 'redo' },
    ]);
    expect(api.expectedRevisions()).toEqual([0, 1, 2]);

    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/history-single-flight-${method}.png`
        : testInfo.outputPath(`history-single-flight-${method}.png`),
      fullPage: true,
    });
    await context.close();
  });
}

for (const method of ['keyboard', 'mouse', 'touchscreen'] as const) {
  test(`preserves immediate 1, 2, 3 candidate edits with ${method}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:4173',
      hasTouch: method === 'touchscreen',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const api = await mockGameApi(page);
    api.setActionDelay(500);
    await page.goto('/');

    const play = page.getByRole('button', { name: 'Start Easy puzzle' });
    if (method === 'keyboard') await play.focus();
    await activateWith(page, method, play, 'Enter');
    await expect(page.getByRole('grid')).toBeVisible();

    const targetCell = page.getByRole('gridcell', {
      name: 'Row 1, column 6, empty',
    });
    if (method === 'keyboard') {
      await targetCell.focus();
    } else {
      await activateWith(page, method, targetCell);
    }
    await expect(targetCell).toHaveClass(/game-cell--selected/);

    await expect(targetCell).toHaveAccessibleName('Row 1, column 6, empty');
    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Notes off' }),
      'n',
    );
    await expect(targetCell).toHaveAccessibleName('Row 1, column 6, empty');
    for (const digit of [1, 2, 3] as const) {
      await activateWith(
        page,
        method,
        page.locator('.number-pad button').nth(digit - 1),
        `${digit}`,
      );
    }

    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 6, empty, candidates 1, 2, 3',
      }),
    ).toContainText('123');
    await expect.poll(() => api.actionRequests()).toBe(1);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({ kind: 'set-candidates', values: [1, 2, 3] });
    await expect.poll(() => api.completedActions()).toBe(1);

    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/rapid-hidden-cell-notes-123-${method}.png`
        : testInfo.outputPath(`rapid-hidden-cell-notes-123-${method}.png`),
      fullPage: true,
    });
    await context.close();
  });
}

for (const method of ['keyboard', 'mouse', 'touchscreen'] as const) {
  test(`plays values, notes, and candidates with ${method} only`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:4173',
      hasTouch: method === 'touchscreen',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const api = await mockGameApi(page, { row: 1, column: 1, values: [] });
    api.setActionDelay(500);
    await page.goto('/');

    const play = page.getByRole('button', { name: 'Start Easy puzzle' });
    if (method === 'keyboard') await play.focus();
    await activateWith(page, method, play, 'Enter');
    await expect(page.getByRole('grid')).toBeVisible();

    const firstCell = page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty',
    });
    if (method === 'keyboard') {
      await firstCell.focus();
    } else {
      await activateWith(page, method, firstCell);
    }
    await expect(firstCell).toHaveClass(/game-cell--selected/);

    const notesToggle = page.getByRole('button', { name: 'Notes off' });
    await activateWith(page, method, notesToggle, 'n');
    await expect(page.getByRole('button', { name: 'Notes on' })).toBeVisible();
    const noteFour = page.getByRole('button', {
      name: 'Add or remove note 4',
    });
    const noteFive = page.getByRole('button', {
      name: 'Add or remove note 5',
    });

    await activateWith(page, method, noteFour, '4');
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 1, empty, candidates 4',
      }),
    ).toContainText('4');
    await expect.poll(() => api.actionRequests()).toBe(1);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({
        kind: 'set-candidates',
        values: [4],
      });
    await expect.poll(() => api.completedActions()).toBe(1);

    await activateWith(page, method, noteFour, '4');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }),
    ).not.toContainText(/[1-9]/);
    await expect.poll(() => api.actionRequests()).toBe(2);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({
        kind: 'set-candidates',
        values: [],
      });
    await expect.poll(() => api.completedActions()).toBe(2);

    await activateWith(page, method, noteFour, '4');
    await activateWith(page, method, noteFive, '5');
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 1, empty, candidates 4, 5',
      }),
    ).toContainText('45');
    await expect.poll(() => api.actionRequests()).toBe(3);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({
        kind: 'set-candidates',
        values: [4, 5],
      });
    await expect.poll(() => api.completedActions()).toBe(3);

    // Exercise both directions while an ordinary complete-set save is
    // debounced: remove 4, add 6, then add 4 again. No accepted input may be
    // lost or reordered, even when one digit returns to its original state.
    await activateWith(page, method, noteFour, '4');
    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Add or remove note 6' }),
      '6',
    );
    await activateWith(page, method, noteFour, '4');
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 1, empty, candidates 4, 5, 6',
      }),
    ).toContainText('456');
    await expect.poll(() => api.actionRequests()).toBe(4);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({
        kind: 'set-candidates',
        values: [4, 5, 6],
      });
    await expect.poll(() => api.completedActions()).toBe(4);

    const erase = page.getByRole('button', { name: 'Erase' });
    await activateWith(page, method, erase, 'Delete');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }),
    ).not.toContainText(/[1-9]/);
    await expect.poll(() => api.actionRequests()).toBe(5);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({ kind: 'set-candidates', values: [] });
    await expect.poll(() => api.completedActions()).toBe(5);

    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Add or remove note 1' }),
      '1',
    );
    // Add two candidates rapidly while the complete-set save is debounced.
    // The final authoritative set must preserve both accepted activations.
    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Add or remove note 4' }),
      '4',
    );
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 1, empty, candidates 1, 4',
      }),
    ).toContainText('14');
    await expect.poll(() => api.actionRequests()).toBe(6);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({ kind: 'set-candidates', values: [1, 4] });
    await expect.poll(() => api.completedActions()).toBe(6);

    const notesOn = page.getByRole('button', { name: 'Notes on' });
    await activateWith(page, method, notesOn, 'n');
    const invalidCell = page.getByRole('gridcell', {
      name: 'Row 1, column 4, empty',
    });
    if (method === 'keyboard') {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
    } else {
      await activateWith(page, method, invalidCell);
    }
    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Enter 2' }),
      '2',
    );
    await expect.poll(() => api.actionRequests()).toBe(7);
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 4, 2, invalid' }),
    ).toHaveAttribute('aria-invalid', 'true');

    api.setNextValueIsInvalid(false);
    const validCell = page.getByRole('gridcell', {
      name: 'Row 1, column 8, empty',
    });
    if (method === 'keyboard') {
      for (let index = 0; index < 4; index += 1)
        await page.keyboard.press('ArrowRight');
    } else {
      await activateWith(page, method, validCell);
    }
    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Enter 9' }),
      '9',
    );
    await expect.poll(() => api.actionRequests()).toBe(8);
    await expect.poll(() => api.completedActions()).toBe(8);
    const validValueCell = page.getByRole('gridcell', {
      name: 'Row 1, column 8, 9',
    });
    await expect(validValueCell).not.toHaveAttribute('aria-invalid', 'true');

    await activateWith(page, method, erase, 'Delete');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 8, empty' }),
    ).toBeVisible();
    await expect.poll(() => api.actionRequests()).toBe(9);
    await expect.poll(() => api.completedActions()).toBe(9);
    expect(api.actions().at(-1)).toEqual({ kind: 'clear-value' });

    const undo = page.getByRole('button', { name: 'Undo' });
    await activateWith(page, method, undo, 'Control+z');
    await expect.poll(() => api.actionRequests()).toBe(10);
    await expect.poll(() => api.completedActions()).toBe(10);
    expect(api.actions().at(-1)).toEqual({ kind: 'undo' });
    const redo = page.getByRole('button', { name: 'Redo' });
    await activateWith(page, method, redo, 'Control+Shift+z');
    await expect.poll(() => api.actionRequests()).toBe(11);
    await expect.poll(() => api.completedActions()).toBe(11);
    expect(api.actions().at(-1)).toEqual({ kind: 'redo' });
    expect(api.expectedRevisions()).toEqual(
      Array.from({ length: 11 }, (_, index) => index),
    );

    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/input-matrix-${method}.png`
        : testInfo.outputPath(`input-matrix-${method}.png`),
      fullPage: true,
    });
    await context.close();
  });
}

test('keeps a short wide game clear of the footer', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1200, height: 630 });
  await mockGameApi(page);
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await expect(page.getByRole('grid')).toBeVisible();

  await expect(
    page.evaluate(() => {
      const board = document.querySelector('.board-stage');
      const controls = document.querySelector('.game-controls');
      const footer = document.querySelector('footer');
      if (!board || !controls || !footer) return false;
      const contentBottom = Math.max(
        board.getBoundingClientRect().bottom,
        controls.getBoundingClientRect().bottom,
      );
      return contentBottom <= footer.getBoundingClientRect().top;
    }),
  ).resolves.toBe(true);

  await expect(
    page.evaluate(() => {
      const board = document.querySelector('.board-stage');
      const controls = document.querySelector('.game-controls');
      if (!board || !controls) return Number.POSITIVE_INFINITY;
      return Math.abs(
        board.getBoundingClientRect().top -
          controls.getBoundingClientRect().top,
      );
    }),
  ).resolves.toBeLessThan(1.5);

  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-23.png`
      : testInfo.outputPath('short-wide-game.png'),
    fullPage: true,
  });
});

test('keeps board content fitted while the viewport is resized', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1623, height: 840 });
  await mockGameApi(page, {
    row: 1,
    column: 1,
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  });
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();

  const viewportMatrix = [
    { width: 1623, height: 840 },
    { width: 1280, height: 720 },
    { width: 1050, height: 680 },
    { width: 900, height: 760 },
    { width: 841, height: 760 },
    { width: 840, height: 760 },
    { width: 700, height: 640 },
    { width: 521, height: 720 },
    { width: 520, height: 720 },
    { width: 390, height: 700 },
  ];

  for (const viewport of viewportMatrix) {
    await page.setViewportSize(viewport);
    const layout = await page.locator('.game-board').evaluate((board) => {
      const rectangle = (element: Element) => {
        const { top, right, bottom, left, width, height } =
          element.getBoundingClientRect();
        return { top, right, bottom, left, width, height };
      };
      const cells = Array.from(board.children);
      const noteGrid = board.querySelector('.cell-notes');
      const notes = noteGrid ? Array.from(noteGrid.children) : [];
      const controls = document.querySelector('.game-controls');
      const gameLayout = document.querySelector('.game-layout');
      const footer = document.querySelector('footer');
      return {
        board: rectangle(board),
        firstCell: rectangle(cells[0]),
        noteGrid: noteGrid ? rectangle(noteGrid) : null,
        noteSlots: notes.map(rectangle),
        noteFontSize: noteGrid
          ? Number.parseFloat(getComputedStyle(noteGrid).fontSize)
          : 0,
        controls: controls ? rectangle(controls) : null,
        gameLayout: gameLayout ? rectangle(gameLayout) : null,
        layoutColumnGap: gameLayout
          ? Number.parseFloat(getComputedStyle(gameLayout).columnGap)
          : 0,
        layoutFirstColumnWidth: gameLayout
          ? Number.parseFloat(getComputedStyle(gameLayout).gridTemplateColumns)
          : 0,
        footer: footer ? rectangle(footer) : null,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    expect(Math.abs(layout.board.width - layout.board.height)).toBeLessThan(1);
    expect(
      Math.abs(layout.firstCell.width - layout.firstCell.height),
    ).toBeLessThan(1.5);
    expect(layout.noteGrid).not.toBeNull();
    expect(layout.noteSlots).toHaveLength(9);
    expect(
      new Set(layout.noteSlots.map((slot) => Math.round(slot.top))).size,
    ).toBe(3);
    expect(layout.noteFontSize).toBeLessThanOrEqual(
      Math.min(...layout.noteSlots.map((slot) => slot.height)),
    );
    for (const slot of layout.noteSlots) {
      expect(slot.top).toBeGreaterThanOrEqual(layout.noteGrid!.top - 0.5);
      expect(slot.bottom).toBeLessThanOrEqual(layout.noteGrid!.bottom + 0.5);
    }
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.controls).not.toBeNull();
    expect(layout.gameLayout).not.toBeNull();
    expect(
      layout.board.right <= layout.controls!.left ||
        layout.controls!.top >= layout.board.bottom,
    ).toBe(true);
    if (layout.controls!.top < layout.board.bottom) {
      const boardTrackRight = layout.controls!.left - layout.layoutColumnGap;
      const boardTrackLeft = boardTrackRight - layout.layoutFirstColumnWidth;
      const leftMargin = layout.board.left - boardTrackLeft;
      const rightMargin = boardTrackRight - layout.board.right;
      expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(1.5);
    }
    expect(layout.footer!.top).toBeGreaterThanOrEqual(
      Math.max(layout.board.bottom, layout.controls!.bottom) - 1,
    );
  }

  await page.setViewportSize({ width: 1050, height: 680 });
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-25.png`
      : testInfo.outputPath('resized-game-notes.png'),
    fullPage: true,
  });
});

test('keeps the welcome preview on a portrait tablet', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await mockGameApi(page);
  await page.goto('/');

  const preview = page.locator('.preview-card');
  await expect(preview).toBeVisible();
  await expect(preview.locator('.board-preview span')).toHaveCount(81);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-10.png`
      : testInfo.outputPath('welcome-preview-portrait-tablet.png'),
    fullPage: true,
  });
});

test('remembers the selected welcome difficulty across refreshes', async ({
  page,
}, testInfo) => {
  await mockGameApi(page);
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveCount(0);

  const expertButton = page.getByRole('button', {
    name: 'Expert',
    exact: true,
  });
  await expertButton.click();
  await expect(expertButton).toHaveAttribute('aria-pressed', 'true');
  const selectedTheme = page.locator('.theme-control [aria-pressed="true"]');
  const selectedThemeStyle = await selectedTheme.evaluate((control) => {
    const style = getComputedStyle(control);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
    };
  });
  await expect
    .poll(() =>
      expertButton.evaluate((control) => {
        const style = getComputedStyle(control);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
      }),
    )
    .toEqual(selectedThemeStyle);
  await expertButton.hover();
  await expect
    .poll(() =>
      expertButton.evaluate((control) => {
        const style = getComputedStyle(control);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
      }),
    )
    .toEqual(selectedThemeStyle);
  await expect(
    page.getByRole('button', { name: 'Start Expert puzzle' }),
  ).toBeVisible();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-12.png`
      : testInfo.outputPath('selected-welcome-difficulty.png'),
    fullPage: true,
  });

  await page.reload();

  await expect(page.locator('.connection')).toHaveCount(0);
  await expect(expertButton).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: 'Start Expert puzzle' }),
  ).toBeVisible();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-11.png`
      : testInfo.outputPath('remembered-welcome-difficulty.png'),
    fullPage: true,
  });
});

test('protects navigation home and supports a new difficulty', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await expect.poll(() => api.sessionRequests()).toBe(1);

  await page.getByRole('link', { name: 'Sudoku home' }).click();
  const homeDialog = page.getByRole('alertdialog', {
    name: 'Leave this puzzle',
  });
  await expect(homeDialog).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Keep playing' }),
  ).toBeFocused();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-9.png`
      : testInfo.outputPath('leave-puzzle-confirmation.png'),
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(homeDialog).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Sudoku home' })).toBeFocused();
  await expect(page.getByRole('grid')).toBeVisible();

  await page.getByRole('link', { name: 'Sudoku home' }).click();
  let deploymentChecks = 0;
  await page.route('/', async (route) => {
    if (route.request().headers()['x-sudoku-deployment-check'] !== '1') {
      await route.continue();
      return;
    }
    deploymentChecks += 1;
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><script type="module" src="/assets/index-new.js"></script>',
    });
  });
  const reloaded = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Return to front page' }).click();
  await reloaded;
  expect(deploymentChecks).toBe(1);
  await expect(homeDialog).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Choose your difficulty' }),
  ).toBeVisible();
  await expect(page.locator('.welcome-message')).toHaveCount(0);
  await expect.poll(() => api.sessionRequests()).toBe(1);

  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await expect.poll(() => api.sessionRequests()).toBe(2);

  await page.getByRole('button', { name: 'Start over' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Start over' });
  await expect(dialog).toBeVisible();
  const keepPlaying = page.getByRole('button', { name: 'Cancel' });
  const confirmNewPuzzle = page.getByRole('button', {
    name: 'Replay this puzzle',
  });
  await expect(keepPlaying).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(confirmNewPuzzle).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Easy', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('region', { name: 'Replay this puzzle' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Play a different puzzle' }),
  ).toBeVisible();
  await expect.poll(() => api.sessionRequests()).toBe(2);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-8.png`
      : testInfo.outputPath('new-puzzle-confirmation.png'),
    fullPage: true,
  });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 412, height: 839 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(dialog).toBeVisible();
    await expect(
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).resolves.toBe(true);
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-start-over-${viewport.width}.png`
        : testInfo.outputPath(`new-puzzle-confirmation-${viewport.width}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start over' })).toBeFocused();
  await expect(page.getByRole('grid')).toBeVisible();
  await expect.poll(() => api.sessionRequests()).toBe(2);

  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: 'Replay this puzzle' }).click();
  await expect.poll(() => api.actions().at(-1)).toEqual({ kind: 'restart' });
  await expect(
    page.getByText('Puzzle restarted. Fresh attempt, same puzzle.'),
  ).toBeVisible();
  await expect(page.getByLabel('Elapsed time')).toHaveText('0:00');
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }),
  ).toBeFocused();
  await expect.poll(() => api.sessionRequests()).toBe(2);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-replayed-puzzle.png`
      : testInfo.outputPath('replayed-puzzle.png'),
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: 'Hard' }).click();
  api.setSessionDelay(700);
  await page.getByRole('button', { name: 'Play a different puzzle' }).click();
  await expect.poll(() => api.sessionRequests()).toBe(3);
  const loadingState = page.getByRole('status', {
    name: 'Preparing your Hard board…',
  });
  await expect(loadingState).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start over' })).toHaveCount(0);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-22.png`
      : testInfo.outputPath('new-puzzle-loading.png'),
    fullPage: true,
  });
  await expect(dialog).toHaveCount(0);
  await expect(loadingState).toHaveCount(0);
  await expect(page.locator('.game-status')).toHaveCount(0);
  expect(api.requestedDifficulties()).toEqual(['easy', 'easy', 'hard']);
});

test('closes an open hint when replaying or starting a different puzzle', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();

  await page.getByRole('button', { name: 'Reveal a hint' }).click();
  await expect(page.locator('.hint-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: 'Replay this puzzle' }).click();

  await expect.poll(() => api.actions().at(-1)).toEqual({ kind: 'restart' });
  await expect(page.locator('.hint-panel')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Reveal a hint' }),
  ).toBeVisible();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-hint-cleared-replay.png`
      : testInfo.outputPath('hint-cleared-replay.png'),
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Reveal a hint' }).click();
  await expect(page.locator('.hint-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: 'Hard' }).click();
  await page.getByRole('button', { name: 'Play a different puzzle' }).click();

  await expect.poll(() => api.sessionRequests()).toBe(2);
  await expect(page.locator('.hint-panel')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Reveal a hint' }),
  ).toBeVisible();
  expect(api.requestedDifficulties()).toEqual(['easy', 'hard']);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-hint-cleared-new-puzzle.png`
      : testInfo.outputPath('hint-cleared-new-puzzle.png'),
    fullPage: true,
  });
});

test('shows rapid values immediately and commits them in revision order', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  api.setActionDelay(800);
  const controlsBeforeRoutineActions = await page
    .locator('.game-controls')
    .boundingBox();

  await page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }).click();
  await page.keyboard.press('1');
  const firstPending = page.getByRole('gridcell', {
    name: 'Row 1, column 1, 1, checking',
  });
  await expect(firstPending).toBeVisible();
  await expect(firstPending).toHaveAttribute('aria-busy', 'true');

  await page.getByRole('gridcell', { name: 'Row 1, column 4, empty' }).click();
  await page.keyboard.press('2');
  const secondPending = page.getByRole('gridcell', {
    name: 'Row 1, column 4, 2, checking',
  });
  await expect(secondPending).toBeVisible();
  await expect.poll(() => api.actionRequests()).toBe(1);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-23.png`
      : testInfo.outputPath('pending-values.png'),
    fullPage: true,
  });

  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 1, 1, invalid' }),
  ).toBeVisible();
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 4, 2, invalid' }),
  ).toBeVisible();
  expect(api.expectedRevisions()).toEqual([0, 1]);
  expect(await page.locator('.game-controls').boundingBox()).toEqual(
    controlsBeforeRoutineActions,
  );
  await expect(page.locator('.game-status')).toHaveCount(0);

  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-24.png`
      : testInfo.outputPath('serialized-authoritative-values.png'),
    fullPage: true,
  });
});

test('corrects the exact candidate cell before presenting a strategy', async ({
  page,
}) => {
  const api = await mockGameApi(page);
  api.useCandidateCorrectionHint();
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await page.getByRole('button', { name: 'Reveal a hint' }).click();

  await expect(
    page.getByRole('heading', { name: 'Fix this candidate cell' }),
  ).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toHaveCount(0);
  await expect(
    page.getByRole('gridcell', {
      name: /Row 1, column 1, empty, candidates .*needs correction, impossible candidate/,
    }),
  ).toBeVisible();

  await expect(page.getByText(/solution|required candidate/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText(/discard this cell’s deductions/i)).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(
    page.getByText(/every locally allowed digit: 1 and 8/i),
  ).toBeVisible();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/candidate-cell-reset.png`
      : undefined,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Apply hint' }).click();
  await expect(page.locator('.game-status')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Candidates on' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty, candidates 1, 8',
    }),
  ).toContainText('18');
  expect(api.actions().at(-1)).toEqual({
    kind: 'apply-hint',
    plan_id: 'c'.repeat(64),
  });
});

test('teaches a complete hint locally and applies the exact previewed plan', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await expect(page.getByRole('button', { name: 'Notes off' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  const boardBeforeHint = await page.locator('.game-board').boundingBox();
  const controlsBeforeHint = await page.locator('.game-controls').boundingBox();
  const gameHeadingBeforeHint = await page
    .locator('.game-heading')
    .boundingBox();
  const siteHeaderBeforeHint = await page.locator('.site-header').boundingBox();
  await page.keyboard.press('h');
  await expect(page.getByText('Hint', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Hidden single' }),
  ).toBeVisible();
  await expect(page.getByText('Easy strategy')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('heading', { name: 'Hidden single' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Candidates on' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('h');
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
  const hintHeaderBefore = await page
    .locator('.hint-panel__heading')
    .boundingBox();
  await expect(
    page.getByText('Scan row 1 and compare the remaining candidates.'),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      /Row 1, column 1, empty, candidates .*hint evidence, candidate eliminated/,
    ),
  ).toHaveClass(/game-cell--hint-premise/);
  await expect(page.locator('.cell-note--hint-eliminated')).toHaveText('3');
  await expect(page.getByLabel('Number pad')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Notes off' })).toHaveCount(0);
  const boardAfterHint = await page.locator('.game-board').boundingBox();
  const controlsAfterHint = await page.locator('.game-controls').boundingBox();
  const gameHeadingAfterHint = await page
    .locator('.game-heading')
    .boundingBox();
  const siteHeaderAfterHint = await page.locator('.site-header').boundingBox();
  expect(boardAfterHint).toEqual(boardBeforeHint);
  expect({ x: controlsAfterHint?.x, width: controlsAfterHint?.width }).toEqual({
    x: controlsBeforeHint?.x,
    width: controlsBeforeHint?.width,
  });
  expect(gameHeadingAfterHint).toEqual(gameHeadingBeforeHint);
  expect(siteHeaderAfterHint).toEqual(siteHeaderBeforeHint);
  const footerBox = await page.locator('footer').boundingBox();
  const controlsBox = await page.locator('.game-controls').boundingBox();
  expect(footerBox!.y).toBeGreaterThanOrEqual(
    controlsBox!.y + controlsBox!.height,
  );
  const hintedCell = page.getByLabel(
    /Row 1, column 1, empty, candidates .*hint evidence, candidate eliminated/,
  );
  await expect(hintedCell).toHaveAttribute('aria-disabled', 'true');
  await hintedCell.click({ force: true });
  await expect(hintedCell).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('2');
  expect(api.actionRequests()).toBe(0);

  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Step 2 of 2')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Cell R1C1 must be 1.')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Hidden single' }),
  ).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Easy strategy',
  );
  expect(await page.locator('.hint-panel__heading').boundingBox()).toEqual(
    hintHeaderBefore,
  );
  await expect(
    page.getByLabel(/Row 1, column 1, empty, candidates .*hint conclusion/),
  ).toHaveClass(/game-cell--hint-conclusion/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Step 2 of 2')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-hint-teaching-mobile.png`
      : testInfo.outputPath('hint-teaching-mobile.png'),
    fullPage: true,
  });

  await page.keyboard.press('Enter');
  await expect.poll(() => api.actionRequests()).toBe(1);
  expect(api.actions()).toEqual([
    { kind: 'apply-hint', plan_id: 'a'.repeat(64) },
  ]);
  expect(api.expectedRevisions()).toEqual([0]);
  await expect(page.getByLabel('Row 1, column 1, 1')).toBeVisible();
  await expect(page.locator('.game-status')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
});

test('keeps perimeter hint labels inside the board and clear of candidates', async ({
  page,
}, testInfo) => {
  await mockGameApi(page);
  const nodes = [
    {
      id: 'top-left',
      target: { kind: 'candidate', row: 1, column: 1, value: 1 },
      order: 1,
    },
    {
      id: 'top-right',
      target: { kind: 'candidate', row: 1, column: 9, value: 3 },
      order: 2,
    },
    {
      id: 'bottom-left',
      target: { kind: 'candidate', row: 9, column: 2, value: 7 },
      order: 10,
    },
    {
      id: 'bottom-right',
      target: { kind: 'candidate', row: 9, column: 9, value: 9 },
      order: 12,
    },
    {
      id: 'middle-left',
      target: { kind: 'candidate', row: 4, column: 1, value: 4 },
      group: 'A',
    },
    {
      id: 'middle-right',
      target: { kind: 'candidate', row: 5, column: 9, value: 6 },
      group: 'B',
    },
  ];
  await page.route('**/api/v1/guest/games/hint', (route) =>
    route.fulfill({
      json: {
        revision: 0,
        hint: {
          plan_id: 'c'.repeat(64),
          strategy: {
            id: 'xy-chain',
            display_name: 'XY-Chain',
            grade: 'Evil',
          },
          summary: 'The chain removes candidate 1.',
          steps: [
            {
              id: 'trace-chain',
              kind: 'observe',
              message: 'Trace the top-row chain.',
              marks: [],
              nodes,
              links: [
                {
                  from: 'top-left',
                  to: 'top-right',
                  kind: 'implication',
                },
              ],
            },
            {
              id: 'finish-chain',
              kind: 'eliminate',
              message: 'The chain removes candidate 1.',
              marks: [
                {
                  target: {
                    kind: 'candidate',
                    row: 1,
                    column: 4,
                    value: 1,
                  },
                  role: 'conclusion',
                },
              ],
              nodes,
              links: [
                {
                  from: 'top-left',
                  to: 'top-right',
                  kind: 'implication',
                },
              ],
              effect: {
                eliminations: [{ row: 1, column: 4, value: 1 }],
              },
            },
          ],
          conclusion: {
            eliminations: [{ row: 1, column: 4, value: 1 }],
          },
        },
      },
    }),
  );

  await page.goto('./');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await page.getByRole('button', { name: 'Reveal a hint' }).click();
  await expect(page.getByText('Trace the top-row chain.')).toBeVisible();
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const labelPositions = await page
      .locator('.hint-node text')
      .evaluateAll((labels) =>
        labels.map((label) => ({
          x: Number(label.getAttribute('x')),
          y: Number(label.getAttribute('y')),
        })),
      );
    expect(labelPositions).toHaveLength(nodes.length);
    for (const label of labelPositions) {
      expect(label.x).toBeGreaterThanOrEqual(0);
      expect(label.x).toBeLessThanOrEqual(9);
      expect(label.y).toBeGreaterThanOrEqual(0);
      expect(label.y).toBeLessThanOrEqual(9);
    }

    const boardBox = await page.locator('.game-board').boundingBox();
    expect(boardBox).not.toBeNull();
    const geometry = await page.locator('.hint-node text').evaluateAll(
      (labels, expectedNodes) =>
        labels.map((label, index) => {
          const expected = expectedNodes[index];
          const candidate = document.querySelector<HTMLElement>(
            `[data-cell="${expected.target.row - 1}-${expected.target.column - 1}"] .cell-notes > span:nth-child(${expected.target.value})`,
          );
          if (!candidate) return null;
          const labelBox = label.getBoundingClientRect();
          const candidateBox = candidate.getBoundingClientRect();
          const ringStyle = getComputedStyle(candidate, '::after');
          const ringSize = Number.parseFloat(ringStyle.width);
          const centerX = (candidateBox.left + candidateBox.right) / 2;
          const centerY = (candidateBox.top + candidateBox.bottom) / 2;
          const ring = {
            left: centerX - ringSize / 2,
            right: centerX + ringSize / 2,
            top: centerY - ringSize / 2,
            bottom: centerY + ringSize / 2,
          };
          return {
            label: {
              left: labelBox.left,
              top: labelBox.top,
              right: labelBox.right,
              bottom: labelBox.bottom,
            },
            clear:
              labelBox.right <= ring.left ||
              labelBox.left >= ring.right ||
              labelBox.bottom <= ring.top ||
              labelBox.top >= ring.bottom,
          };
        }),
      nodes,
    );
    expect(geometry).not.toContain(null);
    for (const result of geometry) {
      expect(result!.label.left).toBeGreaterThanOrEqual(boardBox!.x);
      expect(result!.label.top).toBeGreaterThanOrEqual(boardBox!.y);
      expect(result!.label.right).toBeLessThanOrEqual(
        boardBox!.x + boardBox!.width,
      );
      expect(result!.label.bottom).toBeLessThanOrEqual(
        boardBox!.y + boardBox!.height,
      );
      expect(result!.clear).toBe(true);
    }
  }
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-perimeter-hint-labels.png`
      : testInfo.outputPath('perimeter-hint-labels.png'),
    fullPage: true,
  });
});

test('applies a Naked Pair to the authoritative candidate grid', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  api.useNakedPairHint();
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 6, empty' }),
  ).toBeVisible();
  await expect(
    page.getByRole('gridcell', { name: /, candidates / }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Reveal a hint' }).click();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Medium strategy',
  );
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Medium strategy',
  );
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Naked pair' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Medium strategy',
  );
  await page.getByRole('button', { name: 'Apply hint' }).click();

  expect(api.actions()).toEqual([
    { kind: 'apply-hint', plan_id: 'b'.repeat(64) },
  ]);
  await expect(page.getByRole('button', { name: 'Notes off' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(
    page.getByRole('button', { name: 'Candidates on' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('gridcell', {
      name: 'Row 1, column 6, empty, candidates 9',
    }),
  ).toContainText('9');
  await expect(
    page.getByRole('gridcell', { name: /, candidates / }),
  ).toHaveCount(61);
  await expect
    .poll(() =>
      page
        .locator('.cell-notes--automatic > span')
        .evaluateAll(
          (digits) =>
            digits.filter((digit) => digit.textContent?.trim() !== '').length,
        ),
    )
    .toBe(259);
  await expect(
    page.getByRole('gridcell', {
      name: 'Row 9, column 9, empty, candidates 2, 3, 6, 8, 9',
    }),
  ).toContainText('23689');
  await expect(page.locator('.game-status')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-32.png`
      : testInfo.outputPath('notes-hint-applied.png'),
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect
    .poll(() =>
      page
        .locator('.cell-notes--automatic > span')
        .evaluateAll(
          (digits) =>
            digits.filter((digit) => digit.textContent?.trim() !== '').length,
        ),
    )
    .toBe(265);
  await expect(page.getByRole('button', { name: 'Redo' })).toBeEnabled();
});

test('closes a consumed hint instead of refreshing the same plan forever', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page, {
    row: 1,
    column: 6,
    values: [6],
  });
  api.useNakedPairHint();
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await page.getByRole('button', { name: 'Candidates off' }).click();
  await expect(
    page.getByRole('button', { name: 'Candidates on' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('gridcell', {
      name: /Row 1, column 6, empty, candidates .*6/,
    }),
  ).toContainText('6');
  await page.getByRole('button', { name: 'Reveal a hint' }).click();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Medium strategy',
  );
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Naked pair' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Medium strategy',
  );

  api.staleNextHintAction();
  await page.getByRole('button', { name: 'Apply hint' }).click();

  await expect(
    page.getByText('This hint is already reflected in the board.'),
  ).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Reveal a hint' }),
  ).toBeEnabled();
  expect(api.actionRequests()).toBe(1);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-33.png`
      : testInfo.outputPath('consumed-hint-closed.png'),
    fullPage: true,
  });
});

test('keeps elapsed time independent from rapid game actions', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await expect(page.getByLabel('Elapsed time')).toHaveText('0:00');

  api.setActionDelay(300);
  const moves = [
    { name: 'Row 1, column 1, empty', digit: '1' },
    { name: 'Row 1, column 4, empty', digit: '2' },
    { name: 'Row 1, column 6, empty', digit: '3' },
    { name: 'Row 2, column 1, empty', digit: '4' },
    { name: 'Row 2, column 3, empty', digit: '5' },
  ];
  for (const move of moves) {
    await page.getByRole('gridcell', { name: move.name }).click();
    await page.keyboard.press(move.digit);
  }

  await expect.poll(() => api.actionRequests()).toBe(5);
  await expect.poll(() => api.actions().length).toBe(5);
  expect(api.expectedRevisions()).toEqual([0, 1, 2, 3, 4]);
  await expect(page.getByLabel('Elapsed time')).not.toHaveText('0:00');
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-13.png`
      : testInfo.outputPath('timer-during-rapid-actions.png'),
    fullPage: true,
  });
});

test('offers retryable failures and a focused completion path', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  const firstCell = page.getByRole('gridcell', {
    name: 'Row 1, column 1, empty',
  });
  await firstCell.click();
  api.failNextAction();
  await page.keyboard.press('1');
  await expect(page.getByRole('button', { name: 'Retry move' })).toBeVisible();
  await expect(page.getByText(/temporarily unavailable/)).toBeVisible();
  await page.getByRole('button', { name: 'Retry move' }).click();
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 1, 1, invalid' }),
  ).toBeVisible();
  api.setNextStatus('solved');
  await page
    .getByRole('gridcell', { name: 'Row 1, column 1, 1, invalid' })
    .click();
  await page.keyboard.press('2');
  await expect(page.getByText('Puzzle solved. Beautiful work!')).toBeVisible();
  const completionHeading = page.getByRole('heading', { name: /Solved in/ });
  await expect(completionHeading).toBeVisible();
  await expect(completionHeading).toBeFocused();
  await expect(completionHeading).toHaveCSS('outline-style', 'solid');
  await expect(page.getByRole('button', { name: 'Pause' })).toBeDisabled();
  await expect(page.getByLabel('Number pad')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reveal a hint' })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-14.png`
      : testInfo.outputPath('solved-completion.png'),
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Replay this puzzle' }).click();
  await expect.poll(() => api.actions().at(-1)).toEqual({ kind: 'restart' });
  await expect(
    page.getByText('Puzzle restarted. Fresh attempt, same puzzle.'),
  ).toBeVisible();
  await expect(page.getByLabel('Elapsed time')).toHaveText('0:00');
  await expect.poll(() => api.sessionRequests()).toBe(1);

  api.setNextStatus('solved');
  await page.getByRole('gridcell', { name: 'Row 1, column 4, empty' }).click();
  await page.keyboard.press('3');
  await expect(page.getByRole('heading', { name: /Solved in/ })).toBeFocused();
  await page.getByRole('button', { name: 'Choose another level' }).click();
  await expect(
    page.getByRole('heading', { name: 'Choose your difficulty' }),
  ).toBeVisible();
});

test('moves rapid click-and-keyboard input away from an invalid cell', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();

  const first = page.getByRole('gridcell', {
    name: 'Row 1, column 1, empty',
  });
  await first.click();
  await page.keyboard.press('1');
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 1, 1, invalid' }),
  ).toHaveAttribute('aria-selected', 'true');

  const second = page.getByRole('gridcell', {
    name: 'Row 1, column 4, empty',
  });
  await second.evaluate((cell) => {
    (cell as HTMLElement).focus();
    (cell as HTMLElement).click();
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '2', bubbles: true }),
    );
  });

  await expect.poll(() => api.actions().length).toBe(2);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-invalid-selection.png`
      : testInfo.outputPath('invalid-selection.png'),
    fullPage: true,
  });
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 4, 2, invalid' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('keeps normal-paced mouse and keyboard input on each newly clicked cell', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  api.setActionDelay(350);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();

  const entries = [
    { row: 1, column: 1, value: 1 },
    { row: 1, column: 4, value: 2 },
    { row: 1, column: 6, value: 3 },
    { row: 1, column: 8, value: 4 },
  ];

  for (const entry of entries) {
    const cell = page.locator(
      `[data-cell="${entry.row - 1}-${entry.column - 1}"]`,
    );
    await expect(cell).toHaveAccessibleName(
      `Row ${entry.row}, column ${entry.column}, empty`,
    );
    await cell.click();
    await expect(cell).toBeFocused();
    await page.keyboard.press(String(entry.value));
    await expect(cell).toHaveAttribute('aria-selected', 'true');
  }

  await expect.poll(() => api.completedActions()).toBe(entries.length);
  expect(api.actions()).toEqual(
    entries.map(({ value }) => ({ kind: 'set-value', value })),
  );
  expect(api.actionTargets()).toEqual(
    entries.map(({ row, column }) => ({ row, column })),
  );
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-normal-paced-selection.png`
      : testInfo.outputPath('normal-paced-selection.png'),
    fullPage: true,
  });
  await expect(
    page.getByRole('gridcell', {
      name: 'Row 1, column 8, 4, invalid',
    }),
  ).toBeFocused();
});

test('automatically claims the local game after sign-in and exposes My games', async ({
  page,
}, testInfo) => {
  await mockGameApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await expect(
    page.getByRole('heading', { name: 'Easy puzzle' }),
  ).toBeVisible();

  const accountSnapshot = {
    givens: gridFromPuzzle(),
    values: gridFromPuzzle(),
    invalid: emptyBooleanGrid(),
    candidates: emptyDigitSetGrid(),
    mistakes: 0,
    status: 'solved',
    can_undo: false,
    can_redo: false,
  };
  let claimRequests = 0;
  let bulkDeleteRequests = 0;

  await page.route('**/api/v1/account/games', (route) => {
    if (route.request().method() === 'DELETE') {
      bulkDeleteRequests += 1;
      expect(route.request().headers()['x-sudoku-csrf']).toBe('csrf-proof');
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({
      json: {
        games: [
          {
            id: 'claimed-game',
            revision: 0,
            actual_difficulty: 'easy',
            status: 'solved',
            elapsed_seconds: 125,
            updated_at: '2026-10-05T00:00:00Z',
          },
        ],
      },
    });
  });
  await page.route('**/api/v1/account/games/claim', async (route) => {
    claimRequests += 1;
    expect(route.request().headers()['x-sudoku-csrf']).toBe('csrf-proof');
    expect(route.request().postDataJSON()).toMatchObject({
      document: expect.stringMatching(/^sealed-/),
    });
    await route.fulfill({
      json: {
        id: 'claimed-game',
        revision: 0,
        actual_difficulty: 'easy',
        elapsed_seconds: 125,
        snapshot: accountSnapshot,
      },
    });
  });
  await page.route('**/api/v1/account', (route) =>
    route.fulfill({
      json: {
        email: 'player@example.test',
        display_name: 'Puzzle Player',
        csrf_token: 'csrf-proof',
      },
    }),
  );

  await page.reload();

  await expect(page.getByText('Game saved to your account.')).toBeVisible();
  await page.getByRole('button', { name: 'Puzzle Player' }).click();
  await expect(
    page.getByRole('heading', { name: 'Puzzle Player' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My games' })).toBeVisible();
  await expect(
    page.getByRole('strong').filter({ hasText: 'Easy puzzle' }),
  ).toBeVisible();
  await expect(page.getByText('Finished · 2:05')).toBeVisible();

  const gameDelete = page.getByRole('button', { name: 'Delete', exact: true });
  await gameDelete.click();
  const gameDialog = page.getByRole('alertdialog', {
    name: 'Delete this game',
  });
  await expect(
    gameDialog.getByRole('button', { name: 'Cancel' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(gameDialog).toHaveCount(0);
  await expect(gameDelete).toBeFocused();

  await page.getByText('Account settings').click();
  const revoke = page.getByRole('button', { name: 'Revoke all sessions' });
  await revoke.click();
  const revokeDialog = page.getByRole('alertdialog', {
    name: 'Sign out every device',
  });
  await expect(revokeDialog).toContainText('saved games will remain');
  await page.keyboard.press('Escape');
  await expect(revoke).toBeFocused();

  const accountDelete = page.getByRole('button', { name: 'Delete account' });
  await accountDelete.click();
  const accountDialog = page.getByRole('alertdialog', {
    name: 'Delete your account',
  });
  const typedEmail = accountDialog.getByRole('textbox');
  const confirmAccountDelete = accountDialog.getByRole('button', {
    name: 'Delete account',
  });
  await expect(confirmAccountDelete).toBeDisabled();
  await typedEmail.fill('wrong@example.test');
  await expect(confirmAccountDelete).toBeDisabled();
  await typedEmail.fill('player@example.test');
  await expect(confirmAccountDelete).toBeEnabled();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-account-delete-confirmation.png`
      : testInfo.outputPath('account-delete-confirmation.png'),
    fullPage: true,
  });
  await accountDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(accountDelete).toBeFocused();

  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-account-claim.png`
      : testInfo.outputPath('account-claim.png'),
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'My games' })).toBeHidden();
  await page.getByRole('button', { name: 'Puzzle Player' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'My games' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-account-claim-mobile.png`
      : testInfo.outputPath('account-claim-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Delete all' }).click();
  const bulkDeleteDialog = page.getByRole('alertdialog', {
    name: 'Delete all games',
  });
  await expect(
    bulkDeleteDialog.getByRole('button', { name: 'Cancel' }),
  ).toBeFocused();
  await bulkDeleteDialog
    .getByRole('button', { name: 'Delete all games' })
    .click();
  await expect(page.getByText('No saved games yet.')).toBeVisible();
  expect(bulkDeleteRequests).toBe(1);
  expect(claimRequests).toBe(1);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const request = indexedDB.open('sudoku-ui');
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const transaction = database.transaction('guest-game', 'readonly');
        const get = transaction.objectStore('guest-game').get('current');
        return await new Promise<boolean>((resolve, reject) => {
          get.onsuccess = () => resolve(get.result === undefined);
          get.onerror = () => reject(get.error);
        });
      }),
    )
    .toBe(true);
});

test('reopens the active signed-in game after refresh', async ({
  page,
}, testInfo) => {
  await mockGameApi(page);
  const accountSnapshot = {
    givens: gridFromPuzzle(),
    values: gridFromPuzzle(),
    invalid: emptyBooleanGrid(),
    candidates: emptyDigitSetGrid(),
    mistakes: 0,
    status: 'in-progress' as const,
    can_undo: false,
    can_redo: false,
  };
  accountSnapshot.values[0]![0] = 8;
  let exactGameRequests = 0;

  await page.route('**/api/v1/account/games', (route) =>
    route.fulfill({
      json: {
        games: [
          {
            id: 'saved-game',
            revision: 7,
            actual_difficulty: 'hard',
            status: 'in-progress',
            elapsed_seconds: 73,
            updated_at: '2026-10-09T17:00:00Z',
          },
        ],
      },
    }),
  );
  await page.route('**/api/v1/account/games/saved-game', (route) => {
    exactGameRequests += 1;
    return route.fulfill({
      json: {
        id: 'saved-game',
        revision: 7,
        actual_difficulty: 'hard',
        elapsed_seconds: 73,
        snapshot: accountSnapshot,
      },
    });
  });
  await page.route('**/api/v1/account', (route) =>
    route.fulfill({
      json: {
        email: 'player@example.test',
        display_name: 'Puzzle Player',
        csrf_token: 'csrf-proof',
      },
    }),
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Puzzle Player' }).click();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Hard puzzle' }),
  ).toBeVisible();
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 1, 8' }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Elapsed time')).toHaveText('1:13');
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-account-refresh.png`
      : testInfo.outputPath('account-refresh.png'),
    fullPage: true,
  });

  await expect(
    page.getByRole('heading', { name: 'Hard puzzle' }),
  ).toBeVisible();
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 1, 8' }),
  ).toBeVisible();
  expect(exactGameRequests).toBe(2);
});

test('reopens the completed signed-in game after refresh', async ({
  page,
}, testInfo) => {
  await mockGameApi(page);
  const accountSnapshot = {
    givens: gridFromPuzzle(),
    values: gridFromPuzzle(),
    invalid: emptyBooleanGrid(),
    candidates: emptyDigitSetGrid(),
    mistakes: 0,
    status: 'solved' as const,
    can_undo: false,
    can_redo: false,
  };
  let exactGameRequests = 0;

  await page.route('**/api/v1/account/games', (route) =>
    route.fulfill({
      json: {
        games: [
          {
            id: 'completed-game',
            revision: 9,
            actual_difficulty: 'expert',
            status: 'solved',
            elapsed_seconds: 305,
            updated_at: '2026-10-09T17:30:00Z',
          },
        ],
      },
    }),
  );
  await page.route(
    '**/api/v1/account/games/completed-game/presentation',
    (route) =>
      route.fulfill({
        json: {
          id: 'completed-game',
          revision: 9,
          actual_difficulty: 'expert',
          elapsed_seconds: 305,
          snapshot: accountSnapshot,
        },
      }),
  );
  await page.route('**/api/v1/account/games/completed-game', (route) => {
    exactGameRequests += 1;
    return route.fulfill({
      json: {
        id: 'completed-game',
        revision: 9,
        actual_difficulty: 'expert',
        elapsed_seconds: 305,
        snapshot: accountSnapshot,
      },
    });
  });
  await page.route('**/api/v1/account', (route) =>
    route.fulfill({
      json: {
        email: 'player@example.test',
        display_name: 'Puzzle Player',
        csrf_token: 'csrf-proof',
      },
    }),
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Puzzle Player' }).click();
  await expect(page.getByText('Finished · 5:05')).toBeVisible();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.getByText('Puzzle complete')).toBeVisible();
  await expect(page.getByLabel('Elapsed time')).toHaveText('5:05');
  await expect(
    page.getByRole('button', { name: 'Play another Expert' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Choose another level' }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText('Puzzle complete')).toBeVisible();
  await expect(page.getByLabel('Elapsed time')).toHaveText('5:05');
  await expect(page.getByText('Expert puzzle', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Retry saving time' }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Number pad')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reveal a hint' })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-account-completed-refresh.png`
      : testInfo.outputPath('account-completed-refresh.png'),
    fullPage: true,
  });

  expect(exactGameRequests).toBe(2);
});
