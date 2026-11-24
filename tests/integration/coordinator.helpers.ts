import type { TurnStepResult } from '../../services/engine/coordinator';
import { BattleCoordinator } from '../../services/engine/coordinator';
import type { Action, BattleConfig, BattleState, Move, Pokemon } from '../../types';
import { disableDeterministicRandom, enableDeterministicRandom } from '../../utils/prng';

export interface CompletedTurn {
  steps: TurnStepResult[];
  stateSnapshots: BattleState[];
  finalState: BattleState;
  completed: boolean;
}

interface RunCoordinatorTurnOptions {
  seed: number;
  initialState: BattleState;
  p1Action?: Action;
  p2Action?: Action;
  config: BattleConfig;
  chooseForcedSwitch?: (step: TurnStepResult) => Action | undefined;
}

export const createBattleConfig = (overrides: Partial<BattleConfig> = {}): BattleConfig => ({
  p1Mode: 'manual',
  p1TeamSize: 1,
  p1Input: '',
  p2Mode: 'manual',
  p2TeamSize: 1,
  p2Input: '',
  opponentMode: 'manual',
  weatherEnabled: false,
  terrainEnabled: false,
  itemsEnabled: true,
  terastallizationEnabled: false,
  megaEvolutionEnabled: false,
  moveLimitEnabled: true,
  p1AutoMode: false,
  randomIvs: false,
  randomLevels: false,
  ...overrides,
});

const createAction = (
  type: Action['type'],
  data: Action['data'],
  user: Pokemon,
  playerNum: 1 | 2,
): Action => ({
  type,
  data,
  user,
  playerNum,
  tieBreaker: playerNum === 1 ? 0.25 : 0.75,
});

export const createMoveAction = (
  user: Pokemon,
  move: Move,
  playerNum: 1 | 2,
): Action => createAction('move', move, user, playerNum);

export const createSwitchAction = (
  user: Pokemon,
  target: Pokemon,
  playerNum: 1 | 2,
): Action => createAction('switch', target, user, playerNum);

export const createItemAction = (
  user: Pokemon,
  targetId: number,
  itemId: string,
  playerNum: 1 | 2,
): Action => createAction('item', { targetId, itemId, isGive: false }, user, playerNum);

export const runCoordinatorTurn = ({
  seed,
  initialState,
  p1Action,
  p2Action,
  config,
  chooseForcedSwitch,
}: RunCoordinatorTurnOptions): CompletedTurn => {
  const steps: TurnStepResult[] = [];
  const stateSnapshots: BattleState[] = [];
  let completed = false;

  enableDeterministicRandom(seed);
  try {
    const generator = BattleCoordinator.runTurn(initialState, p1Action, p2Action, config);

    let next = generator.next();
    while (true) {
      if (next.done === true) {
        completed = true;
        break;
      }

      const step: TurnStepResult = next.value;
      steps.push(step);
      // O motor reutiliza objetos entre yields; a cópia preserva o estado daquela fase.
      stateSnapshots.push(structuredClone(step.state));
      const forcedSwitchAction = step.phase === 'switch-forced'
        ? chooseForcedSwitch?.(step)
        : undefined;
      next = generator.next(forcedSwitchAction);
    }

    const finalState = steps[steps.length - 1]?.state;
    if (!finalState) {
      throw new Error('O coordenador terminou sem produzir estado');
    }

    return { steps, stateSnapshots, finalState, completed };
  } finally {
    disableDeterministicRandom();
  }
};
