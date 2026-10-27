import { test, expect } from '@playwright/test';
test('official auto-scroller moves a real nested scroll area and stops on cancel', async ({
  page,
}) => {
  await page.goto('/#playground');
  await page.getByRole('button', { name: 'Auto-scrolling', exact: true }).click();
  const area = page.locator('.scroll-demo');
  const box = await area.boundingBox();
  const handle = page.getByRole('button', { name: 'Move Item 1', exact: true });
  const item = await handle.boundingBox();
  await page.mouse.move(item!.x + 10, item!.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(280);
  await page.mouse.move(box!.x + 80, box!.y + box!.height - 12, { steps: 15 });
  await expect.poll(() => area.evaluate((el) => el.scrollTop)).toBeGreaterThan(10);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await page.waitForTimeout(200);
  const stopped = await area.evaluate((el) => el.scrollTop);
  await page.waitForTimeout(200);
  expect(await area.evaluate((el) => el.scrollTop)).toBe(stopped);
});
test('axis and snap modifiers constrain engine feedback, and reduced motion is respected', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#playground');
  await page.getByRole('button', { name: 'Constraints', exact: true }).click();
  const source = await page.locator('.parcel').boundingBox();
  await page.mouse.move(source!.x + 30, source!.y + 30);
  await page.mouse.down();
  await page.waitForTimeout(260);
  await page.mouse.move(source!.x + 201, source!.y + 130, { steps: 12 });
  await page.waitForTimeout(120);
  const overlay = page.locator('[data-vibednd-overlay]');
  const position = await overlay.boundingBox();
  expect(Math.abs(position!.y - source!.y)).toBeLessThan(2);
  expect(Math.round(position!.x - source!.x) % 24).toBe(0);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(overlay).toBeHidden();
  expect(
    await page
      .locator('.parcel')
      .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);
});
test('accepted and rejected collision targets agree with final feedback', async ({ page }) => {
  await page.goto('/#playground');
  await page.getByRole('button', { name: 'Drop zones', exact: true }).click();
  for (const target of ['Design', 'Restricted']) {
    const source = await page.locator('.parcel').boundingBox();
    const zone = await page.locator(`[data-zone="${target}"]`).boundingBox();
    await page.mouse.move(source!.x + 30, source!.y + 30);
    await page.mouse.down();
    await page.waitForTimeout(260);
    await page.mouse.move(zone!.x + zone!.width / 2, zone!.y + 30, { steps: 14 });
    await page.waitForTimeout(120);
    await page.mouse.up();
    await expect(page.locator('.demo-status')).toHaveText(
      target === 'Design' ? 'Delivered to Design' : 'No accepted destination',
    );
  }
});
test('touch long press, drag and cancel use actual browser touch input', async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Touch dragging uses Chromium CDP input; desktop coverage runs in all three engines.',
  );
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 1100, height: 800 },
  });
  const page = await context.newPage();
  await page.goto('/?adapter');
  const cdp = await context.newCDPSession(page);
  const source = await page.getByRole('button', { name: 'Move A', exact: true }).boundingBox();
  const target = await page.locator('[data-item="C"]').boundingBox();
  const point = (x: number, y: number) => ({ x, y, id: 1, radiusX: 3, radiusY: 3, force: 1 });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point(source!.x + 10, source!.y + 10)],
  });
  await page.waitForTimeout(320);
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        point(
          source!.x + 10 + ((target!.x + 30 - source!.x - 10) * i) / 12,
          source!.y + 10 + ((target!.y + target!.height / 2 - source!.y - 10) * i) / 12,
        ),
      ],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect
    .poll(() =>
      page
        .locator('[data-zone="one"] [data-item]')
        .evaluateAll((es) => es.map((e) => e.getAttribute('data-item'))),
    )
    .toEqual(['B', 'C', 'A', 'D']);
  const next = await page.getByRole('button', { name: 'Move A', exact: true }).boundingBox();
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point(next!.x + 10, next!.y + 10)],
  });
  await page.waitForTimeout(320);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [point(next!.x + 20, next!.y - 30)],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(page.locator('[data-vibednd-overlay]')).toBeHidden();
  await context.close();
});
