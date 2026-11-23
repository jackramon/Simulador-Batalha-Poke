import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLocalEnv } from '../../server/env';

const TEST_KEY = 'POKEMON_TEST_ENV_LOCAL';

describe('carregamento de .env.local', () => {
  let temporaryRoot: string;
  let originalValue: string | undefined;
  let hadOriginalValue: boolean;

  beforeEach(() => {
    temporaryRoot = mkdtempSync(path.join(tmpdir(), 'pokemon-environment-'));
    hadOriginalValue = Object.prototype.hasOwnProperty.call(process.env, TEST_KEY);
    originalValue = process.env[TEST_KEY];
    delete process.env[TEST_KEY];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (hadOriginalValue) {
      process.env[TEST_KEY] = originalValue!;
    } else {
      delete process.env[TEST_KEY];
    }
    rmSync(temporaryRoot, { recursive: true, force: true });
  });

  it('carrega valores fictícios do arquivo', () => {
    writeFileSync(path.join(temporaryRoot, '.env.local'), `${TEST_KEY}=valor_ficticio_arquivo\n`);

    loadLocalEnv(temporaryRoot);

    expect(process.env[TEST_KEY]).toBe('valor_ficticio_arquivo');
  });

  it('preserva a precedência de uma variável já existente no ambiente', () => {
    process.env[TEST_KEY] = 'valor_ficticio_ambiente';
    writeFileSync(path.join(temporaryRoot, '.env.local'), `${TEST_KEY}=valor_ficticio_arquivo\n`);

    loadLocalEnv(temporaryRoot);

    expect(process.env[TEST_KEY]).toBe('valor_ficticio_ambiente');
  });

  it('inicializa sem lançar erro quando o arquivo não existe', () => {
    expect(() => loadLocalEnv(temporaryRoot)).not.toThrow();
    expect(process.env[TEST_KEY]).toBeUndefined();
  });

  it('não emite os valores carregados nos logs', () => {
    writeFileSync(path.join(temporaryRoot, '.env.local'), `${TEST_KEY}=valor_ficticio_sigiloso\n`);
    const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method =>
      vi.spyOn(console, method).mockImplementation(() => {})
    );

    loadLocalEnv(temporaryRoot);

    expect(process.env[TEST_KEY]).toBe('valor_ficticio_sigiloso');
    for (const spy of consoleSpies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });
});
