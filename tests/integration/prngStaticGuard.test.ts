import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sourceFiles = (directory: string): string[] =>
  readdirSync(join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(path) : (/\.tsx?$/.test(entry.name) ? [path] : []);
  });

const engineFiles = [
  'services/aiLogic.ts',
  'components/ReplayPlayer.tsx',
  ...sourceFiles('services/engine'),
  ...sourceFiles('services/handlers'),
];
const globalApiFiles = [
  ...engineFiles,
  'hooks/useBattleState.ts',
  'hooks/useTurnManager.ts',
  'utils/prng.ts',
];
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('guarda estática do PRNG explícito', () => {
  it('não encontra Math.random nos caminhos ativos de batalha e simulação', () => {
    const offenders = engineFiles.filter(path => /Math\s*\.\s*random\s*\(/.test(read(path)));
    expect(offenders).toEqual([]);
  });

  it('não encontra singleton nem monkeypatch do PRNG global', () => {
    const offenders = globalApiFiles.filter(path => {
      const source = read(path);
      return /Math\s*\.\s*random\s*=/.test(source)
        || /\b(?:enableDeterministicRandom|disableDeterministicRandom|setSeed)\b/.test(source);
    });
    expect(offenders).toEqual([]);
  });
});
