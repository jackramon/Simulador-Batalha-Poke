import { describe, expect, it } from 'vitest';
import { getSortedActions } from '../../services/engine/actions';
import { getEffectiveSpeed } from '../../services/battleUtils';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';

// 4.1.1 — Surfista de Raio (Surge Surfer) dobra a Velocidade somente no Campo Elétrico,
// inclusive na ordenação de ações, e respeita a supressão da habilidade (Gás Neutralizante).

const buildTurn = (terrain: 'none' | 'electric' | 'grassy', rivalAbility = 'swift-swim') => {
  const move = createMove();
  const surfer = createPokemon({
    id: 1,
    name: 'Surfista',
    speedStat: 100,
    ability: 'surge-surfer',
    moves: [move],
  });
  const rival = createPokemon({
    id: 2,
    name: 'Rival',
    speedStat: 150,
    ability: rivalAbility,
    moves: [move],
  });
  const state = createBattleState([surfer], [rival], {
    terrain,
    prngState: createBattlePRNGState(4114),
  });
  const actions = [
    { type: 'move' as const, data: move, user: surfer, playerNum: 1 as const },
    { type: 'move' as const, data: move, user: rival, playerNum: 2 as const },
  ];

  return { state, actions };
};

const order = (state: ReturnType<typeof buildTurn>['state'], actions: ReturnType<typeof buildTurn>['actions']) =>
  getSortedActions(actions, state).map(action => action.playerNum);

describe('4.1.1 Surge Surfer muda a ordem somente no terreno elétrico', () => {
  it('não dobra a velocidade fora do terreno', () => {
    const { state, actions } = buildTurn('none');
    expect(order(state, actions)).toEqual([2, 1]);
  });

  it('dobra a velocidade no terreno elétrico ao ordenar ações', () => {
    const { state, actions } = buildTurn('electric');
    expect(order(state, actions)).toEqual([1, 2]);
  });

  it('não dobra a velocidade em outro terreno', () => {
    const { state, actions } = buildTurn('grassy');
    expect(order(state, actions)).toEqual([2, 1]);
  });

  it('respeita a supressão da habilidade pelo Gás Neutralizante', () => {
    const { state, actions } = buildTurn('electric', 'neutralizing-gas');
    expect(order(state, actions)).toEqual([2, 1]);
  });

  it('getEffectiveSpeed aplica terreno e supressão', () => {
    const surfer = createPokemon({ speedStat: 100, ability: 'surge-surfer' });
    const base = getEffectiveSpeed(surfer, 'none', false, 'none', false);

    expect(getEffectiveSpeed(surfer, 'none', false, 'electric', false)).toBe(base * 2);
    expect(getEffectiveSpeed(surfer, 'none', false, 'electric', true)).toBe(base);
  });
});