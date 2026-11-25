
import React, { useState, useEffect, useRef } from 'react';
import { Action, Pokemon, BattleState, BattleConfig, BattleReplay } from '../types';
import * as BattleEngine from '../services/engine';
import { decideAIAction, chooseBestSwitch } from '../services/aiLogic';
import * as AirLock from '../services/engine/handlers/abilities/air_lock';
import { BattleCoordinator } from '../services/engine/coordinator';
import type { TurnStepResult } from '../services/engine/coordinator';
import { calculateTypeEffectiveness } from '../services/battleUtils';
import { TurnAnimator } from '../services/animation/turnAnimator';
import { removerItem } from '../utils/safeStorage';
import { isPokemonOnTeam, resolvePokemonTarget } from '../utils/pokemonIdentity';
import { createBattleReplayEvent } from '../services/replayLogic';
import { BattleSession, type TurnResolutionToken } from '../services/battleSession';

interface TurnManagerProps {
    state: BattleState;
    setState: React.Dispatch<React.SetStateAction<BattleState>>;
    stateRef: React.MutableRefObject<BattleState>;
    config: BattleConfig;
    configRef: React.MutableRefObject<BattleConfig>;
    updateStateWithLogs: (newState: BattleState, logs: any[], resolution?: TurnResolutionToken) => void;
    battleSession: BattleSession;
    currentReplay: BattleReplay | null;
    setCurrentReplay: React.Dispatch<React.SetStateAction<BattleReplay | null>>;
    // UI Helpers
    uiActions: {
        setAnimationState: (state: any) => void;
        setShowSwitchModal: (modal: any) => void;
        setShowBagModal: (show: boolean) => void;
        setAiHighlightingMember: (id: number | null) => void;
        p1AiSelectedMove: string | null;
        setP1AiSelectedMove: (move: string | null) => void;
        setP1AiBagSelection: (sel: any) => void;
        setIsTeraToggled: (t: boolean) => void;
        isTeraToggled: boolean;
        setIsMegaToggled: (t: boolean) => void; // New
        isMegaToggled: boolean; // New
        showSwitchModal: any;
        setP1Action: React.Dispatch<React.SetStateAction<Action | null>>;
        setP2Action: React.Dispatch<React.SetStateAction<Action | null>>;
        p1Action: Action | null;
        p2Action: Action | null;
    }
}

