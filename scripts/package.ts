import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';
const root = process.cwd();
mkdirSync('.artifacts', { recursive: true });
const run = (cmd: string, args: string[], cwd = root) =>
  execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
  name: string;
  version: string;
};
run('pnpm', ['pack', '--pack-destination', '.artifacts']);
const tarball = resolve(
  '.artifacts',
  `${manifest.name.replace(/^@/, '').replaceAll('/', '-')}-${manifest.version}.tgz`,
);
const consumer = mkdtempSync(join(tmpdir(), 'vibednd-consumer-'));
try {
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module', private: true }));
  run(
    'pnpm',
    [
      'add',
      tarball,
      '@usevibejs/ui@0.1.0',
      '@usevibejs/compiler@0.1.0',
      'typescript@7.0.2',
      'vite@8.3.4',
      '--ignore-scripts',
    ],
    consumer,
  );
  writeFileSync(
    join(consumer, 'consumer.ts'),
    `import * as api from '@usevibejs/dnd';\nimport * as sorting from '@usevibejs/dnd/sortable';\nconst items:readonly number[]=[1,2];\nconst moved:number[]=api.moveItem(items,0,1);\nconst again:number[]=sorting.moveItem(moved,1,0);\nvoid again;\ninterface Task {id:string;title:string}\ninterface Zone {name:string}\nconst context=api.useDnd<Task,Zone>();\nsorting.useSortableList({items:[] as Task[],getId:item=>item.id,context});\napi.useDndMonitor<Task,Zone>({onDragEnd(event){api.getSortableMove(event);}},context);\napi.createDndPlugin(context);\n`,
  );
  run(
    'pnpm',
    [
      'exec',
      'tsc',
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--target',
      'ES2024',
      '--module',
      'ESNext',
      '--moduleResolution',
      'bundler',
      'consumer.ts',
    ],
    consumer,
  );
  const exports = run(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `const main=await import('@usevibejs/dnd');const sortable=await import('@usevibejs/dnd/sortable');if(main.moveItem([1,2],0,1).join()!=='2,1')throw Error('bad move');console.log(JSON.stringify({main:Object.keys(main),sortable:Object.keys(sortable)}))`,
    ],
    consumer,
  ).trim();
  writeFileSync(
    join(consumer, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"></head><body><div id="app"></div><script type="module" src="/entry.ts"></script></body></html>',
  );
  writeFileSync(
    join(consumer, 'entry.ts'),
    `import {moveItem} from '@usevibejs/dnd';document.body.textContent=moveItem(['a','b'],0,1).join(',');`,
  );
  run('pnpm', ['exec', 'vite', 'build'], consumer);
  const asset = join(
    consumer,
    'dist/assets',
    readdirSync(join(consumer, 'dist/assets')).find((file) => file.endsWith('.js'))!,
  );
  const code = readFileSync(asset, 'utf8');
  if (/aria-live|Picked up draggable|pointerdown|React|vue|OptimisticSortingPlugin/.test(code))
    throw new Error('Unused drag engine or framework leaked into helper-only bundle');

  if (/file:|link:|\/Users\/|\/tmp\//.test(JSON.stringify(manifest)))
    throw new Error('Local path leaked into package manifest');
  // Compile and exercise a real .vibe application against only the installed tarball.
  writeFileSync(
    join(consumer, 'vite.config.ts'),
    `import {defineConfig} from 'vite';import {vibe} from '@usevibejs/compiler/vite';export default defineConfig({plugins:[vibe()]});`,
  );
  writeFileSync(
    join(consumer, 'Item.vibe'),
    `<script setup lang="ts">
import {useTemplateRef} from '@usevibejs/ui';
import {useSortable} from '@usevibejs/dnd';
const props=defineProps<{id:string;index:number}>();
const element=useTemplateRef<HTMLElement>('element');const handle=useTemplateRef<HTMLButtonElement>('handle');
useSortable({id:()=>props.id,index:()=>props.index,group:'list',element,handle});
</script><template><li ref="element" :data-id="id"><button ref="handle" type="button" :aria-label="'Move '+id" style="touch-action:none">{{ id }}</button></li></template><style>li{padding:16px;margin:8px;background:#eee}</style>`,
  );
  writeFileSync(
    join(consumer, 'App.vibe'),
    `<script setup lang="ts">
import {useDnd,useSortableList} from '@usevibejs/dnd';import Item from './Item.vibe';
const context=useDnd();const {items}=useSortableList({items:['A','B','C'],getId:id=>id,context});
</script><template><main><ul><Item v-for="(id,index) in items" :key="id" :id="id" :index="index"/></ul><output>{{items.join(',')}}</output></main></template>`,
  );
  writeFileSync(
    join(consumer, 'entry.ts'),
    `import {createApp} from '@usevibejs/ui';import App from './App.vibe';createApp(App).mount('#app');`,
  );
  run('pnpm', ['exec', 'vite', 'build'], consumer);
  const preview = spawn(
    process.execPath,
    [
      join(consumer, 'node_modules/vite/bin/vite.js'),
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '4182',
      '--strictPort',
    ],
    { cwd: consumer, stdio: 'ignore' },
  );
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch('http://127.0.0.1:4182')).ok) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    browser = await chromium.launch();
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:4182');
    const handle = page.getByRole('button', { name: 'Move A', exact: true });
    await handle.focus();
    await page.keyboard.press('Space');
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(120);
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[aria-live]')).toContainText('target');
    await page.keyboard.press('Space');
    await expect(page.locator('output')).toHaveText('B,A,C');
    expect(
      await page
        .locator('li')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-id'))),
    ).toEqual(['B', 'A', 'C']);
    await expect(page.locator('[data-vibednd-overlay]:visible')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await browser?.close();
    preview.kill('SIGTERM');
  }
  const result = {
    tarball: tarball.split('/').at(-1),
    compiledVibeConsumer: true,
    packedKeyboardSorting: true,
    nodeImport: true,
    consumerTypecheck: true,
    helperBundleBytes: Buffer.byteLength(code),
    treeShaking: true,
    exports: JSON.parse(exports),
  };
  writeFileSync('.artifacts/package-results.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
