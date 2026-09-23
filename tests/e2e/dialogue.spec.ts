import { test, expect, type Page } from '@playwright/test';
import { questions } from '../../src/data/questions';
import { multipleChoice } from '../../src/lib/choices';

declare global {
  interface Window {
    testVoice: {
      lines: SpeechSynthesisUtterance[];
      current: SpeechSynthesisUtterance | null;
      cancelled: number;
      finish: () => void;
      gains: number[];
    };
  }
}
const saveKey = 'franklin-path-to-print-v1';
async function controlledVoice(page: Page) {
  await page.addInitScript(() => {
    window.testVoice = {
      lines: [],
      current: null,
      cancelled: 0,
      gains: [],
      finish() {
        const line = this.current;
        this.current = null;
        line?.onend?.call(line, new Event('end') as SpeechSynthesisEvent);
      },
    };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [],
        resume: () => {},
        get speaking() {
          return !!window.testVoice.current;
        },
        cancel() {
          window.testVoice.current = null;
          window.testVoice.cancelled++;
        },
        speak(line: SpeechSynthesisUtterance) {
          window.testVoice.lines.push(line);
          window.testVoice.current = line;
          queueMicrotask(() =>
            line.onstart?.call(line, new Event('start') as SpeechSynthesisEvent),
          );
        },
      },
    });
    const gain = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function (value, start, constant) {
      window.testVoice.gains.push(value);
      return gain.call(this, value, start, constant);
    };
  });
}

test('spoken conversations reveal text, skip, replay, hold, auto-advance and duck music', async ({
  page,
}) => {
  await controlledVoice(page);
  await page.goto('/#home');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.compact-conversation')).toHaveCount(0);
  await page.keyboard.press('e');
  const dialogue = page.locator('.platform-dialogue');
  await expect(dialogue).toBeVisible();
  await expect(dialogue.locator('.conversation-heading')).toContainText('1 / 2');
  const total = await dialogue.locator('.talk-letter').count();
  expect(await dialogue.locator('.talk-letter.revealed').count()).toBeLessThan(total);
  await dialogue.getByRole('button', { name: 'Reveal full line' }).click();
  await expect(dialogue.locator('.talk-letter.revealed')).toHaveCount(total);
  await expect.poll(() => page.evaluate(() => window.testVoice.gains.includes(0.022))).toBe(true);
  await dialogue.getByRole('button', { name: 'Auto', exact: true }).click();
  await page.evaluate(() => window.testVoice.finish());
  await expect(dialogue.locator('.conversation-heading')).toContainText('1 / 2');
  await dialogue.getByRole('button', { name: 'Replay this line' }).click();
  await expect.poll(() => page.evaluate(() => !!window.testVoice.current)).toBe(true);
  await dialogue.getByRole('button', { name: 'Next line' }).click();
  await expect(dialogue.locator('.conversation-heading')).toContainText('2 / 2');
  await dialogue.getByRole('button', { name: 'Hold', exact: true }).click();
  // A cancelled engine callback must never advance the newer line.
  await page.evaluate(() => {
    const stale = window.testVoice.lines.at(-2)!;
    stale.onend?.call(stale, new Event('end') as SpeechSynthesisEvent);
  });
  await expect(dialogue.locator('.conversation-heading')).toContainText('2 / 2');
  await page.evaluate(() => window.testVoice.finish());
  await expect(dialogue.getByRole('button', { name: 'Let’s go', exact: true })).toBeVisible();
  await dialogue.getByRole('button', { name: 'Mute narration' }).click();
  expect(await page.evaluate(() => !!window.testVoice.current)).toBe(false);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).settings.narration,
      saveKey,
    ),
  ).toBe(false);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.goto('/#settings');
  await expect(page.getByRole('switch', { name: /Spoken dialogue/ })).not.toBeChecked();
});

test('questions speak choices and score immediately from keys without a confidence step', async ({
  page,
}) => {
  await controlledVoice(page);
  await page.goto('/#exam');
  const card = page.locator('.question-card');
  const prompt = await card.locator(':scope > h2').innerText();
  const question = questions.map(multipleChoice).find((q) => q.prompt === prompt)!;
  const options = await card.locator('.answer-option-text').allTextContents();
  expect(options.length).toBeGreaterThanOrEqual(2);
  expect(options.length).toBeLessThanOrEqual(4);
  await expect(card.locator('input, textarea, select')).toHaveCount(0);
  await expect(card.getByText(/How sure|confidence|Commit answer/i)).toHaveCount(0);
  await card.getByRole('button', { name: 'Read aloud', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.testVoice.current?.text)).toContain(prompt);
  const spoken = await page.evaluate(() => window.testVoice.current!.text);
  for (const option of options) expect(spoken).toContain(option);
  await page.keyboard.press(String(options.indexOf(question.answer) + 1));
  await expect(card.locator('.answer-reveal')).toBeVisible();
  await expect(card.locator('.feedback-title')).toContainText('Correct');
  await expect
    .poll(() => page.evaluate(() => window.testVoice.current?.text))
    .toContain(question.explanation);
  const history = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).history,
    saveKey,
  );
  expect(history[question.id].attempts).toBe(1);
  await page.keyboard.press(String(options.indexOf(question.answer) + 1));
  expect(
    await page.evaluate(
      ({ key, id }) => JSON.parse(localStorage.getItem(key)!).history[id].attempts,
      { key: saveKey, id: question.id },
    ),
  ).toBe(1);
  await page.locator('.next-answer').click();
  await expect(card.getByRole('radio').first()).toBeVisible();
  expect(await card.getByRole('radio').count()).toBeGreaterThanOrEqual(2);
  expect(await card.getByRole('radio').count()).toBeLessThanOrEqual(4);
});

test('phone dialogue remains usable without speech and respects reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, 'speechSynthesis');
    Reflect.deleteProperty(window, 'SpeechSynthesisUtterance');
  });
  await page.goto('/#home');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.keyboard.press('e');
  const dialogue = page.locator('.platform-dialogue');
  await expect(dialogue).toBeVisible();
  await expect(dialogue.getByText('Voice unavailable', { exact: true })).toBeVisible();
  await expect(dialogue.locator('.talk-letter.revealed')).toHaveCount(
    await dialogue.locator('.talk-letter').count(),
  );
  await expect(dialogue.getByRole('button', { name: 'Reveal full line' })).toHaveCount(0);
  await dialogue.getByRole('button', { name: 'Next line' }).click();
  await expect(dialogue.locator('.conversation-heading')).toContainText('2 / 2');
  expect(
    await dialogue
      .locator('.talk-letter')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'test-results/dialogue-mobile.png', animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(page.locator('.platform-shell')).toHaveClass(/is-playing/);
});
