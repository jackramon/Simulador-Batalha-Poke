import { describe, expect, it } from 'vitest';
import { BattlePRNG, createBattlePRNGState } from '../../utils/prng';
import { createBattleState } from '../factories';

const LEGACY_SEQUENCE_SEED_2606 = [
  0.593241773545742,
  0.15462023578584194,
  0.961119549581781,
  0.7073046376463026,
  0.02498046401888132,
  0.408800806151703,
  0.716030458221212,
  0.9892094407696277,
];

const draw = (prng: BattlePRNG, count: number): number[] =>
  Array.from({ length: count }, () => prng.next());

describe('BattlePRNG', () => {
  it('reproduz exatamente a sequência da seed legada e registra o cursor', () => {
    const prng = new BattlePRNG(2606);

    expect(draw(prng, 8)).toEqual(LEGACY_SEQUENCE_SEED_2606);
    expect(prng.snapshot()).toEqual({
      seed: 2606,
      state: prng.snapshot().state,
      cursor: 8,
    });
    expect(JSON.parse(JSON.stringify(prng.snapshot()))).toEqual(prng.snapshot());
  });

  it('snapshot e restore reproduzem o mesmo sufixo após serialização JSON', () => {
    const prng = new BattlePRNG(2606);
    draw(prng, 3);
    const snapshot = JSON.parse(JSON.stringify(prng.snapshot()));
    const expectedSuffix = draw(prng, 5);

    prng.restore(snapshot);

    expect(draw(prng, 5)).toEqual(expectedSuffix);
    expect(prng.snapshot().cursor).toBe(8);
  });

  it('fork e instâncias distintas não interferem entre si', () => {
    const original = new BattlePRNG(2606);
    draw(original, 2);
    const fork = original.fork();
    const independent = new BattlePRNG(99);

    const originalSuffix = draw(original, 4);
    const forkSuffix = draw(fork, 4);
    draw(independent, 20);

    expect(forkSuffix).toEqual(originalSuffix);
    expect(draw(new BattlePRNG(2606), 2)).toEqual(LEGACY_SEQUENCE_SEED_2606.slice(0, 2));
    expect(independent.snapshot().cursor).toBe(20);
    expect(original.snapshot().cursor).toBe(6);
    expect(fork.snapshot().cursor).toBe(6);
  });

  it('sincroniza uma instância externa após uma rolagem aninhada no mesmo estado', () => {
    const state = createBattleState(undefined, undefined, {
      prngState: createBattlePRNGState(2606),
    });
    const outer = BattlePRNG.fromBattleState(state);

    const first = outer.next();
    const second = BattlePRNG.fromBattleState(state).next();
    const third = outer.next();

    expect([first, second, third]).toEqual(LEGACY_SEQUENCE_SEED_2606.slice(0, 3));
    expect(state.prngState?.cursor).toBe(3);
  });

  it('mantém o cursor no BattleState serializado e aceita turnSeed legado', () => {
    const state = createBattleState(undefined, undefined, { turnSeed: 2606 });
    const prng = BattlePRNG.fromBattleState(state);

    expect(draw(prng, 2)).toEqual(LEGACY_SEQUENCE_SEED_2606.slice(0, 2));
    expect(state.prngState?.cursor).toBe(2);

    const persisted = JSON.parse(JSON.stringify(state));
    const restored = BattlePRNG.fromBattleState(persisted);
    expect(draw(restored, 2)).toEqual(LEGACY_SEQUENCE_SEED_2606.slice(2, 4));

    const isolated = createBattleState(undefined, undefined, {
      prngState: createBattlePRNGState(2606),
    });
    expect(draw(BattlePRNG.fromBattleState(isolated), 2)).toEqual(LEGACY_SEQUENCE_SEED_2606.slice(0, 2));
    expect(persisted.prngState.cursor).toBe(4);
  });
});
