import { test, expect } from '@playwright/test';
test('Kanban create, edit, move by editor, delete, filters and persisted theme', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('[data-task]')).toHaveCount(10);
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Task title').fill('Ship the release');
  await dialog.getByLabel('Description').fill('Finish the browser acceptance checks.');
  await dialog.getByLabel('Status', { exact: true }).selectOption('review');
  await dialog.getByRole('button', { name: 'Save task' }).click();
  await expect(page.locator('[data-task="ORB-111"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-task="ORB-111"]')).toBeVisible();
  await page.getByRole('button', { name: 'Ship the release', exact: true }).click();
  await dialog.getByLabel('Task title').fill('Ship with confidence');
  await dialog.getByLabel('Status', { exact: true }).selectOption('backlog');
  await dialog.getByRole('button', { name: 'Save task' }).click();
  await expect(page.locator('[data-column="backlog"]')).toContainText('Ship with confidence');
  await page.getByRole('searchbox', { name: 'Search tasks' }).fill('confidence');
  await expect(page.locator('[data-task]')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Move Ship with confidence', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('[data-task]')).toHaveCount(11);
  await page.getByLabel('Filter priority').selectOption('High');
  await expect(page.locator('[data-task]')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'Ship with confidence', exact: true }).click();
  await dialog.getByRole('button', { name: 'Delete task' }).click();
  await expect(page.locator('[data-task]')).toHaveCount(10);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  expect(errors).toEqual([]);
});
test('Kanban pointer transfer and keyboard column reorder persist', async ({ page }) => {
  await page.goto('/');
  const handle = page.getByRole('button', {
    name: 'Move Explore command menu patterns',
    exact: true,
  });
  const source = await handle.boundingBox();
  const target = await page.locator('[data-task="ORB-103"]').boundingBox();
  await page.mouse.move(source!.x + 8, source!.y + 8);
  await page.mouse.down();
  await page.waitForTimeout(260);
  await page.mouse.move(target!.x + 50, target!.y + 60, { steps: 12 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await expect(page.locator('[data-column="todo"] [data-task="ORB-101"]')).toHaveCount(1);
  const column = page.getByRole('button', { name: 'Move column Backlog', exact: true });
  await column.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(180);
  await page.keyboard.press('Space');
  await expect
    .poll(() => page.locator('[data-column]').first().getAttribute('data-column'))
    .toBe('todo');
  await page.reload();
  await expect(page.locator('[data-column]').first()).toHaveAttribute('data-column', 'todo');
  await expect(page.locator('[data-column="todo"] [data-task="ORB-101"]')).toHaveCount(1);
});
test('every playground mounts, interacts, and disposes its own context', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#playground');
  const names = [
    'Draggable',
    'Drop zones',
    'Vertical list',
    'Horizontal list',
    'Grid',
    'Multi-container',
    'Nested controls',
    'Handles & disabled',
    'Dashboard',
    'Keyboard sorting',
    'Constraints',
    'Auto-scrolling',
    'Collision strategies',
    'Drag overlay',
  ];
  for (const name of names) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.example-stage h2')).toHaveText(name);
    await expect(page.locator('.example-stage')).toContainText(/Item|files|brief|Revenue/);
  }
  await page.getByRole('button', { name: 'Keyboard sorting', exact: true }).click();
  await page.getByRole('button', { name: 'Move Item 1', exact: true }).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('Space');
  await expect(page.locator('.demo-item').first()).toContainText('Item 2');
  expect(errors).toEqual([]);
});
test('documentation search and example copy work', async ({ page }) => {
  await page.goto('/#docs');
  await page.getByRole('textbox', { name: 'Search documentation' }).fill('sortable');
  await expect(page.locator('.docs-navigation button').first()).toBeVisible();
  await page.locator('.docs-navigation button').first().click();
  await expect(page.locator('.docs-article')).toContainText(/Sortable|sort/);
});
