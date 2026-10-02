import { expect, test, type Page } from '@playwright/test';

const puzzle =
  '.56.4.7...1.5....6.......19...9.....3.58..2...4...6...1.....93....4....22.3.1....';

const gridFromPuzzle = () =>
  Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, column) => {
      const value = puzzle[row * 9 + column];
      return value === '.' ? 0 : Number(value);
    }),
  );

const emptyBooleanGrid = () =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false));
const emptyDigitSetGrid = () =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [] as number[]),
  );

const mockGameApi = async (
  page: Page,
  initialNotes?: { row: number; column: number; values: number[] },
) => {
  const givens = gridFromPuzzle();
  const values = gridFromPuzzle();
  const invalid = emptyBooleanGrid();
  const notes = emptyDigitSetGrid();
  if (initialNotes) {
    notes[initialNotes.row - 1][initialNotes.column - 1] = initialNotes.values;
  }
  const candidates = emptyDigitSetGrid();
  candidates[0][0] = [1, 3, 8];
  candidates[0][5] = [6];
  candidates[0][3] = [2, 5, 9];
  let revision = 0;
  let canUndo = false;
  let canRedo = false;
  let actionRequests = 0;
  let completedActions = 0;
  const actions: Array<{
    kind: string;
    value?: number;
    values?: number[];
  }> = [];
  const actionTargets: Array<{ row?: number; column?: number }> = [];
  const expectedRevisions: number[] = [];
  let adoptionPreviousNotes: number[][][] | undefined;
  let adoptionNotes: number[][][] | undefined;
  let sessionRequests = 0;
  let activeSessionId = 'mock-session-id-0';
  let nextValueIsInvalid = true;
  let mistakes = 0;
  let failNextAction = false;
  let nextStatus: 'in-progress' | 'solved' = 'in-progress';
  let actionDelayMs = 0;
  let restoreDelayMs = 0;
  let sessionDelayMs = 0;
  const requestedDifficulties: string[] = [];
  let requestedDifficulty = 'easy';

  await page.route('**/healthz', (route) =>
    route.fulfill({ json: { status: 'healthy' } }),
  );
  await page.route('**/api/v1/sessions', async (route) => {
    if (route.request().method() === 'POST') {
      sessionRequests += 1;
      mistakes = 0;
      activeSessionId = `mock-session-id-${sessionRequests}`;
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
          id: activeSessionId,
          revision,
          requested_difficulty: requestedDifficulty,
          actual_difficulty: requestedDifficulty,
          snapshot: {
            givens,
            values,
            invalid,
            notes,
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
  await page.route(/\/api\/v1\/sessions\/[^/]+$/, async (route) => {
    if (restoreDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, restoreDelayMs));
    }
    await route.fulfill({
      json: {
        id: activeSessionId,
        revision,
        requested_difficulty: requestedDifficulty,
        actual_difficulty: requestedDifficulty,
        snapshot: {
          givens,
          values,
          invalid,
          notes,
          candidates,
          mistakes,
          status: nextStatus,
          can_undo: canUndo,
          can_redo: canRedo,
        },
      },
    });
  });
  await page.route('**/api/v1/sessions/*/actions', async (route) => {
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
    const action = route.request().postDataJSON() as {
      kind: string;
      expected_revision: number;
      row?: number;
      column?: number;
      value?: number;
      values?: number[];
    };
    expectedRevisions.push(action.expected_revision);
    actions.push({
      kind: action.kind,
      ...(action.value === undefined ? {} : { value: action.value }),
      ...(action.values === undefined ? {} : { values: action.values }),
    });
    actionTargets.push({ row: action.row, column: action.column });
    if (action.kind === 'set-value' && action.row && action.column) {
      values[action.row - 1][action.column - 1] = action.value ?? 0;
      invalid[action.row - 1][action.column - 1] = nextValueIsInvalid;
      if (nextValueIsInvalid) mistakes += 1;
      canUndo = true;
      canRedo = false;
    }
    if (action.kind === 'set-notes' && action.row && action.column) {
      notes[action.row - 1][action.column - 1] = [...(action.values ?? [])];
      canUndo = true;
      canRedo = false;
    }
    if (
      action.kind === 'adopt-candidates-as-notes' &&
      action.row &&
      action.column &&
      action.value
    ) {
      adoptionPreviousNotes = notes.map((row) => row.map((cell) => [...cell]));
      for (let row = 0; row < 9; row += 1) {
        for (let column = 0; column < 9; column += 1) {
          notes[row]![column] =
            values[row]![column] === 0 ? [...candidates[row]![column]!] : [];
        }
      }
      const selectedNotes = notes[action.row - 1]![action.column - 1]!;
      notes[action.row - 1]![action.column - 1] = selectedNotes.includes(
        action.value,
      )
        ? selectedNotes.filter((value) => value !== action.value)
        : [...selectedNotes, action.value].sort();
      adoptionNotes = notes.map((row) => row.map((cell) => [...cell]));
      canUndo = true;
      canRedo = false;
    }
    if (action.kind === 'clear-value' && action.row && action.column) {
      values[action.row - 1][action.column - 1] = 0;
      invalid[action.row - 1][action.column - 1] = false;
      canUndo = true;
      canRedo = false;
    }
    if (action.kind === 'undo') {
      if (adoptionPreviousNotes) {
        for (let row = 0; row < 9; row += 1)
          for (let column = 0; column < 9; column += 1)
            notes[row]![column] = [...adoptionPreviousNotes[row]![column]!];
      }
      canUndo = false;
      canRedo = true;
    }
    if (action.kind === 'redo') {
      if (adoptionNotes) {
        for (let row = 0; row < 9; row += 1)
          for (let column = 0; column < 9; column += 1)
            notes[row]![column] = [...adoptionNotes[row]![column]!];
      }
      canUndo = true;
      canRedo = false;
    }
    revision += 1;
    await route.fulfill({
      json: {
        revision,
        snapshot: {
          givens,
          values,
          invalid,
          notes,
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
    setNextStatus: (value: 'in-progress' | 'solved') => {
      nextStatus = value;
    },
    setActionDelay: (milliseconds: number) => {
      actionDelayMs = milliseconds;
    },
    setRestoreDelay: (milliseconds: number) => {
      restoreDelayMs = milliseconds;
    },
    setSessionDelay: (milliseconds: number) => {
      sessionDelayMs = milliseconds;
    },
  };
};

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
    const theme = page.getByRole('combobox', { name: 'Theme' });
    await expect(theme).toHaveValue('system');

    await theme.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue(
      'light',
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark');
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

    await page.getByRole('button', { name: 'Play Easy' }).click();
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

    await page.getByRole('button', { name: 'New puzzle' }).click();
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
    await page.getByRole('button', { name: /Start new .* puzzle/ }).click();
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
    await expect(page.locator('.connection')).toHaveText('Game service ready');
    await expect(page.locator('.board-preview span')).toHaveCount(81);
    await expect(page.locator('.board-preview span')).toHaveText(
      Array.from(puzzle, (value) => (value === '.' ? '' : value)),
    );
    if (viewport.width <= 600) {
      await expect(page.locator('.preview-card')).toBeHidden();
    } else {
      await expect(page.locator('.preview-card')).toBeVisible();
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
    await page.getByRole('button', { name: 'Play Hard' }).click();

    await expect(
      page.getByRole('heading', { name: 'Your puzzle' }),
    ).toBeVisible();
    await expect(page.getByRole('gridcell')).toHaveCount(81);
    await expect(page.getByText('Hard puzzle ready.')).toBeVisible();
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
    api.setRestoreDelay(250);
    await page.reload();
    await expect(page.getByText('Loading your puzzle…')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'A clear board. A quieter mind.' }),
    ).toHaveCount(0);
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex + 6}.png`
        : testInfo.outputPath(`restore-loading-${viewport.width}.png`),
      fullPage: true,
    });
    await expect(
      page.getByText('Puzzle paused', { exact: true }),
    ).toBeVisible();
    api.setRestoreDelay(0);
    await expect(
      page.getByText('Your active puzzle was restored.'),
    ).toBeVisible();
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
    await page.getByRole('heading', { name: 'Your puzzle' }).click();
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
    await page.getByRole('heading', { name: 'Your puzzle' }).click();
    await page.getByRole('button', { name: 'New puzzle' }).focus();
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
      for (const digit of ['5', '2', '9']) {
        buttons.find((button) => button.textContent === digit)?.click();
      }
    });
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, notes 2, 5, 9',
      }),
    ).toContainText('259');
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsBeforeRapidNotes + 1);
    expect(api.actions().at(-1)).toEqual({
      kind: 'set-notes',
      values: [2, 5, 9],
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

    const givenFive = page.getByRole('gridcell', {
      name: 'Row 1, column 2, given 5',
    });
    await givenFive.click();
    await expect(givenFive).toHaveClass(/game-cell--selected/);
    await expect(givenFive).not.toHaveClass(/game-cell--peer/);
    await expect(givenFive).not.toHaveClass(/game-cell--matching/);
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
    await expect(matchingNote).toHaveText('5');
    await expect(matchingNote).toHaveCSS(
      'background-color',
      'rgb(200, 224, 214)',
    );
    await page.keyboard.press('ArrowLeft');
    await expect(secondOpenCell.locator('.cell-note--matching')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(givenFive).toBeFocused();
    await expect(secondOpenCell.locator('.cell-note--matching')).toHaveText(
      '5',
    );
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${screenshotIndex + 8}.png`
        : testInfo.outputPath(`matching-note-${viewport.width}.png`),
      fullPage: true,
    });

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
  test(`shows opt-in automatic candidates at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const api = await mockGameApi(page, {
      row: 1,
      column: 4,
      values: [2, 6],
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Easy' }).click();

    const toggle = page.getByRole('button', {
      name: 'Automatic candidates off',
    });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }),
    ).toBeVisible();
    const requestsBeforeToggle = api.actionRequests();
    await toggle.click();

    const automaticCell = page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty, automatic candidates 1, 3, 8',
    });
    await expect(automaticCell).toContainText('138');
    await expect(automaticCell.locator('.cell-notes')).toHaveClass(
      /cell-notes--automatic/,
    );
    await expect(automaticCell.locator('.cell-notes')).toHaveCSS(
      'color',
      'rgb(123, 133, 130)',
    );
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, automatic candidates 2, 5, 9',
      }),
    ).toContainText('259');
    await expect.poll(() => api.actionRequests()).toBe(requestsBeforeToggle);

    await page.getByRole('button', { name: 'Automatic candidates on' }).click();
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, notes 2, 6',
      }),
    ).toContainText('26');
    await expect.poll(() => api.actionRequests()).toBe(requestsBeforeToggle);
    await page
      .getByRole('button', { name: 'Automatic candidates off' })
      .click();
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, automatic candidates 2, 5, 9',
      }),
    ).toContainText('259');

    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Automatic candidates on' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(automaticCell).toContainText('138');

    await page
      .getByRole('gridcell', {
        name: 'Row 1, column 4, empty, automatic candidates 2, 5, 9',
      })
      .click();
    await page.getByRole('button', { name: 'Notes off' }).click();
    await expect(page.getByRole('button', { name: 'Erase' })).toBeDisabled();
    await page.getByRole('button', { name: 'Add or remove note 5' }).click();
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsBeforeToggle + 1);
    expect(api.actions().at(-1)).toEqual({
      kind: 'adopt-candidates-as-notes',
      value: 5,
    });
    await expect(
      page.getByRole('button', { name: 'Automatic candidates off' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, notes 2, 9',
      }),
    ).toContainText('29');
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 1, empty, notes 1, 3, 8',
      }),
    ).toContainText('138');
    await expect(page.getByText('Candidates copied. Notes on.')).toBeVisible();
    const pauseButton = page.getByRole('button', { name: 'Pause' });
    const newPuzzleButton = page.getByRole('button', { name: 'New puzzle' });
    if (viewport.width <= 520) {
      const [pauseBox, newPuzzleBox] = await Promise.all([
        pauseButton.boundingBox(),
        newPuzzleButton.boundingBox(),
      ]);
      expect(pauseBox).not.toBeNull();
      expect(newPuzzleBox).not.toBeNull();
      expect(pauseBox?.width).toBeCloseTo(newPuzzleBox?.width ?? 0, 0);
      expect(pauseBox?.height).toBeCloseTo(newPuzzleBox?.height ?? 0, 0);
    }
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${viewport.width > 760 ? 37 : viewport.width === 390 ? 38 : 39}.png`
        : testInfo.outputPath(`adopted-candidates-${viewport.width}.png`),
      fullPage: true,
    });

    await page.getByRole('button', { name: 'Undo' }).click();
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsBeforeToggle + 2);
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, notes 2, 6',
      }),
    ).toContainText('26');
    await page.getByRole('button', { name: 'Redo' }).click();
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsBeforeToggle + 3);
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 4, empty, notes 2, 9',
      }),
    ).toContainText('29');

    await page.getByRole('heading', { name: 'Your puzzle' }).click();
    await page.keyboard.press('a');
    await expect(
      page.getByRole('button', { name: 'Automatic candidates on' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('a');
    await expect(
      page.getByRole('button', { name: 'Automatic candidates off' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect
      .poll(() => api.actionRequests())
      .toBe(requestsBeforeToggle + 3);

    await page.getByRole('button', { name: 'New puzzle' }).click();
    await page.getByRole('button', { name: /^Start new .* puzzle$/ }).click();
    await expect(
      page.getByRole('button', { name: 'Automatic candidates off' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }),
    ).toBeVisible();
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${viewport.width > 760 ? 34 : viewport.width === 390 ? 35 : 36}.png`
        : testInfo.outputPath(`new-puzzle-defaults-${viewport.width}.png`),
      fullPage: true,
    });

    await page
      .getByRole('button', { name: 'Automatic candidates off' })
      .click();
    const toolLayout = await page.locator('.tool-grid').evaluate((grid) => ({
      labels: Array.from(grid.querySelectorAll('.tool-label')).map(
        (label) => getComputedStyle(label).display,
      ),
      icons: grid.querySelectorAll('.tool-icon').length,
      activeIconColor: getComputedStyle(
        grid.querySelector('.tool-active .tool-icon')!,
      ).color,
      controlsFit: Array.from(grid.querySelectorAll('button')).every(
        (button) => button.scrollWidth <= button.clientWidth,
      ),
    }));
    expect(toolLayout.icons).toBe(6);
    expect(toolLayout.activeIconColor).toBe('rgb(255, 255, 255)');
    expect(toolLayout.controlsFit).toBe(true);
    expect(new Set(toolLayout.labels)).toEqual(
      new Set([viewport.width <= 520 ? 'none' : 'block']),
    );
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/screenshot-${viewport.width > 760 ? 31 : viewport.width === 390 ? 32 : 33}.png`
        : testInfo.outputPath(`automatic-candidates-${viewport.width}.png`),
      fullPage: true,
    });
  });
}

test('preserves note input entered while an earlier save is in flight', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  api.setActionDelay(500);
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Easy' }).click();
  await page.getByRole('gridcell', { name: 'Row 1, column 1, empty' }).click();
  await page.getByRole('button', { name: 'Notes off' }).click();

  await page.keyboard.press('1');
  await page.keyboard.press('2');
  await page.keyboard.press('3');
  await expect.poll(() => api.actionRequests()).toBe(1);
  await page.keyboard.press('4');
  await expect(
    page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty, notes 1, 2, 3, 4',
    }),
  ).toContainText('1234');

  await expect.poll(() => api.actionRequests()).toBe(2);
  await expect
    .poll(() => api.actions().at(-1))
    .toEqual({
      kind: 'set-notes',
      values: [1, 2, 3, 4],
    });
  await expect(
    page.getByRole('gridcell', {
      name: 'Row 1, column 1, empty, notes 1, 2, 3, 4',
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

for (const method of ['keyboard', 'mouse', 'touchscreen'] as const) {
  test(`preserves candidate adoption followed by immediate 1, 2, 3 notes with ${method}`, async ({
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

    const play = page.getByRole('button', { name: 'Play Easy' });
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

    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Automatic candidates off' }),
      'a',
    );
    await expect(targetCell).toHaveAccessibleName(
      'Row 1, column 6, empty, automatic candidates 6',
    );
    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Notes off' }),
      'n',
    );
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
        name: 'Row 1, column 6, empty, notes 1, 2, 3, 6',
      }),
    ).toContainText('1236');
    await expect.poll(() => api.actionRequests()).toBe(2);
    await expect
      .poll(() => api.actions().slice(-2))
      .toEqual([
        { kind: 'adopt-candidates-as-notes', value: 1 },
        { kind: 'set-notes', values: [1, 2, 3, 6] },
      ]);
    await expect.poll(() => api.completedActions()).toBe(2);

    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? `${process.env.SCREENSHOT_DIR}/rapid-candidate-adoption-123-${method}.png`
        : testInfo.outputPath(`rapid-candidate-adoption-123-${method}.png`),
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
    const api = await mockGameApi(page);
    api.setActionDelay(500);
    await page.goto('/');

    const play = page.getByRole('button', { name: 'Play Easy' });
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
        name: 'Row 1, column 1, empty, notes 4',
      }),
    ).toContainText('4');
    await expect.poll(() => api.actionRequests()).toBe(1);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({
        kind: 'set-notes',
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
        kind: 'set-notes',
        values: [],
      });
    await expect.poll(() => api.completedActions()).toBe(2);

    await activateWith(page, method, noteFour, '4');
    await activateWith(page, method, noteFive, '5');
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 1, empty, notes 4, 5',
      }),
    ).toContainText('45');
    await expect.poll(() => api.actionRequests()).toBe(3);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({
        kind: 'set-notes',
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
        name: 'Row 1, column 1, empty, notes 4, 5, 6',
      }),
    ).toContainText('456');
    await expect.poll(() => api.actionRequests()).toBe(4);
    await expect
      .poll(() => api.actions().at(-1))
      .toEqual({
        kind: 'set-notes',
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
      .toEqual({ kind: 'set-notes', values: [] });
    await expect.poll(() => api.completedActions()).toBe(5);

    const candidatesToggle = page.getByRole('button', {
      name: 'Automatic candidates off',
    });
    await activateWith(page, method, candidatesToggle, 'a');
    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Add or remove note 1' }),
      '1',
    );
    // While adoption is still pending, add a digit that was not in the
    // candidate grid. The initiating action removes candidate 1; the rapid
    // follow-up must survive as a new manual note in the final complete set.
    await activateWith(
      page,
      method,
      page.getByRole('button', { name: 'Add or remove note 4' }),
      '4',
    );
    await expect(
      page.getByRole('gridcell', {
        name: 'Row 1, column 1, empty, notes 3, 4, 8',
      }),
    ).toContainText('348');
    await expect.poll(() => api.actionRequests()).toBe(7);
    await expect
      .poll(() => api.actions().slice(-2))
      .toEqual([
        { kind: 'adopt-candidates-as-notes', value: 1 },
        { kind: 'set-notes', values: [3, 4, 8] },
      ]);
    await expect.poll(() => api.completedActions()).toBe(7);

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
    await expect.poll(() => api.actionRequests()).toBe(8);
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
    await expect.poll(() => api.actionRequests()).toBe(9);
    await expect.poll(() => api.completedActions()).toBe(9);
    const validValueCell = page.getByRole('gridcell', {
      name: 'Row 1, column 8, 9',
    });
    await expect(validValueCell).not.toHaveAttribute('aria-invalid', 'true');

    await activateWith(page, method, erase, 'Delete');
    await expect(
      page.getByRole('gridcell', { name: 'Row 1, column 8, empty' }),
    ).toBeVisible();
    await expect.poll(() => api.actionRequests()).toBe(10);
    await expect.poll(() => api.completedActions()).toBe(10);
    expect(api.actions().at(-1)).toEqual({ kind: 'clear-value' });

    const undo = page.getByRole('button', { name: 'Undo' });
    await activateWith(page, method, undo, 'Control+z');
    await expect.poll(() => api.actionRequests()).toBe(11);
    await expect.poll(() => api.completedActions()).toBe(11);
    expect(api.actions().at(-1)).toEqual({ kind: 'undo' });
    const redo = page.getByRole('button', { name: 'Redo' });
    await activateWith(page, method, redo, 'Control+Shift+z');
    await expect.poll(() => api.actionRequests()).toBe(12);
    await expect.poll(() => api.completedActions()).toBe(12);
    expect(api.actions().at(-1)).toEqual({ kind: 'redo' });
    expect(api.expectedRevisions()).toEqual(
      Array.from({ length: 12 }, (_, index) => index),
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
  await expect(page.locator('.connection')).toHaveText('Game service ready');
  await page.getByRole('button', { name: 'Play Easy' }).click();
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
  await expect(page.locator('.connection')).toHaveText('Game service ready');
  await page.getByRole('button', { name: 'Play Easy' }).click();

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
  await expect(page.locator('.connection')).toHaveText('Game service ready');

  const expertButton = page.getByRole('button', {
    name: 'Expert',
    exact: true,
  });
  await expertButton.click();
  await expect(expertButton).toHaveAttribute('aria-pressed', 'true');
  await expertButton.hover();
  await expect(expertButton).toHaveCSS('background-color', 'rgb(32, 42, 47)');
  await expect(expertButton).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Play Expert' })).toBeVisible();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-12.png`
      : testInfo.outputPath('selected-welcome-difficulty.png'),
    fullPage: true,
  });

  await page.reload();

  await expect(page.locator('.connection')).toHaveText('Game service ready');
  await expect(expertButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Play Expert' })).toBeVisible();
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
  await expect(page.locator('.connection')).toHaveText('Game service ready');
  await page.getByRole('button', { name: 'Play Easy' }).click();
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
  await page.getByRole('button', { name: 'Return to front page' }).click();
  await expect(homeDialog).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'A clear board. A quieter mind.' }),
  ).toBeVisible();
  await expect.poll(() => api.sessionRequests()).toBe(1);

  await page.getByRole('button', { name: 'Play Easy' }).click();
  await expect.poll(() => api.sessionRequests()).toBe(2);

  await page.getByRole('button', { name: 'New puzzle' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Start a new puzzle' });
  await expect(dialog).toBeVisible();
  const keepPlaying = page.getByRole('button', { name: 'Keep playing' });
  const confirmNewPuzzle = page.getByRole('button', {
    name: 'Start new Easy puzzle',
  });
  await expect(keepPlaying).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(confirmNewPuzzle).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Easy', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirmNewPuzzle).toBeFocused();
  await expect.poll(() => api.sessionRequests()).toBe(2);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-8.png`
      : testInfo.outputPath('new-puzzle-confirmation.png'),
    fullPage: true,
  });

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'New puzzle' })).toBeFocused();
  await expect(page.getByRole('grid')).toBeVisible();
  await expect.poll(() => api.sessionRequests()).toBe(2);

  await page.getByRole('button', { name: 'New puzzle' }).click();
  await page.getByRole('button', { name: 'Hard' }).click();
  api.setSessionDelay(700);
  await page.getByRole('button', { name: 'Start new Hard puzzle' }).click();
  await expect.poll(() => api.sessionRequests()).toBe(3);
  const loadingState = page.getByRole('status', {
    name: 'Preparing your Hard board…',
  });
  await expect(loadingState).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'New puzzle' })).toHaveCount(0);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-22.png`
      : testInfo.outputPath('new-puzzle-loading.png'),
    fullPage: true,
  });
  await expect(dialog).toHaveCount(0);
  await expect(loadingState).toHaveCount(0);
  await expect(page.getByText('Hard puzzle ready.')).toBeVisible();
  expect(api.requestedDifficulties()).toEqual(['easy', 'easy', 'hard']);
});

