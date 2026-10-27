import { test, expect } from '@playwright/test';
test('pointer drop, cancel, repeat and unrelated update preserve keyed ownership', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?proof');
  const handle = page.getByRole('button', { name: 'Move A', exact: true });
  const box = await handle.boundingBox();
  const target = await page.locator('[data-id="C"]').boundingBox();
  await page.mouse.move(box!.x + 20, box!.y + 20);
  await page.mouse.down();
  await page.waitForTimeout(260);
  await page.mouse.move(target!.x + 30, target!.y + target!.height / 2, { steps: 12 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await expect(page.locator('[data-order]')).toHaveText('B,C,A,D');
  await expect(page.locator('li')).toHaveCount(4);
  expect(
    await page.locator('li').evaluateAll((es) => es.map((e) => e.getAttribute('data-id'))),
  ).toEqual(['B', 'C', 'A', 'D']);
  await page.getByRole('button', { name: 'Unrelated 0' }).click();
  await page.locator('[data-id="A"]').getByText('Clicks 0').click();
  await expect(page.locator('[data-id="A"]')).toContainText('Clicks 1');
  await page.getByRole('button', { name: 'Move A', exact: true }).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Move A', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.waitForTimeout(60);
  await expect(page.locator('[data-order]')).toHaveText('B,C,A,D');
  await page.getByRole('button', { name: 'Move A', exact: true }).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(150);
  await page.keyboard.press('Space');
  await expect(page.locator('[data-order]')).toHaveText('B,A,C,D');
  expect(errors).toEqual([]);
});
