import {
  expect,
  hintStrategy,
  messageDescriptor,
  mockGameApi,
  strategySummary,
  test,
} from './app-shell.support';

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
  const narration = page.locator('.hint-step > p:not(.hint-step__count)');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(narration).toContainText(
    /start this cell again from the accepted values/i,
  );
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(narration).toContainText(
    /every digit allowed by its row, column, and box/i,
  );
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

test('uses repeated H presses to open, advance, and apply one hint', async ({
  page,
}, testInfo) => {
  const api = await mockGameApi(page);
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await expect(
    page.getByRole('button', { name: 'Reveal a hint' }),
  ).toBeEnabled();

  await page.keyboard.press('h');
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  expect(api.actionRequests()).toBe(0);

  await page.keyboard.press('h');
  await expect(page.getByText('Step 2 of 2')).toBeVisible();
  expect(api.actionRequests()).toBe(0);
  await page.screenshot({
    path: process.env.SCREENSHOT_DIR
      ? `${process.env.SCREENSHOT_DIR}/screenshot-0.png`
      : testInfo.outputPath('repeat-h-final-step.png'),
    fullPage: true,
  });

  await page.keyboard.press('h');
  await expect.poll(() => api.actionRequests()).toBe(1);
  expect(api.actions()).toEqual([
    { kind: 'apply-hint', plan_id: 'a'.repeat(64) },
  ]);
  await expect(page.getByLabel('Row 1, column 1, 1')).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Hint' })).toBeVisible();
  await expect(page.getByText('Hidden single', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Easy strategy')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Hint' })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Candidates on' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('h');
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
  await expect(page.getByText('In row 1, check where 1 can go.')).toBeVisible();
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
  await expect(
    page.getByText(/Place 1 in row 1, column 1.*Hidden Single/),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Hidden single' }),
  ).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Easy strategy',
  );
  await expect(
    page.getByLabel(/Row 1, column 1, empty, candidates .*hint conclusion/),
  ).toHaveClass(/game-cell--hint-conclusion/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hint' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Step 2 of 2')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Hidden single' }),
  ).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Easy strategy',
  );
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
          kind: 'strategy',
          title: messageDescriptor('strategy.xy-chain.name', 'XY-Chain'),
          strategy: hintStrategy('xy-chain', 'XY-Chain', 'Evil'),
          summary: strategySummary(
            'xy-chain',
            2,
            'The chain removes candidate 1.',
          ),
          steps: [
            {
              id: 'trace-chain',
              kind: 'observe',
              message: messageDescriptor(
                'hint.xy-chain.start',
                'Trace the top-row chain.',
                [
                  { name: 'cell', kind: 'cell', cell: { row: 1, column: 1 } },
                  { name: 'first_digit', kind: 'digit', digit: 1 },
                  { name: 'second_digit', kind: 'digit', digit: 3 },
                  { name: 'endpoint_digit', kind: 'digit', digit: 1 },
                  { name: 'other_digit', kind: 'digit', digit: 3 },
                ],
              ),
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
              kind: 'apply',
              message: messageDescriptor(
                'hint.xy-chain.place',
                'The chain places 2.',
                [
                  {
                    name: 'first_endpoint',
                    kind: 'cell',
                    cell: { row: 1, column: 1 },
                  },
                  {
                    name: 'second_endpoint',
                    kind: 'cell',
                    cell: { row: 1, column: 9 },
                  },
                  { name: 'endpoint_digit', kind: 'digit', digit: 1 },
                  { name: 'cell', kind: 'cell', cell: { row: 1, column: 4 } },
                  { name: 'digit', kind: 'digit', digit: 2 },
                  { name: 'strategy', kind: 'strategy', strategy: 'xy-chain' },
                ],
              ),
              marks: [
                {
                  target: {
                    kind: 'cell',
                    row: 1,
                    column: 4,
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
                kind: 'place-value',
                placement: { row: 1, column: 4, value: 2 },
              },
            },
          ],
          conclusion: {
            kind: 'place-value',
            placement: { row: 1, column: 4, value: 2 },
          },
        },
      },
    }),
  );

  await page.goto('./');
  await page.getByRole('button', { name: 'Start Easy puzzle' }).click();
  await page.getByRole('button', { name: 'Reveal a hint' }).click();
  await expect(page.getByText(/has only candidates 1 and 3/)).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Hint' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Hint' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toHaveCount(0);
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
  await expect(page.getByRole('heading', { name: 'Hint' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Hint' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Naked pair' })).toBeVisible();
  await expect(page.locator('.hint-strategy-reveal')).toContainText(
    'Medium strategy',
  );

  api.staleNextHintAction();
  api.setHintDelay(700);
  await page.getByRole('button', { name: 'Apply hint' }).click();
  await expect(
    page.getByRole('status', { name: 'Refreshing hint…' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Naked pair' })).toBeVisible();

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
