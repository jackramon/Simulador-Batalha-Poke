import { execFile, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const STARTUP_TIMEOUT_MS = 20_000;
const STOP_TIMEOUT_MS = 5_000;

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getAvailablePort() {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const port = (server.address() as AddressInfo).port;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function isPortAvailable(port: number) {
  const server = createServer();

  return new Promise<boolean>((resolve) => {
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close((error) => resolve(!error));
    });
  });
}

async function waitForServer(
  child: ChildProcess,
  port: number,
  getOutput: () => string,
  getSpawnError: () => Error | undefined,
) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastProblem = 'nenhuma resposta HTTP';

  while (Date.now() < deadline) {
    const spawnError = getSpawnError();
    if (spawnError) {
      throw new Error(`Falha ao iniciar npm run dev: ${spawnError.message}`);
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Servidor de desenvolvimento encerrou durante a inicialização:\n${getOutput()}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      await response.text();
      if (response.status === 200) {
        return;
      }
      lastProblem = `HTTP ${response.status}`;
    } catch (error) {
      lastProblem = error instanceof Error ? error.message : String(error);
    }

    await delay(100);
  }

  throw new Error(
    `Servidor de desenvolvimento não iniciou no prazo (${lastProblem}):\n${getOutput()}`,
  );
}

async function stopProcessTree(child: ChildProcess) {
  const pid = child.pid;
  if (!pid) {
    return;
  }

  const exitPromise =
    child.exitCode === null && child.signalCode === null
      ? new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, STOP_TIMEOUT_MS);
          child.once('exit', () => {
            clearTimeout(timer);
            resolve();
          });
        })
      : Promise.resolve();

  if (process.platform === 'win32') {
    await new Promise<void>((resolve, reject) => {
      execFile('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Falha ao encerrar a árvore do smoke: ${stdout}${stderr}`));
          return;
        }
        resolve();
      });
    });
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
        throw error;
      }
    }
  }

  await exitPromise;
}

async function waitForPortRelease(port: number) {
  const deadline = Date.now() + STOP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isPortAvailable(port)) {
      return;
    }
    await delay(100);
  }

  throw new Error(`A porta ${port} continua ocupada após o encerramento do smoke.`);
}

describe('servidor de desenvolvimento', () => {
  it('deve executar npm run dev com Vite e API local sem chamadas externas', async () => {
    const port = await getAvailablePort();
    const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'pokemon-development-'));
    const fetchStubPath = path.join(temporaryRoot, 'block-external-fetch.cjs');
    let child: ChildProcess | undefined;
    let spawnError: Error | undefined;
    let output = '';

    // Todo acesso não loopback é bloqueado também em eventuais fallbacks do servidor.
    writeFileSync(
      fetchStubPath,
      `
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (input, init) => {
        const target = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const hostname = new URL(target).hostname;
        if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1') {
          return originalFetch(input, init);
        }
        throw new Error('Chamada externa bloqueada no smoke de desenvolvimento: ' + target);
      };
    `,
    );

    try {
      const isWindows = process.platform === 'win32';
      const npmCommand = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npm';
      const npmArgs = isWindows ? ['/d', '/s', '/c', 'npm run dev'] : ['run', 'dev'];
      child = spawn(npmCommand, npmArgs, {
        cwd: path.resolve('.'),
        env: {
          ...process.env,
          NODE_ENV: 'development',
          NODE_OPTIONS: `--require=${fetchStubPath}`,
          PORT: String(port),
          LLM_PROXY_HOST: '127.0.0.1',
          LLM_ALLOWED_PAID_MODELS: '',
          LLM_REQUEST_TIMEOUT_MS: '30000',
          LLM_RATE_LIMIT_MAX: '60',
          LLM_RATE_LIMIT_WINDOW_MS: '60000',
          GEMINI_API_KEY: '',
          GOOGLE_API_KEY: '',
          OPENROUTER_API_KEY: '',
          DEEPSEEK_API_KEY: '',
          NO_UPDATE_NOTIFIER: '1',
          npm_config_update_notifier: 'false',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        detached: !isWindows,
      });
      child.once('error', (error) => {
        spawnError = error;
      });
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk) => {
        output += chunk;
      });
      child.stderr?.on('data', (chunk) => {
        output += chunk;
      });

      await waitForServer(child, port, () => output, () => spawnError);
      const baseUrl = `http://127.0.0.1:${port}`;

      const rootResponse = await fetch(`${baseUrl}/`);
      expect(rootResponse.status).toBe(200);
      expect(rootResponse.headers.get('content-type')).toContain('text/html');
      const html = await rootResponse.text();
      expect(html).toContain('id="root"');
      expect(html).toContain('/@vite/client');

      const apiResponse = await fetch(`${baseUrl}/api/llm-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Não chamar provedor externo', provider: 'openrouter' }),
      });
      expect(apiResponse.status).toBe(400);
      expect(await apiResponse.json()).toEqual({
        error: 'OPENROUTER_API_KEY não configurada nas Configurações (Settings).',
      });
    } finally {
      try {
        if (child) {
          await stopProcessTree(child);
        }
      } finally {
        try {
          await waitForPortRelease(port);
        } finally {
          rmSync(temporaryRoot, { recursive: true, force: true });
        }
      }
    }
  }, 45_000);
});
