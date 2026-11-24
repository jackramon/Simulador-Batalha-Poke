import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  getStatusMoveRoute,
  STATUS_MOVE_REGISTRY,
} from '../../services/engine/handlers/effects/statusMoveRegistry';

const legacySource = readFileSync(
  new URL('../fixtures/statusMoveRouter.before-2.3.txt', import.meta.url),
  'utf8',
);

const extractLegacyCases = (): Map<string, string> => {
  const switchBody = legacySource.split('switch(move.name)')[1].split('default:')[0];
  const casePattern = /case '([^']+)':/g;
  const matches = [...switchBody.matchAll(casePattern)];
  const legacyCases = new Map<string, string>();
  let pendingNames: string[] = [];

  matches.forEach((match, index) => {
    pendingNames.push(match[1]);
    const end = index + 1 < matches.length ? matches[index + 1].index : switchBody.length;
    const segment = switchBody.slice((match.index ?? 0) + match[0].length, end);
    const handlerCall = /[A-Za-z][A-Za-z0-9]*[.]([A-Za-z][A-Za-z0-9]*)[(]/.exec(segment);
    if (!handlerCall) return;

    pendingNames.forEach(name => legacyCases.set(name, handlerCall[1]));
    pendingNames = [];
  });

  expect(pendingNames).toEqual([]);
  return legacyCases;
};

describe('registro declarativo de golpes de status', () => {
  it('mantém todo caso especial do switch anterior resolvendo ao mesmo handler', () => {
    const legacyCases = extractLegacyCases();
    expect(legacyCases.size).toBe(130);

    for (const [moveName, handlerName] of legacyCases) {
      const route = getStatusMoveRoute(moveName);
      expect(route, moveName).toBeDefined();
      expect(route?.handler, moveName).toBeTypeOf('function');
      expect((route?.handler as { name: string }).name, moveName).toBe(handlerName);
    }
  });

  it('resolve somente funções válidas, sem nomes vazios ou duplicados', () => {
    const registeredNames = STATUS_MOVE_REGISTRY.flatMap(route => route.names);

    expect(registeredNames.length).toBeGreaterThan(0);
    expect(new Set(registeredNames).size).toBe(registeredNames.length);
    for (const route of STATUS_MOVE_REGISTRY) {
      expect(route.names.length).toBeGreaterThan(0);
      expect(route.handler).toBeTypeOf('function');
      expect(route.execute).toBeTypeOf('function');
      for (const name of route.names) {
        expect(name.trim()).not.toBe('');
        expect(getStatusMoveRoute(name)).toBe(route);
      }
    }
  });

  it('deixa golpes de dano e status simples para o pipeline genérico', () => {
    expect(getStatusMoveRoute('tackle')).toBeUndefined();
    expect(getStatusMoveRoute('thunder-wave')).toBeUndefined();
  });
});
