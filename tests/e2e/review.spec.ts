import { test, expect } from '@playwright/test';

test('Everything includes the complete bank; Easy recognition and optional timers work', async ({
  page,
}) => {
  await page.goto('/#quiz');
  await page.getByRole('button', { name: 'Everything · 272 questions', exact: true }).click();
  await expect(page.locator('.battle-title h1')).toHaveText('Everything');
  await expect(page.locator('.question-count')).toContainText('/ 272');
  await page.getByRole('button', { name: 'Leave round · answers already saved' }).click();
  await page.getByRole('button', { name: 'EASY Recognition & basics', exact: true }).click();
  await page.getByRole('checkbox', { name: /Timed rounds/ }).check();
  await page.getByRole('button', { name: 'Begin trial', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(4);
  await page.getByRole('button', { name: 'Pause timer', exact: true }).click();
  await expect(page.getByRole('radio').first()).toBeDisabled();
  const paused = await page.locator('.timer').innerText();
  await page.waitForTimeout(1200);
  expect(await page.locator('.timer').innerText()).toBe(paused);
  await page.getByRole('button', { name: 'Resume timer', exact: true }).click();
  await page.getByRole('radio').first().click();
  await expect(page.locator('.answer-reveal')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'test-results/arena-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  await expect(page.locator('.answer-reveal')).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('franklin-path-to-print-v1')!),
  );
  expect(Object.keys(saved.history)).toHaveLength(1);
});

test('flashcards, filtered collections and location drills are interactive', async ({ page }) => {
  await page.goto('/#study');
  await page.getByLabel('Flashcard category').selectOption('Books');
  const prompt = await page.locator('.flashcard h2').innerText();
  await page.getByRole('button', { name: 'Reveal flashcard answer', exact: true }).click();
  await expect(page.locator('.flashcard')).toHaveClass(/flipped/);
  await page.getByRole('button', { name: 'Next card', exact: true }).click();
  await expect(page.locator('.flashcard h2')).not.toHaveText(prompt);
  await page.goto('/#collection');
  await page.getByRole('checkbox', { name: 'Study all cards', exact: true }).check();
  await page.getByLabel('Card category').selectOption('Books');
  await page.locator('.memory-card').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.card-back')).toContainText('Related people');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.goto('/#map');
  await page.locator('.map-pin').filter({ hasText: 'London' }).click();
  await expect(page.locator('.place-panel h2')).toHaveText('London');
  await page.getByRole('button', { name: 'Recall this place', exact: true }).click();
  await expect(page.locator('.question-card')).toBeVisible();
  await expect(page.locator('.battle-title h1')).toContainText('London');
});
