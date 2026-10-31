import {
  activateWith,
  burstHistoryActivation,
  expect,
  mockGameApi,
  test,
} from './app-shell.support';

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
