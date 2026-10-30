import { expect, test } from '@playwright/test';

const expectedStrategies = new Set([
  'Naked Single',
  'Hidden Single',
  'Naked Pair',
  'Naked Triple',
  'Pointing Pairs / Box-Line Reduction',
  'Hidden Pair',
  'X-Wing',
  'XY-Wing',
  'Hidden Triple',
  'W-Wing',
  'Swordfish',
  'Naked Quad',
  'Simple Coloring',
  'Hidden Quad',
  'XYZ-Wing',
  'Jellyfish',
  'BUG+1',
  'Unique Rectangle Type 1',
  'Unique Rectangle Type 2',
  'Unique Rectangle Type 3',
  'Unique Rectangle Type 4',
  'X-Cycles',
  'XY-Chain',
]);

test('solves the real-stack fixture corpus and covers every strategy', async ({
  page,
}, testInfo) => {
  const observed = new Set<string>();
  await page.goto('./');
  await page
    .getByRole('button', { name: 'Start Easy puzzle' })
    .click({ force: true });

  for (let game = 0; game < 9; game += 1) {
    let hints = 0;
    while ((await page.locator('#completion-title').count()) === 0) {
      if (hints >= 128) throw new Error(`game ${game + 1} exceeded 128 hints`);
      await page
        .getByRole('button', { name: 'Reveal a hint' })
        .click({ force: true });
      const panel = page.locator('.hint-panel');
      await expect(panel.getByRole('heading', { name: 'Hint' })).toBeVisible();
      await expect(panel.locator('.hint-strategy-reveal')).toHaveCount(0);
      while (await panel.getByRole('button', { name: 'Next' }).isVisible()) {
        await panel
          .getByRole('button', { name: 'Next' })
          .click({ force: true });
      }
      const strategyHeading = panel.locator('.hint-strategy-name');
      const strategyGrade = panel.locator('.hint-strategy-grade');
      await expect(strategyHeading).not.toHaveText('Hint');
      await expect(strategyGrade).toContainText(/strategy$/);
      const strategy = (await strategyHeading.textContent())?.trim();
      if (!strategy)
        throw new Error(`game ${game + 1} exposed no strategy name`);
      observed.add(strategy);
      await expect(strategyGrade).toContainText(/strategy$/);
      await panel
        .getByRole('button', { name: 'Apply hint' })
        .click({ force: true });
      await expect(panel).toHaveCount(0);
      hints += 1;
    }
    await expect(page.locator('#completion-title')).toContainText('Solved in');
    if (game === 0 || game === 8) {
      await page.screenshot({
        path: testInfo.outputPath(`real-stack-complete-${game + 1}.png`),
        fullPage: true,
      });
    }
    if (game < 8) {
      await page
        .getByRole('button', { name: /Play another/ })
        .click({ force: true });
      await expect(page.locator('#completion-title')).toHaveCount(0);
    }
  }

  expect([...observed].sort()).toEqual([...expectedStrategies].sort());
});
