import {
  boardGeometry,
  expect,
  mockGameApi,
  puzzle,
  storedGuestState,
  test,
} from './app-shell.support';

test('names and locks delayed welcome puzzle creation', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');

  api.setSessionDelay(700);
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();

  const starting = page.getByRole('button', {
    name: 'Starting Easy puzzle…',
  });
  await expect(starting).toBeDisabled();
  await expect(starting).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.welcome-message')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Hard', exact: true }),
  ).toBeDisabled();
  await starting.click({ force: true });
  await expect.poll(() => api.sessionRequests()).toBe(1);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-welcome-starting-puzzle.png`
      : testInfo.outputPath('welcome-starting-puzzle.png'),
    fullPage: true,
  });

  await expect(page.getByRole('grid')).toBeVisible();
  expect(api.requestedDifficulties()).toEqual(['easy']);
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
