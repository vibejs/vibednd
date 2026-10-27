import { test, expect, type Page } from '@playwright/test';
async function start(page: Page, id: string) {
  const rect = await page.getByRole('button', { name: `Move ${id}`, exact: true }).boundingBox();
  await page.mouse.move(rect!.x + 12, rect!.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(240);
  await page.mouse.move(rect!.x + 20, rect!.y + 12);
  await page.waitForTimeout(100);
}
async function over(page: Page, selector: string) {
  const rect = await page.locator(selector).boundingBox();
  await page.mouse.move(rect!.x + 30, rect!.y + rect!.height / 2, { steps: 10 });
  await page.waitForTimeout(120);
}
async function order(page: Page, group = 'one') {
  return page
    .locator(`[data-zone="${group}"] [data-item]`)
    .evaluateAll((es) => es.map((e) => e.getAttribute('data-item')));
}
test.beforeEach(async ({ page }) => {
  await page.goto('/?adapter');
});
test('pointer commits, click identity, cancellation and keyboard continuation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.locator('[data-item="A"]').getByText('Clicks 0').click();
  await start(page, 'A');
  await over(page, '[data-item="C"]');
  expect(await order(page)).toEqual(['A', 'B', 'C', 'D']);
  await page.mouse.up();
  await expect.poll(() => order(page)).toEqual(['B', 'C', 'A', 'D']);
  await expect(page.locator('[data-item="A"]')).toContainText('Clicks 1');
  await page.getByText('Unrelated 0', { exact: true }).click();
  expect(await order(page)).toEqual(['B', 'C', 'A', 'D']);
  await start(page, 'A');
  await over(page, '[data-item="B"]');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('[data-vibednd-overlay]:visible')).toHaveCount(0);
  expect(await order(page)).toEqual(['B', 'C', 'A', 'D']);
  const handle = page.getByRole('button', { name: 'Move A', exact: true });
  await handle.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(150);
  await page.keyboard.press('Space');
  await expect.poll(() => order(page)).toEqual(['B', 'A', 'C', 'D']);
  await expect(handle).toBeFocused();
  await expect(page.locator('[data-vibednd-overlay]:visible')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('cross-container transfer, empty source and keyboard transfer restore focus', async ({
  page,
}) => {
  await start(page, 'A');
  await over(page, '[data-zone="two"]');
  await page.mouse.up();
  await expect.poll(() => order(page, 'two')).toEqual(['A']);
  await expect.poll(() => order(page)).toEqual(['B', 'C', 'D']);
  const handle = page.getByRole('button', { name: 'Move A', exact: true });
  await handle.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(160);
  await page.keyboard.press('Space');
  await expect.poll(() => order(page, 'two')).toEqual([]);
  await expect(page.getByRole('button', { name: 'Move A', exact: true })).toBeFocused();
});
for (const action of ['Remove A', 'Insert', 'Replace', 'Toggle'])
  test(`external ${action} during drag preserves canonical DOM`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await start(page, 'A');
    await over(page, '[data-item="C"]');
    // External UI action while pointer is active, without ending the drag.
    await page
      .getByRole('button', { name: action, exact: true })
      .evaluate((el: HTMLButtonElement) => el.click());
    await page.waitForTimeout(120);
    await page.mouse.up();
    const state = JSON.parse((await page.locator('[data-state]').textContent()) ?? '{}');
    if (action === 'Toggle') await expect(page.locator('[data-item]')).toHaveCount(0);
    else expect(await order(page)).toEqual(state.one);
    expect(errors).toEqual([]);
    await expect(page.locator('[data-vibednd-overlay]:visible')).toHaveCount(0);
  });
test('repeated transfers and reorders produce no orphan nodes or lost event handlers', async ({
  page,
}) => {
  for (let i = 0; i < 3; i++) {
    await start(page, 'A');
    await over(page, '[data-zone="two"]');
    await page.mouse.up();
    await expect.poll(() => order(page, 'two')).toEqual(['A']);
    await start(page, 'A');
    await over(page, '[data-item="B"]');
    await page.mouse.up();
    await expect.poll(() => order(page, 'two')).toEqual([]);
  }
  await expect(page.locator('[data-item="A"]')).toHaveCount(1);
  await page.locator('[data-item="A"]').getByText('Clicks 0').click();
  await expect(page.locator('[data-item="A"]')).toContainText('Clicks 1');
  expect((await order(page)).length).toBe(4);
});
test('inputs and disabled handles preserve normal interaction', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Edit A' });
  await input.fill('Keep typing');
  await input.press('Space');
  await expect(input).toHaveValue('Keep typing ');
  await expect(page.getByRole('button', { name: 'Move locked', exact: true })).toBeDisabled();
  await expect(page.locator('[data-vibednd-overlay]:visible')).toHaveCount(0);
});
test('live region announces pickup, target and cancel; accessible tree exposes handles', async ({
  page,
}) => {
  const handle = page.getByRole('button', { name: 'Move A', exact: true });
  await expect(handle).toHaveAttribute('aria-describedby', /dnd-kit-description/);
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[aria-live]')).toContainText('Picked up');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[aria-live]')).toContainText('target');
  await page.keyboard.press('Escape');
  await expect(page.locator('[aria-live]')).toContainText('cancelled');
  await expect(handle).toBeFocused();
  expect(await page.locator('[data-adapter]').ariaSnapshot()).toContain('button "Move A"');
});

test('a failing consumer callback leaves the engine idle and the next drag usable', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() => {
    const context = (
      window as unknown as { fixture: { context: import('../../src/index.ts').DndContext } }
    ).fixture.context;
    const stop = context.monitor({
      onDragEnd() {
        stop();
        throw new Error('consumer callback failed');
      },
    });
  });
  await start(page, 'A');
  await over(page, '[data-item="C"]');
  await page.mouse.up();
  await expect.poll(() => order(page)).toEqual(['B', 'C', 'A', 'D']);
  await expect(page.locator('[data-vibednd-overlay]:visible')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { fixture: { context: import('../../src/index.ts').DndContext } })
            .fixture.context.engine.dragOperation.status.current,
      ),
    )
    .toBe('idle');
  await expect.poll(() => errors).toEqual(['consumer callback failed']);
  await start(page, 'A');
  await over(page, '[data-item="B"]');
  await page.mouse.up();
  await expect.poll(() => order(page)).toEqual(['A', 'B', 'C', 'D']);
  await expect(page.locator('[data-vibednd-overlay]:visible')).toHaveCount(0);
});

test('content-box sources keep preview geometry and keyboard target order', async ({ page }) => {
  const source = page.locator('[data-item="A"]');
  await source.evaluate((element: HTMLElement) => {
    element.style.boxSizing = 'content-box';
    element.style.padding = '16px';
    element.style.borderWidth = '2px';
  });
  const bounds = await source.boundingBox();
  const handle = page.getByRole('button', { name: 'Move A', exact: true });
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(handle).toHaveAttribute('aria-pressed', 'true');
  const overlay = page.locator('[data-vibednd-overlay]:visible');
  await expect
    .poll(async () => Math.abs((await overlay.boundingBox())!.width - bounds!.width))
    .toBeLessThan(1);
  await expect
    .poll(async () => Math.abs((await overlay.boundingBox())!.height - bounds!.height))
    .toBeLessThan(1);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[aria-live]')).toContainText('target B');
  await page.keyboard.press('Space');
  await expect.poll(() => order(page)).toEqual(['B', 'A', 'C', 'D']);
  await expect(overlay).toBeHidden();
  await expect(handle).toBeFocused();
});
