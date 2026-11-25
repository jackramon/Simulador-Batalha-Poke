import type { Action, BattleState, Move, Pokemon } from '../../types';
import { resolvePokemonTarget, restoreActivePokemonIdentity } from '../../utils/pokemonIdentity';

// structuredClone preserva aliases válidos; a restauração repara estados externos já separados.
export const cloneBattleState = (state: BattleState): BattleState =>
  restoreActivePokemonIdentity(structuredClone(state));

export interface BattleDraft {
  state: BattleState;
  ownsDraft: boolean;
}

const activeDrafts = new WeakSet<BattleState>();

export const acquireBattleDraft = (currentState: BattleState): BattleDraft => {
  if (activeDrafts.has(currentState)) {
    return { state: currentState, ownsDraft: false };
  }

  const state = cloneBattleState(currentState);
  activeDrafts.add(state);
  return { state, ownsDraft: true };
};

export const releaseBattleDraft = (draft: BattleDraft): void => {
  if (draft.ownsDraft) activeDrafts.delete(draft.state);
};

export const preserveBattleDraftState = (
  currentState: BattleState,
  nextState: BattleState,
): BattleState => {
  if (currentState === nextState || !activeDrafts.has(currentState)) return nextState;

  // Resultados rasos internos continuam na mesma raiz transacional ativa.
  Object.assign(currentState, nextState);
  return currentState;
};

export const rehydratePokemon = (
  state: BattleState,
  pokemon: Pokemon,
  playerNum?: 1 | 2,
): Pokemon => {
  const teams = playerNum === 1
    ? [state.team1]
    : playerNum === 2
      ? [state.team2]
      : [state.team1, state.team2];

  for (const team of teams) {
    const resolved = resolvePokemonTarget(team, pokemon.instanceId, pokemon.id);
    if (resolved) return resolved;
  }

  // Dados fora da equipe não podem manter referências com o objeto recebido.
  return structuredClone(pokemon);
};

export const rehydrateMove = (pokemon: Pokemon, move: Move): Move =>
  pokemon.moves.find(candidate => candidate.name === move.name) ?? structuredClone(move);

export const rehydrateAction = (state: BattleState, action: Action): Action => {
  const draftAction = structuredClone(action);
  draftAction.user = rehydratePokemon(state, action.user, action.playerNum);

  if (action.type === 'move') {
    draftAction.data = rehydrateMove(draftAction.user, action.data as Move);
  } else if (action.type === 'switch') {
    draftAction.data = rehydratePokemon(state, action.data as Pokemon, action.playerNum);
  }

  return draftAction;
};
