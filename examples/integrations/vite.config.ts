import { defineConfig, type Plugin } from 'vite';
import { vibe } from '@usevibejs/compiler/vite';
import tailwind from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const sibling = (name: string) =>
  fileURLToPath(new URL(`../../../${name}/dist/index.js`, import.meta.url));
/** Deliberate local integration fixture; no connection to real user accounts or data. */
function localApi(): Plugin {
  let revision = 1;
  let containers: Record<string, string[]> = { Todo: ['Task 1', 'Task 2'], Review: [], Done: [] };
  return {
    name: 'local-ecosystem-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const send = (status: number, data: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };
        if (req.url?.startsWith('/api/auth/get-session')) {
          send(200, {
            user: {
              id: 'fixture-editor',
              name: 'Demo Editor',
              email: 'editor@example.test',
              emailVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            session: {
              id: 'fixture-session',
              token: 'fixture-only',
              userId: 'fixture-editor',
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
          return;
        }
        if (req.url === '/api/board') {
          send(200, { revision, containers });
          return;
        }
        if (req.url === '/api/move' && req.method === 'POST') {
          // Permission comes from this server-side fixture identity, never a supplied user ID.
          const identity = { id: 'fixture-editor', allowed: ['Todo', 'Review'] };
          let body = '';
          for await (const chunk of req) {
            body += chunk;
            if (body.length > 16000) {
              send(413, { error: 'Too large' });
              return;
            }
          }
          try {
            const input = JSON.parse(body);
            const move = input.move;
            if (
              !move ||
              !identity.allowed.includes(move.fromContainer) ||
              !identity.allowed.includes(move.toContainer)
            ) {
              send(403, { error: 'Not authorized' });
              return;
            }
            if (input.revision !== revision) {
              send(409, { error: 'Stale revision' });
              return;
            }
            if (input.fail) {
              send(503, { error: 'Deliberate test failure' });
              return;
            }
            const source = containers[move.fromContainer];
            const target = containers[move.toContainer];
            if (
              !source ||
              !target ||
              source[move.fromIndex] !== move.itemId ||
              !Number.isInteger(move.toIndex) ||
              move.toIndex < 0 ||
              move.toIndex > target.length - (source === target ? 1 : 0)
            ) {
              send(409, { error: 'Stale membership' });
              return;
            }
            const next = {
              ...containers,
              [move.fromContainer]: [...source],
              [move.toContainer]: [...target],
            };
            if (move.fromContainer === move.toContainer)
              next[move.toContainer] = next[move.fromContainer]!;
            const [item] = next[move.fromContainer]!.splice(move.fromIndex, 1);
            next[move.toContainer]!.splice(move.toIndex, 0, item!);
            containers = next;
            revision++;
            send(200, { revision, containers });
            return;
          } catch {
            send(400, { error: 'Invalid request' });
            return;
          }
        }
        next();
      });
    },
  };
}
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vibe(), tailwind(), localApi()],
  resolve: {
    alias: {
      '@usevibejs/dnd': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      '@usevibejs/query': sibling('vibequery'),
      '@usevibejs/motion': sibling('vibemotion'),
      '@usevibejs/auth': sibling('vibeauth'),
    },
    dedupe: ['@usevibejs/ui'],
  },
  build: { outDir: '../../.artifacts/ecosystem-dist', emptyOutDir: true },
});
