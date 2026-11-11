
import { BattleState, Action, BattleConfig, LogEntry, Pokemon } from '../../types';
import * as BattleEngine from './index';
import * as AirLock from './handlers/abilities/air_lock';
import { getSortedActions } from './actions';

export type TurnPhase = 
  | 'start' 
  | 'before-action' 
  | 'after-action' 
  | 'switch-forced' 
  | 'faint-switch' 
  | 'turn-end' 
  | 'game-over';

export interface TurnStepResult {
  state: BattleState;
  logs: LogEntry[];
  phase: TurnPhase;
  activeActorId?: number; // Para animação de ataque
  targetId?: number;      // Para animação de dano
  actionType?: 'move' | 'switch' | 'item';
  damageDealt?: boolean;
  switchPrompt?: {
    player: 1 | 2;
    isBatonPass?: boolean;
    canCancel: boolean;
  };
  winner?: 1 | 2 | 'draw';
}

function log(logs: LogEntry[], message: string, color: string = 'text-gray-700') {
  logs.push({ message, color });
}

export class BattleCoordinator {
  static *runTurn(
    initialState: BattleState,
    p1Action: Action | undefined,
    p2Action: Action | undefined,
    config: BattleConfig
  ): Generator<TurnStepResult, void, void> {
    let state = { ...initialState };
    const stepLogs: LogEntry[] = [];

    // --- FASE 1: INÍCIO DO TURNO ---
    log(stepLogs, `--- Início do Turno ${state.turn} ---`, 'text-blue-900 font-bold bg-blue-100 p-1 rounded text-center mb-2 mt-4');
    
    // Reset de flags de turno
    [state.currentPokemon1, state.currentPokemon2].forEach(p => {
        if (p) {
            p.movedThisTurn = false;
            // Identifica qual ação pertence a este pokemon
            const action = (p.id === p1Action?.user.id) ? p1Action : (p.id === p2Action?.user.id ? p2Action : null);
            p.selectedMove = action?.type === 'move' ? action.data : null;
        }
    });

    yield {
      state,
      logs: [...stepLogs],
      phase: 'start'
    };
    
    // Limpa logs locais para os próximos passos
    stepLogs.length = 0;

    // --- FASE 2: ORDENAÇÃO E EXECUÇÃO DE AÇÕES ---
    const originalActions = [p1Action, p2Action].filter((a): a is Action => !!a);
    originalActions.forEach(a => {
        if (a.tieBreaker === undefined) a.tieBreaker = Math.random();
    });
    let pendingActions = [...originalActions];

    // Loop de execução (respeitando Speed dinâmico)
    while (pendingActions.length > 0 && state.isBattleInProgress) {
        // Remove ações inválidas (ex: usuário desmaiou, exceto itens que podem ter lógica específica se implementada)
        pendingActions = pendingActions.filter(act => !act.user.isFainted || act.type === 'item');
        
        if (pendingActions.length === 0) break;

        // Reordena baseado na velocidade atual (dynamic speed tiers)
        const sortedPending = getSortedActions(pendingActions, state);
        const currentAction = sortedPending[0];
        
        // Remove da fila
        pendingActions = pendingActions.filter(a => a !== currentAction);

        // --- SUB-FASE: PREPARAÇÃO VISUAL (Animação de Ataque) ---
        if (currentAction.type === 'move') {
             yield {
                 state,
                 logs: [],
                 phase: 'before-action',
                 activeActorId: currentAction.user.id,
                 actionType: 'move'
             };
        }

        // --- SUB-FASE: EXECUÇÃO ---
        let executionLogs: LogEntry[] = [];
        let moveDidDamage = false;
        let switchRequested = false;
        let defenderSwitchRequested = false;
        let isBatonPass = false;
        let targetId: number | undefined;

        if (currentAction.type === 'switch') {
            const res = BattleEngine.performSwitch(
                state, 
                currentAction.data, 
                currentAction.playerNum, 
                config.weatherEnabled
            );
            state = res.newState;
            executionLogs = res.logs;
        } 
        else if (currentAction.type === 'item') {
            const target = currentAction.playerNum === 1 
                  ? state.team1.find(p => p.id === currentAction.data.targetId) 
                  : state.team2.find(p => p.id === currentAction.data.targetId);
            
            if (target) {
                const actionType = currentAction.data.isGive ? 'give' : 'use';
                const res = BattleEngine.executeItemAction(
                    state, 
                    currentAction.user, 
                    target, 
                    currentAction.data.itemId, 
                    actionType, 
                    executionLogs, 
                    currentAction.playerNum,
                    currentAction.data.moveName
                );
                state = res.newState;
            }
        } 
        else if (currentAction.type === 'move') {
            const target = currentAction.playerNum === 1 ? state.currentPokemon2 : state.currentPokemon1;
            
            if (target && !target.isFainted) {
                targetId = target.id;
                // Ação oposta para referência (Sucker Punch, etc)
                const defenderAction = originalActions.find(a => a.playerNum !== currentAction.playerNum);
                
                const res = BattleEngine.executeMove(
                    state, 
                    currentAction.user, 
                    target, 
                    currentAction.data, 
                    config, 
                    defenderAction, 
                    false, 
                    currentAction.shouldTerastallize,
                    false, // isSleepTalkTriggered
                    currentAction.shouldMegaEvolve // shouldMegaEvolve
                );

                state = res.newState;
                executionLogs = res.logs;
                // --- CORREÇÃO DE ANIMAÇÃO DE DANO PREMATURO ---
                // Agora confiamos na flag explícita da engine em vez de heurística
                moveDidDamage = !!res.damageDealt;
                
                switchRequested = !!res.switchRequested && !res.fainted;
                defenderSwitchRequested = !!res.defenderSwitchRequested && !res.fainted;
                isBatonPass = !!res.isBatonPass;
                
                currentAction.user.movedThisTurn = true;
            }
        }

        // --- SUB-FASE: RESULTADO DA AÇÃO ---
        yield {
            state,
            logs: executionLogs,
            phase: 'after-action',
            activeActorId: currentAction.user.id,
            targetId: targetId,
            damageDealt: moveDidDamage,
            actionType: currentAction.type
        };

        // --- SUB-FASE: CHECAGEM DE TROCA FORÇADA (Mid-Turn) ---
        // Se alguém foi forçado a trocar (U-Turn, Eject Button, Red Card), o turno pausa ou encerra a sequência
        if (switchRequested) {
            const team = currentAction.playerNum === 1 ? state.team1 : state.team2;
            const hasHealthy = team.some(p => !p.isFainted && p.id !== currentAction.user.id);
            
            if (hasHealthy) {
                yield {
                    state,
                    logs: [],
                    phase: 'switch-forced',
                    switchPrompt: {
                        player: currentAction.playerNum,
                        isBatonPass,
                        canCancel: false
                    }
                };
                // Nota: O loop de ações é interrompido em trocas forçadas para manter a integridade do fluxo
                // (O App deve lidar com o input e depois retomar/finalizar)
                return; 
            }
        }

        if (defenderSwitchRequested) {
            const defenderNum = currentAction.playerNum === 1 ? 2 : 1;
            const defTeam = defenderNum === 1 ? state.team1 : state.team2;
            const defActive = defenderNum === 1 ? state.currentPokemon1 : state.currentPokemon2;
            const hasHealthy = defTeam.some(p => !p.isFainted && p.id !== defActive?.id);

            if (hasHealthy) {
                yield {
                    state,
                    logs: [],
                    phase: 'switch-forced',
                    switchPrompt: {
                        player: defenderNum,
                        canCancel: false
                    }
                };
                return;
            }
        }

        // Se alguém desmaiou no meio do turno, o loop para para processar a troca
        if (state.currentPokemon1?.isFainted || state.currentPokemon2?.isFainted) {
            break;
        }
    }

    // --- FASE 3: FIM DO TURNO (Efeitos Residuais) ---
    // Só executa se ninguém estiver "preso" em uma troca forçada pendente (já tratado nos returns acima)
    const endLogs: LogEntry[] = [];
    // NOTA: O log de Fim de Turno foi removido para melhorar a fluidez visual. 
    // Os efeitos residuais (clima, status) aparecerão logo após o último golpe, 
    // e o separador será o "Início do Turno X" seguinte.

    const endRes = BattleEngine.processTurnEnd(state, config);
    state = endRes.newState;
    
    // Combina logs de separador + logs de efeitos
    const finalEndLogs = [...endLogs, ...endRes.logs];

    yield {
        state,
        logs: finalEndLogs,
        phase: 'turn-end'
    };

    // --- FASE 4: VERIFICAÇÃO DE VITÓRIA E DESMAIOS ---
    const winner = this.checkWinner(state);
    if (winner) {
        yield {
            state: { ...state, winner, isBattleInProgress: false, waitingForAction: false },
            logs: [],
            phase: 'game-over',
            winner
        };
        return;
    }

    // Verifica se alguém precisa trocar (Desmaio pós-turno ou mid-turn)
    if (state.currentPokemon1?.isFainted || state.currentPokemon2?.isFainted) {
        yield {
            state,
            logs: [],
            phase: 'faint-switch'
        };
    }
  }

  private static checkWinner(state: BattleState): 1 | 2 | 'draw' | undefined {
      const p1Defeated = state.team1.every(p => p.isFainted);
      const p2Defeated = state.team2.every(p => p.isFainted);

      if (p1Defeated && p2Defeated) return 'draw';
      if (p2Defeated) return 1;
      if (p1Defeated) return 2;
      return undefined;
  }
}