test('shows rapid values immediately and commits them in revision order', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveText('Game service ready');
  await page.getByRole('button', { name: 'Play Easy' }).click();
  api.setActionDelay(800);

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

  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-24.png`
      : testInfo.outputPath('serialized-authoritative-values.png'),
    fullPage: true,
  });
});

test('keeps elapsed time independent from rapid game actions', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await expect(page.locator('.connection')).toHaveText('Game service ready');
  await page.getByRole('button', { name: 'Play Easy' }).click();
  await expect(page.getByLabel('Elapsed time')).toHaveText('0:00');

  api.setActionDelay(300);
  const hintButton = page.getByRole('button', { name: 'Reveal a hint' });
  for (let request = 0; request < 5; request += 1) {
    await hintButton.click();
    await expect.poll(() => api.actionRequests()).toBe(request + 1);
    await expect(hintButton).toBeEnabled();
  }

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
  await expect(page.locator('.connection')).toHaveText('Game service ready');
  await page.getByRole('button', { name: 'Play Easy' }).click();
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

  await page.getByRole('button', { name: 'Play another Easy' }).click();
  await expect.poll(() => api.sessionRequests()).toBe(2);
  await expect(page.getByText('Easy puzzle ready.')).toBeVisible();

  api.setNextStatus('solved');
  await page.getByRole('gridcell', { name: 'Row 1, column 4, empty' }).click();
  await page.keyboard.press('3');
  await expect(page.getByRole('heading', { name: /Solved in/ })).toBeFocused();
  await page.getByRole('button', { name: 'Choose another level' }).click();
  await expect(
    page.getByRole('heading', { name: 'A clear board. A quieter mind.' }),
  ).toBeVisible();
});

test('moves rapid click-and-keyboard input away from an invalid cell', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Easy' }).click();

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
  await page.getByRole('button', { name: 'Play Easy' }).click();

  const entries = [
    { row: 1, column: 1, value: 1 },
    { row: 1, column: 4, value: 2 },
    { row: 1, column: 6, value: 3 },
    { row: 1, column: 8, value: 4 },
  ];

  for (const [index, entry] of entries.entries()) {
    const cell = page.getByRole('gridcell', {
      name: `Row ${entry.row}, column ${entry.column}, empty`,
    });
    if (index === 1) {
      await cell.dispatchEvent('pointerdown', {
        pointerType: 'mouse',
        buttons: 1,
      });
      await expect(cell).toHaveAttribute('aria-selected', 'true');
      await page.waitForTimeout(200);
    }
    await cell.click();
    await expect(cell).toBeFocused();
    await page.waitForTimeout(200);
    await page.keyboard.press(String(entry.value));
    await page.waitForTimeout(200);
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