export const useTurnManager = ({ 
    state, setState, stateRef, config, configRef, updateStateWithLogs, battleSession,
    currentReplay, setCurrentReplay, uiActions
}: TurnManagerProps) => {
    
    const { p1Action, setP1Action, p2Action, setP2Action } = uiActions;
    const forcedSwitchResolverRef = useRef<((action: Action | null) => void) | null>(null);
    const aiRequestIdsRef = useRef<Record<1 | 2, number>>({ 1: 0, 2: 0 });

    // Encerrar a sessão solta awaits, timers e intenções de qualquer geração anterior.
    useEffect(() => battleSession.onInvalidate(reason => {
        forcedSwitchResolverRef.current?.(null);
        forcedSwitchResolverRef.current = null;
        aiRequestIdsRef.current[1] += 1;
        aiRequestIdsRef.current[2] += 1;
        setP1Action(null);
        setP2Action(null);
        uiActions.setAnimationState(null);
        uiActions.setShowSwitchModal(null);
        uiActions.setShowBagModal(false);
        uiActions.setAiHighlightingMember(null);
        uiActions.setP1AiSelectedMove(null);
        uiActions.setP1AiBagSelection(null);
        uiActions.setIsTeraToggled(false);
        uiActions.setIsMegaToggled(false);
        if (reason === 'invalidate') setCurrentReplay(null);
    }), [battleSession]);

    const recordAction = (player: 1 | 2, type: 'move' | 'switch' | 'item', data: any, shouldTerastallize?: boolean, shouldMegaEvolve?: boolean, isForcedSwitch?: boolean, isBatonPass?: boolean, resolution?: TurnResolutionToken) => {
        const sessionId = resolution?.sessionId ?? battleSession.sessionId;
        const isCurrent = () => battleSession.isCurrent(sessionId)
            && (!resolution || battleSession.isResolutionCurrent(resolution));
        const canCommit = () => battleSession.isCurrent(sessionId)
            && (!resolution || battleSession.canCommitResolution(resolution));
        if (!isCurrent()) return;
        // Construir o event DENTRO do functional updater garante `prev` atualizado
        // e impede que uma resolução antiga grave no replay de outra batalha.
        setCurrentReplay(prev => {
            if (!prev || !canCommit()) return prev;
            const currentTurn = stateRef.current.turn;
            const user = player === 1 ? stateRef.current.currentPokemon1 : stateRef.current.currentPokemon2;
            if (!user) return prev;
            const event = createBattleReplayEvent({
                turn: currentTurn,
                player,
                type,
                data,
                user,
                shouldTerastallize,
                shouldMegaEvolve,
                isForcedSwitch,
                isBatonPass,
            });
            return { ...prev, events: [...prev.events, event] };
        });
    };

    const handlePlayerAction = (player: 1 | 2, type: 'move' | 'switch' | 'item', data: any, isForcedSwitch?: boolean, isBatonPass?: boolean, resolution?: TurnResolutionToken) => {
        const sessionId = battleSession.sessionId;
        if (!battleSession.isCurrent(sessionId)) return;
        const resumeForcedSwitch = type === 'switch' ? forcedSwitchResolverRef.current : null;
        // Uma resolução ativa só aceita a escolha que ela própria solicitou.
        if (battleSession.activeResolution && !resumeForcedSwitch) return;

        const user = player === 1 ? state.currentPokemon1 : state.currentPokemon2;
        if (!user) return;
        const shouldTerastallize = (player === 1 && type === 'move' && uiActions.isTeraToggled) ? true : undefined;
        const shouldMegaEvolve = (player === 1 && type === 'move' && uiActions.isMegaToggled) ? true : undefined;
        
        const act: Action = { 
            type, 
            data, 
            user, 
            playerNum: player, 
            priority: type === 'move' ? (data.priority || 0) : 6, 
            shouldTerastallize,
            shouldMegaEvolve 
        };

        recordAction(player, type, data, shouldTerastallize, shouldMegaEvolve, isForcedSwitch, isBatonPass, resolution);
        if (!battleSession.isCurrent(sessionId)) return;

        if (resumeForcedSwitch) {
            forcedSwitchResolverRef.current = null;
            resumeForcedSwitch(act);
            return;
        }

        aiRequestIdsRef.current[player] += 1;
        if (player === 1) {
            setP1Action(act);
            if (configRef.current.opponentMode === 'auto') triggerAI();
        } else setP2Action(act);
    };

    const handleBagAction = (type: 'use' | 'give', itemId: string, targetId: number, targetInstanceId?: string, moveName?: string) => {
        const sessionId = battleSession.sessionId;
        if (!battleSession.isCurrent(sessionId) || battleSession.activeResolution) return;
        uiActions.setShowBagModal(false);

        const target = resolvePokemonTarget([...state.team1, ...state.team2], targetInstanceId, targetId);
        if (!target) return;

        const playerNum: 1 | 2 = isPokemonOnTeam(target, state.team1) ? 1 : 2;
        const data = { itemId, targetId, targetInstanceId: target.instanceId, isGive: type === 'give', moveName };
        handlePlayerAction(playerNum, 'item', data);
    };

    const handleRunAway = () => {
        battleSession.invalidate();
        setState(prev => ({ ...prev, isBattleInProgress: false, winner: null, waitingForAction: false }));
        setP1Action(null);
        setP2Action(null);
        removerItem('poke_sim_battle_state'); // Hardcoded key match
    };

    const triggerAI = () => {
        const sessionId = battleSession.sessionId;
        const turn = stateRef.current.turn;
        const actorInstanceId = stateRef.current.currentPokemon2?.instanceId;
        const requestId = ++aiRequestIdsRef.current[2];
        const isCurrent = () => battleSession.isCurrent(sessionId)
            && aiRequestIdsRef.current[2] === requestId
            && stateRef.current.isBattleInProgress
            && !stateRef.current.winner
            && stateRef.current.turn === turn
            && stateRef.current.currentPokemon2?.instanceId === actorInstanceId;
        if (!isCurrent()) return;
        setState(prev => isCurrent() ? {...prev, waitingForAction: true} : prev);
        battleSession.schedule(sessionId, async () => {
            if (!isCurrent()) return;
            const currentState = stateRef.current;
            const p2 = currentState.currentPokemon2!; 
            const p1 = currentState.currentPokemon1!;
            if (!p2 || p2.isFainted || !p1) return;
            const isSuppressed = AirLock.isWeatherSuppressed(currentState);
            
            let aiAction;
            if (configRef.current.useLLM) {
                const { decideLLMAction } = await import('../services/llmAiLogic');
                if (!isCurrent()) return;
                aiAction = await decideLLMAction(
                    p2, p1, currentState.team2, currentState.team1, 
                    isSuppressed ? 'none' : currentState.weather, 
                    configRef.current.moveLimitEnabled, 
                    configRef.current.itemsEnabled ? currentState.p2Inventory : undefined, 
                    configRef.current.terastallizationEnabled, 
                    currentState.p2TeraUsed || false,
                    currentState,
                    configRef.current.megaEvolutionEnabled,
                    currentState.p2MegaUsed || false,
                    configRef.current.llmProvider,
                    configRef.current.llmModel
                );
            } else {
                aiAction = decideAIAction(
                    p2, p1, currentState.team2, currentState.team1, 
                    isSuppressed ? 'none' : currentState.weather, 
                    configRef.current.moveLimitEnabled, 
                    configRef.current.itemsEnabled ? currentState.p2Inventory : undefined, 
                    configRef.current.terastallizationEnabled, 
                    currentState.p2TeraUsed,
                    currentState,
                    configRef.current.megaEvolutionEnabled,
                    currentState.p2MegaUsed
                );
            }
            if (!isCurrent() || !aiAction) return;
            
            recordAction(2, aiAction.type, aiAction.data, aiAction.shouldTerastallize, aiAction.shouldMegaEvolve);
            if (isCurrent()) setP2Action(aiAction);
        }, 1000);
    };

    const triggerP1AI = () => {
        const sessionId = battleSession.sessionId;
        const turn = stateRef.current.turn;
        const actorInstanceId = stateRef.current.currentPokemon1?.instanceId;
        const requestId = ++aiRequestIdsRef.current[1];
        const isCurrent = () => battleSession.isCurrent(sessionId)
            && aiRequestIdsRef.current[1] === requestId
            && stateRef.current.isBattleInProgress
            && !stateRef.current.winner
            && stateRef.current.turn === turn
            && stateRef.current.currentPokemon1?.instanceId === actorInstanceId;
        if (!isCurrent()) return;

        const currentState = stateRef.current;
        const p1 = currentState.currentPokemon1; 
        const p2 = currentState.currentPokemon2;
        if (!p1 || p1.isFainted || !p2) return;
        
        const executeP1AI = async () => {
            const isSuppressed = AirLock.isWeatherSuppressed(currentState);
            let aiAction;
            
            if (configRef.current.useLLM) {
                const { decideLLMAction } = await import('../services/llmAiLogic');
                if (!isCurrent()) return;
                aiAction = await decideLLMAction(
                    p1, p2, currentState.team1, currentState.team2, 
                    isSuppressed ? 'none' : currentState.weather, 
                    configRef.current.moveLimitEnabled, 
                    configRef.current.itemsEnabled ? currentState.p1Inventory : undefined,
                    configRef.current.terastallizationEnabled,
                    currentState.p1TeraUsed || false,
                    currentState,
                    configRef.current.megaEvolutionEnabled,
                    currentState.p1MegaUsed || false,
                    configRef.current.llmProvider,
                    configRef.current.llmModel
                );
            } else {
                aiAction = decideAIAction(
                    p1, p2, currentState.team1, currentState.team2, 
                    isSuppressed ? 'none' : currentState.weather, 
                    configRef.current.moveLimitEnabled, 
                    configRef.current.itemsEnabled ? currentState.p1Inventory : undefined,
                    configRef.current.terastallizationEnabled,
                    currentState.p1TeraUsed,
                    currentState,
                    configRef.current.megaEvolutionEnabled,
                    currentState.p1MegaUsed
                );
            }
            if (!isCurrent() || !aiAction) return;
            
            if (aiAction.type === 'move') {
                uiActions.setP1AiSelectedMove(aiAction.data.name);
                if (aiAction.shouldTerastallize) uiActions.setIsTeraToggled(true);
                // Se a IA decidiu Mega Evoluir, ligamos o toggle visualmente (feedback)
                if (aiAction.shouldMegaEvolve) uiActions.setIsMegaToggled(true);
                
                battleSession.schedule(sessionId, () => {
                    if (!isCurrent()) return;
                    handlePlayerAction(1, 'move', aiAction.data); 
                    // Atualiza a ação pendente com as flags corretas se não foram passadas pelo handle
                    setP1Action(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            shouldTerastallize: aiAction.shouldTerastallize,
                            shouldMegaEvolve: aiAction.shouldMegaEvolve
                        };
                    });
                    uiActions.setP1AiSelectedMove(null); 
                }, 3000);
            } else if (aiAction.type === 'switch') {
                uiActions.setShowSwitchModal({player: 1, canCancel: false}); 
                uiActions.setAiHighlightingMember(aiAction.data.id);
                setState(prev => isCurrent() ? {...prev, waitingForAction: true} : prev);
                battleSession.schedule(sessionId, () => {
                    if (!isCurrent()) return;
                    uiActions.setAiHighlightingMember(null); 
                    uiActions.setShowSwitchModal(null); 
                    handlePlayerAction(1, 'switch', aiAction.data); 
                }, 3000);
            } else if (aiAction.type === 'item') {
                const { itemId, targetId, targetInstanceId, isGive, moveName } = aiAction.data;
                uiActions.setP1AiBagSelection({ itemId, targetId, targetInstanceId, isGive, moveName });
                uiActions.setShowBagModal(true);
                setState(prev => isCurrent() ? {...prev, waitingForAction: true} : prev);
                battleSession.schedule(sessionId, () => {
                    if (!isCurrent()) return;
                    uiActions.setShowBagModal(false);
                    uiActions.setP1AiBagSelection(null);
                    handleBagAction(isGive ? 'give' : 'use', itemId, targetId, targetInstanceId, moveName);
                }, 4000); 
            }
        };
        
        executeP1AI();
    };

    const checkFaintedSwitch = async (currentState: BattleState, resolution?: TurnResolutionToken) => {
        const sessionId = resolution?.sessionId ?? battleSession.sessionId;
        const isCurrent = () => battleSession.isCurrent(sessionId)
            && (!resolution || battleSession.isResolutionCurrent(resolution));
        if (!isCurrent()) return;

        // --- GAME OVER CHECK ---
        const p1Defeated = currentState.team1.every(p => p.isFainted);
        const p2Defeated = currentState.team2.every(p => p.isFainted);
        const finish = (winner: number | 'draw') => {
            if (!isCurrent()) return;
            setState(prev => isCurrent() ? {...prev, winner, isBattleInProgress: false, waitingForAction: false} : prev);
            battleSession.terminate();
        };

        if (p1Defeated && p2Defeated) { finish('draw'); return; }
        if (p1Defeated) { finish(2); return; }
        if (p2Defeated) { finish(1); return; }

        if (currentState.currentPokemon1?.isFainted || currentState.currentPokemon2?.isFainted) {
            if (currentState.currentPokemon1?.isFainted) {
                if (configRef.current.p1AutoMode) {
                    setState(prev => isCurrent() ? {...prev, waitingForAction: true} : prev);
                    if (isCurrent()) uiActions.setShowSwitchModal({player: 1, canCancel: false});
                    
                    const healthy = currentState.team1.filter(p => !p.isFainted);
                    if (healthy.length > 0) {
                        let bestCandidate = healthy[0];
                        let bestScore = -Infinity;
                        const opponent = currentState.currentPokemon2;

                        if (opponent && !opponent.isFainted) {
                            for (const candidate of healthy) {
                                let score = 0;
                                for (const move of candidate.moves) {
                                    if (move.damageClass !== 'status') {
                                        const eff = calculateTypeEffectiveness(move.type, opponent.types, opponent.ability);
                                        if (eff.multiplier > 1) score += 2;
                                        else if (eff.multiplier < 1) score -= 1;
                                    }
                                }
                                for (const type of opponent.types) {
                                    const eff = calculateTypeEffectiveness(type, candidate.types, candidate.ability);
                                    if (eff.multiplier < 1) score += 2; 
                                    else if (eff.multiplier > 1) score -= 3; 
                                }
                                if (candidate.speedStat > opponent.speedStat) score += 1;

                                if (score > bestScore) {
                                    bestScore = score;
                                    bestCandidate = candidate;
                                }
                            }
                        } else {
                            bestCandidate = healthy[0]; // Removed Math.random() to prevent PRNG desync
                        }
                        
                        const nextMon = bestCandidate;
                        if (isCurrent()) uiActions.setAiHighlightingMember(nextMon.id);
                        if (!await battleSession.wait(sessionId, 3000) || !isCurrent()) return;
                        recordAction(1, 'switch', nextMon, undefined, undefined, true, false, resolution);
                        if (!isCurrent()) return;
                        const sRes = BattleEngine.performSwitch(currentState, nextMon, 1, configRef.current.weatherEnabled);
                        if (!isCurrent()) return;
                        currentState = { ...sRes.newState, waitingForAction: false };
                        updateStateWithLogs(currentState, sRes.logs, resolution);
                    }
                    if (!isCurrent()) return;
                    uiActions.setAiHighlightingMember(null);
                    uiActions.setShowSwitchModal(null);
                    setState(prev => isCurrent() ? {...prev, waitingForAction: false} : prev);
                } else {
                    const healthy = currentState.team1.filter(p => !p.isFainted);
                    if (healthy.length === 1) {
                        if (!await battleSession.wait(sessionId, 1000) || !isCurrent()) return;
                        recordAction(1, 'switch', healthy[0], undefined, undefined, true, false, resolution);
                        if (!isCurrent()) return;
                        const sRes = BattleEngine.performSwitch(currentState, healthy[0], 1, configRef.current.weatherEnabled);
                        if (!isCurrent()) return;
                        currentState = { ...sRes.newState, waitingForAction: false };
                        updateStateWithLogs(currentState, sRes.logs, resolution);
                    } else if (healthy.length > 1) {
                        if (isCurrent()) uiActions.setShowSwitchModal({player: 1, canCancel: false});
                    }
                }
            }
            
            if (currentState.currentPokemon2?.isFainted) {
                if (configRef.current.opponentMode === 'auto') {
                    const healthy = currentState.team2.filter(p => !p.isFainted);
                    let next: Pokemon | undefined | null;
                    if (currentState.currentPokemon1 && !currentState.currentPokemon1.isFainted) {
                        next = chooseBestSwitch(healthy, currentState.currentPokemon1);
                    } else {
                        next = healthy[0];
                    }

                    if(next) {
                        if (!isCurrent()) return;
                        recordAction(2, 'switch', next, undefined, undefined, true, false, resolution);
                        if (!isCurrent()) return;
                        const res = BattleEngine.performSwitch(currentState, next, 2, configRef.current.weatherEnabled);
                        if (!isCurrent()) return;
                        currentState = { ...res.newState, waitingForAction: false };
                        updateStateWithLogs(currentState, res.logs, resolution);
                    }
                } else {
                    const healthy = currentState.team2.filter(p => !p.isFainted);
                    if (healthy.length === 1) {
                        if (!await battleSession.wait(sessionId, 1000) || !isCurrent()) return;
                        recordAction(2, 'switch', healthy[0], undefined, undefined, true, false, resolution);
                        if (!isCurrent()) return;
                        const sRes = BattleEngine.performSwitch(currentState, healthy[0], 2, configRef.current.weatherEnabled);
                        if (!isCurrent()) return;
                        currentState = { ...sRes.newState, waitingForAction: false };
                        updateStateWithLogs(currentState, sRes.logs, resolution);
                    } else if (healthy.length > 1) {
                        if (isCurrent()) uiActions.setShowSwitchModal({player: 2, canCancel: false});
                    }
                }
            }
        }
    };

    const resolveTurn = async () => {
        const sessionId = battleSession.sessionId;
        if (!p1Action || !p2Action || !state.isBattleInProgress || state.winner) return;
        const resolution = battleSession.beginResolution(sessionId, stateRef.current.turn);
        if (!resolution) return;
        const isCurrent = () => battleSession.isResolutionCurrent(resolution);

        try {
            const coordinator = BattleCoordinator.runTurn(stateRef.current, p1Action, p2Action, configRef.current);
            let nextResult = coordinator.next();

            while (isCurrent()) {
                if (nextResult.done) break;
                const step = nextResult.value as TurnStepResult;
                if (step.state) {
                    updateStateWithLogs(step.state, step.logs, resolution);
                }
                if (!isCurrent()) return;

                await TurnAnimator.processStep(step, uiActions, 1, battleSession.signal);
                if (!isCurrent()) return;

                if (step.phase === 'game-over') {
                    battleSession.terminate();
                    return;
                }

                if (step.phase === 'switch-forced' && step.switchPrompt) {
                    const { player, isBatonPass, canCancel } = step.switchPrompt;
                    const isAutomatic = player === 2 || configRef.current.p1AutoMode;
                    const forcedSwitchAction = await new Promise<Action | null>(resolve => {
                        if (!isCurrent()) { resolve(null); return; }
                        forcedSwitchResolverRef.current = resolve;

                        if (!isAutomatic) {
                            uiActions.setShowSwitchModal({ player, canCancel, isBatonPass });
                            return;
                        }

                        const currentState = step.state;
                        const team = player === 1 ? currentState.team1 : currentState.team2;
                        const active = player === 1 ? currentState.currentPokemon1 : currentState.currentPokemon2;
                        const healthy = team.filter(p => !p.isFainted && p !== active);
                        const next = healthy[0]; // Sem Math.random para preservar o PRNG do replay.
                        if (next) {
                            handlePlayerAction(player, 'switch', next, !isBatonPass, isBatonPass, resolution);
                        } else {
                            forcedSwitchResolverRef.current = null;
                            resolve(null);
                        }
                    });

                    if (!isCurrent()) return;
                    uiActions.setShowSwitchModal(null);
                    if (!forcedSwitchAction) return;
                    if (isAutomatic && !await battleSession.wait(sessionId, 1000)) return;
                    if (!isCurrent()) return;
                    nextResult = coordinator.next(forcedSwitchAction);
                    continue;
                }

                if (step.phase === 'faint-switch') {
                    await checkFaintedSwitch(step.state, resolution);
                }
                if (!isCurrent()) return;
                nextResult = coordinator.next();
            }

            if (!isCurrent()) return;
            setP1Action(null);
            setP2Action(null);
            uiActions.setIsTeraToggled(false);
            uiActions.setIsMegaToggled(false); // Reset Mega Toggle

            if (!uiActions.showSwitchModal) {
                setState(prev => battleSession.canCommitResolution(resolution) ? {...prev, waitingForAction: false} : prev);
            }
        } catch (error) {
            if (!isCurrent()) return;
            console.error("Error resolving turn:", error);
            setState(prev => battleSession.canCommitResolution(resolution) ? {...prev, waitingForAction: false} : prev);
            window.dispatchEvent(new CustomEvent('show-toast', { detail: "❌ Erro crítico no turno. Estado restaurado." }));
        } finally {
            battleSession.finishResolution(resolution);
        }
    };

    // Auto-Move Trigger
    useEffect(() => {
        if (!state.isBattleInProgress || state.winner || state.waitingForAction || p1Action || p2Action) return;
        
        const p1 = state.currentPokemon1;
        const sessionId = battleSession.sessionId;
        const turn = state.turn;
        const actorInstanceId = p1?.instanceId;
        if (p1 && p1.chargingMove && !p1.isFainted) {
            const chargingMoveObj = p1.moves.find(m => m.name === p1.chargingMove);
            if (chargingMoveObj) {
                const cancelTimer = battleSession.schedule(sessionId, () => {
                    if (battleSession.isCurrent(sessionId)
                        && stateRef.current.turn === turn
                        && stateRef.current.currentPokemon1?.instanceId === actorInstanceId) {
                        handlePlayerAction(1, 'move', chargingMoveObj);
                    }
                }, 600);
                return () => { cancelTimer?.(); };
            }
        }
        
        if (config.p1AutoMode && p1 && !p1.isFainted && !uiActions.p1AiSelectedMove) {
            triggerP1AI();
        }
    }, [state.turn, state.isBattleInProgress, state.waitingForAction, config.p1AutoMode, state.currentPokemon1?.instanceId, p1Action, p2Action]);

    useEffect(() => {
      if (p1Action && p2Action && state.isBattleInProgress) resolveTurn();
    }, [p1Action, p2Action]);

    return {
        handlePlayerAction,
        handleBagAction,
        handleRunAway,
        checkFaintedSwitch,
        recordAction
    };
};
