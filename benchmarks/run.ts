import { chromium } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { platform, arch, cpus } from 'node:os';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4178'],
  {
    stdio: 'ignore',
  },
);
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4178')).ok) break;
    } catch {}
    await sleep(100);
  }
  browser = await chromium.launch();
  const results = [];
  for (const [count, groups] of [
    [100, 1],
    [500, 1],
    [1000, 1],
    [1000, 20],
  ]) {
    console.log(`Measuring ${count} items across ${groups} columns`);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      const metrics = { measurements: 0, longFrames: [] as number[] };
      Object.assign(window, { metrics });
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        metrics.measurements++;
        return original.call(this);
      };
      if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame'))
        new PerformanceObserver((list) =>
          metrics.longFrames.push(...list.getEntries().map((entry) => entry.duration)),
        ).observe({ type: 'long-animation-frame', buffered: true });
    });
    const begin = performance.now();
    await page.goto(`http://127.0.0.1:4178/?bench=${count}&groups=${groups}`);
    await page.waitForFunction(
      (n) =>
        [
          ...(
            window as unknown as {
              fixture: { context: { engine: { registry: { draggables: Iterable<unknown> } } } };
            }
          ).fixture.context.engine.registry.draggables,
        ].length === n,
      count,
    );
    const registrationMs = performance.now() - begin;
    const drag = async (target: string, cancel = false) => {
      const handle = page.getByRole('button', { name: 'Move Item 0', exact: true });
      // Declarative commits can still be animating after the engine becomes idle.
      // Wait for a stable, visible activator before recording the next real gesture.
      await handle.hover();
      const source = await handle.boundingBox();
      const destination = await page.locator(target).boundingBox();
      await page.mouse.move(source!.x + 10, source!.y + 10);
      await page.mouse.down();
      await page.waitForFunction(
        () =>
          (
            window as unknown as {
              fixture: {
                context: {
                  active: { value: { id: string } | null };
                  isDragging: { value: boolean };
                };
              };
            }
          ).fixture.context.active.value?.id === 'Item 0',
      );
      await page.waitForTimeout(50);
      const dx = destination!.x + 60;
      const dy = Math.min(destination!.y + 60, 650);
      await page.mouse.move(dx, dy, { steps: 24 });
      await page.waitForTimeout(100);
      if (cancel) await page.keyboard.press('Escape');
      await page.mouse.up();
      await page.waitForFunction(
        () =>
          (
            window as unknown as {
              fixture: { context: { engine: { dragOperation: { status: { idle: boolean } } } } };
            }
          ).fixture.context.engine.dragOperation.status.idle,
      );
    };
    const start = performance.now();
    await drag('[data-id="Item 3"]');
    const firstDragMs = performance.now() - start;
    const cycleStart = performance.now();
    for (let i = 0; i < 5; i++) await drag('[data-id="Item 2"]', true);
    const fiveCancellationsMs = performance.now() - cycleStart;
    let transfersMs: number | undefined;
    if (groups === 20) {
      const started = performance.now();
      for (let i = 0; i < 3; i++) {
        await drag('[data-zone="Group 2"]');
        await drag('[data-zone="Group 1"]');
      }
      transfersMs = performance.now() - started;
    }
    const metrics = await page.evaluate(() => {
      const w = window as unknown as {
        metrics: { measurements: number; longFrames: number[] };
        fixture: { counters: unknown; containers: Record<string, readonly string[]> };
      };
      return {
        ...w.metrics,
        counters: w.fixture.counters,
        total: Object.values(w.fixture.containers).flat().length,
      };
    });
    if (metrics.total !== count) throw new Error('Benchmark lost items');
    results.push({
      items: count,
      columns: groups,
      registrationMs,
      firstDragMs,
      fiveCancellationsMs,
      transfersMs,
      ...metrics,
    });
    await page.close();
  }
  const report = {
    date: new Date().toISOString(),
    platform: platform(),
    arch: arch(),
    cpu: cpus()[0]?.model,
    browser: browser.version(),
    method:
      'Real Chromium mouse input; deferred commits; 24 mouse moves per drag, official activation delay, five cancellations, six transfers for twenty columns. Times include input pacing; registration includes page load. Long frames are PerformanceObserver long-animation-frame entries. No FPS inferred.',
    results,
  };
  writeFileSync('benchmarks/results.json', JSON.stringify(report, null, 2) + '\n');
  execFileSync('node_modules/.bin/oxfmt', ['benchmarks/results.json'], { stdio: 'pipe' });
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
