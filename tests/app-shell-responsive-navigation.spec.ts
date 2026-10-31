import {
  expect,
  mockGameApi,
  storedGuestState,
  test,
} from './app-shell.support';

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
  let releaseDeploymentCheck = () => undefined;
  const deploymentCheckPending = new Promise<void>((resolve) => {
    releaseDeploymentCheck = resolve;
  });
  await page.route('/', async (route) => {
    if (route.request().headers()['x-sudoku-deployment-check'] !== '1') {
      await route.continue();
      return;
    }
    deploymentChecks += 1;
    await deploymentCheckPending;
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><script type="module" src="/assets/index-new.js"></script>',
    });
  });
  const reloaded = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Return to front page' }).click();
  await expect(
    page.getByRole('status', { name: 'Returning to the front page…' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Choose your difficulty' }),
  ).toHaveCount(0);
  expect((await storedGuestState(page)).record).toBeUndefined();
  releaseDeploymentCheck();
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

test('names and locks delayed hint and replay transactions', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();

  api.setHintDelay(700);
  await page.getByRole('button', { name: 'Reveal a hint' }).click();
  await expect(
    page.getByRole('status', { name: 'Preparing hint…' }),
  ).toBeVisible();
  await expect(page.getByRole('grid')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start over' })).toBeDisabled();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-preparing-hint.png`
      : testInfo.outputPath('preparing-hint.png'),
    fullPage: true,
  });
  await expect(page.getByRole('heading', { name: 'Hint' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toHaveCount(0);

  await page.getByRole('button', { name: 'Next' }).click();
  api.setActionDelay(700);
  await page.getByRole('button', { name: 'Apply hint' }).click();
  const applying = page.getByRole('button', { name: 'Applying hint…' });
  await expect(applying).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Close' })).toBeDisabled();
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-applying-hint.png`
      : testInfo.outputPath('applying-hint.png'),
    fullPage: true,
  });
  await page.keyboard.press('Enter');
  await expect.poll(() => api.actionRequests()).toBe(1);
  await expect(page.locator('.hint-panel')).toHaveCount(0);

  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: 'Replay this puzzle' }).click();
  await expect(
    page.getByRole('status', { name: 'Restarting this puzzle…' }),
  ).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-restarting-puzzle.png`
      : testInfo.outputPath('restarting-puzzle.png'),
    fullPage: true,
  });
  await expect.poll(() => api.actions().at(-1)).toEqual({ kind: 'restart' });
  await expect(page.getByRole('grid')).toBeVisible();
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
