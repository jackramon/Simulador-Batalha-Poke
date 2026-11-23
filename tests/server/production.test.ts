import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

const STARTUP_TIMEOUT_MS = 10_000;

function delay(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function getAvailablePort() {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const port = (server.address() as AddressInfo).port;
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
  return port;
}

async function isPortAvailable(port: number) {
  const server = createServer();

  return new Promise<boolean>(resolve => {
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close(error => resolve(!error));
    });
  });
}

async function waitForServer(child: ChildProcess, port: number, getOutput: () => string) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Servidor de produção encerrou durante a inicialização:\n${getOutput()}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      await response.text();
      return;
    } catch {
      await delay(100);
    }
  }

  throw new Error(`Servidor de produção não iniciou no prazo:\n${getOutput()}`);
}

async function stopServer(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  await new Promise<void>(resolve => {
    const forceKillTimer = setTimeout(() => child.kill('SIGKILL'), 3_000);
    child.once('exit', () => {
      clearTimeout(forceKillTimer);
      resolve();
    });

    if (!child.kill('SIGTERM')) {
      clearTimeout(forceKillTimer);
      resolve();
    }
  });
}

describe('servidor de produção', () => {
  it('deve servir a SPA sem interceptar as rotas de API', async () => {
    const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'pokemon-production-'));
    const serverPath = path.join(temporaryRoot, 'server.cjs');
    const port = await getAvailablePort();
    const spaHtml = '<!doctype html><html><body><div id="root">Regressão de produção</div></body></html>';
    let child: ChildProcess | undefined;

    try {
      await build({
        entryPoints: [path.resolve('server.ts')],
        outfile: serverPath,
        bundle: true,
        platform: 'node',
        target: 'node18',
        format: 'cjs',
        external: ['express', 'vite', '@google/genai'],
        logLevel: 'silent',
      });

      mkdirSync(path.join(temporaryRoot, 'dist'));
      writeFileSync(path.join(temporaryRoot, 'dist', 'index.html'), spaHtml);

      // O substituto impede qualquer chamada real aos provedores durante o teste.
      const fetchStubPath = path.join(temporaryRoot, 'fetch-stub.cjs');
      writeFileSync(fetchStubPath, `
        globalThis.fetch = async url => {
          if (url === 'https://openrouter.ai/api/v1/models') {
            return {
              ok: true,
              json: async () => ({
                data: [{ id: 'modelo/teste:free', name: 'Modelo de teste', pricing: { prompt: '0' } }]
              })
            };
          }
          throw new Error('Chamada externa bloqueada no teste: ' + url);
        };
      `);

      let output = '';
      child = spawn(process.execPath, ['--require', fetchStubPath, serverPath], {
        cwd: temporaryRoot,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: String(port),
          NODE_PATH: [path.resolve('node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter),
          GEMINI_API_KEY: '',
          GOOGLE_API_KEY: '',
          OPENROUTER_API_KEY: '',
          DEEPSEEK_API_KEY: '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', chunk => { output += chunk; });
      child.stderr?.on('data', chunk => { output += chunk; });

      await waitForServer(child, port, () => output);
      const baseUrl = `http://127.0.0.1:${port}`;

      const rootResponse = await fetch(`${baseUrl}/`);
      expect(rootResponse.status).toBe(200);
      expect(rootResponse.headers.get('content-type')).toContain('text/html');
      expect(await rootResponse.text()).toBe(spaHtml);

      const deepResponse = await fetch(`${baseUrl}/batalha/replay/inexistente`);
      expect(deepResponse.status).toBe(200);
      expect(await deepResponse.text()).toBe(spaHtml);

      const unknownApiResponse = await fetch(`${baseUrl}/api/rota-inexistente`);
      expect(unknownApiResponse.status).toBe(404);
      expect(await unknownApiResponse.text()).not.toBe(spaHtml);

      const modelsResponse = await fetch(`${baseUrl}/api/openrouter-models`);
      expect(modelsResponse.status).toBe(200);
      expect(await modelsResponse.json()).toEqual({
        models: [{ id: 'modelo/teste:free', name: 'Modelo de teste', isFree: true }],
      });

      const llmResponse = await fetch(`${baseUrl}/api/llm-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Não chamar provedor externo', provider: 'openrouter' }),
      });
      expect(llmResponse.status).toBe(400);
      expect(await llmResponse.json()).toEqual({
        error: 'OPENROUTER_API_KEY não configurada nas Configurações (Settings).',
      });
    } finally {
      if (child) {
        await stopServer(child);
      }
      rmSync(temporaryRoot, { recursive: true, force: true });
    }

    expect(await isPortAvailable(port)).toBe(true);
  }, 30_000);
});
