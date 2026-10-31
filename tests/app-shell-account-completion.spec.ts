import {
  emptyBooleanGrid,
  emptyDigitSetGrid,
  expect,
  gridFromPuzzle,
  mockGameApi,
  test,
} from './app-shell.support';

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
  await expect(
    page.getByText('The request could not be completed.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Retry move' }).click();
  await expect(
    page.getByRole('gridcell', { name: 'Row 1, column 1, 1, invalid' }),
  ).toBeVisible();
  api.setNextStatus('solved');
  await page
    .getByRole('gridcell', { name: 'Row 1, column 1, 1, invalid' })
    .click();
  await page.keyboard.press('2');
  await expect(page.getByText('Solved! Beautiful work.')).toBeVisible();
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
  let releaseClaim: (() => void) | undefined;
  const claimGate = new Promise<void>((resolve) => {
    releaseClaim = resolve;
  });
  let bulkDeleteRequests = 0;
  let releaseBulkDelete: (() => void) | undefined;
  const bulkDeleteGate = new Promise<void>((resolve) => {
    releaseBulkDelete = resolve;
  });

  await page.route('**/api/v1/account/games', async (route) => {
    if (route.request().method() === 'DELETE') {
      bulkDeleteRequests += 1;
      expect(route.request().headers()['x-sudoku-csrf']).toBe('csrf-proof');
      await bulkDeleteGate;
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
    await claimGate;
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

  await expect(
    page.getByRole('status', {
      name: 'Saving your puzzle to your account…',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Easy puzzle' })).toBeHidden();
  expect(claimRequests).toBe(1);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-account-claim-pending.png`
      : testInfo.outputPath('account-claim-pending.png'),
    fullPage: true,
  });
  releaseClaim?.();
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
  const revoke = page.getByRole('button', { name: 'Sign out everywhere' });
  await revoke.click();
  const revokeDialog = page.getByRole('alertdialog', {
    name: 'Sign out everywhere',
  });
  await expect(revokeDialog).toContainText('saved games remain');
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
  await expect(bulkDeleteDialog).toBeVisible();
  await expect(
    bulkDeleteDialog.getByRole('button', { name: 'Deleting all games…' }),
  ).toBeDisabled();
  await expect(
    bulkDeleteDialog.getByRole('button', { name: 'Cancel' }),
  ).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(bulkDeleteDialog).toBeVisible();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-account-delete-pending.png`
      : testInfo.outputPath('account-delete-pending.png'),
    fullPage: true,
  });
  releaseBulkDelete?.();
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
