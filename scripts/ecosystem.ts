import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
for (const name of ['vibequery', 'vibemotion', 'vibeauth'])
  if (!existsSync(`../${name}/dist/index.js`))
    throw new Error(`Build the optional sibling ${name} first.`);
execFileSync(
  'pnpm',
  ['exec', 'vite', 'build', '--config', 'examples/integrations/vite.config.ts'],
  { stdio: 'pipe' },
);
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--config',
    'examples/integrations/vite.config.ts',
    '--host',
    '127.0.0.1',
    '--port',
    '4179',
  ],
  { stdio: 'ignore' },
);
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4179')).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4179');
  await expect(page.getByRole('button', { name: 'Move Task 1', exact: true })).toBeVisible();
  await expect(page.locator('main')).toContainText('Demo Editor');
  const drag = async () => {
    const source = await page
      .getByRole('button', { name: 'Move Task 1', exact: true })
      .boundingBox();
    const target = await page.locator('[data-zone="Review"]').boundingBox();
    await page.mouse.move(source!.x + 10, source!.y + 10);
    await page.mouse.down();
    await page.waitForTimeout(270);
    await page.mouse.move(target!.x + 40, target!.y + 70, { steps: 12 });
    await page.waitForTimeout(120);
    await page.mouse.up();
  };
  await page.getByLabel('Fail next save').check();
  await drag();
  await expect(page.locator('[data-zone="Todo"]')).toContainText('Task 1');
  await expect(page.locator('[data-zone="Review"] [data-id="Task 1"]')).toHaveCount(0);
  await drag();
  await expect(page.locator('[data-zone="Review"] [data-id="Task 1"]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('[data-zone="Review"] [data-id="Task 1"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Try a crafted unauthorized move' }).click();
  await expect(page.locator('main [role=status]')).toHaveText('Crafted request: 403');
  expect(errors).toEqual([]);
  mkdirSync('.artifacts', { recursive: true });
  writeFileSync(
    '.artifacts/ecosystem-results.json',
    JSON.stringify(
      {
        build: true,
        queryPersistence: true,
        failureRollback: true,
        reloadPersistence: true,
        serverRejectsCraftedMove: 403,
        motionWrapper: true,
        auth: 'VibeAuth with a deterministic local fixture session; no production authentication claim',
      },
      null,
      2,
    ),
  );
  console.log('Optional ecosystem build and browser verification passed.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
