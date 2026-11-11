
import React, { useState, useEffect } from 'react';
import { Action, Pokemon, BattleState, BattleConfig, BattleReplay, BattleReplayEvent } from '../types';
import * as BattleEngine from '../services/engine';
import { decideAIAction, chooseBestSwitch } from '../services/aiLogic';
import * as AirLock from '../services/engine/handlers/abilities/air_lock';
import { BattleCoordinator } from '../services/engine/coordinator';
import { calculateTypeEffectiveness } from '../services/battleUtils';
import { TurnAnimator } from '../services/animation/turnAnimator';

interface TurnManagerProps {
    state: BattleState;
    setState: React.Dispatch<React.SetStateAction<BattleState>>;
    stateRef: React.MutableRefObject<BattleState>;
    config: BattleConfig;
    configRef: React.MutableRefObject<BattleConfig>;
    updateStateWithLogs: (newState: BattleState, logs: any[]) => void;
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
    state, setState, stateRef, config, configRef, updateStateWithLogs, currentReplay, setCurrentReplay, uiActions 
}: TurnManagerProps) => {
    
    const { p1Action, setP1Action, p2Action, setP2Action } = uiActions;

    const recordAction = (player: 1 | 2, type: 'move' | 'switch' | 'item', data: any, shouldTerastallize?: boolean, shouldMegaEvolve?: boolean, isForcedSwitch?: boolean, isBatonPass?: boolean) => {
        // FIX: construir o event DENTRO do functional updater garante que `prev`
        // é sempre o valor mais recente — elimina stale closure em AI vs AI rápido.
        const currentTurn = stateRef.current.turn;
        const moveId   = type === 'move'   ? data?.name     : undefined;
        const switchId = type === 'switch' ? data?.id       : undefined;
        const itemId   = type === 'item'   ? data?.itemId   : undefined;
        const targetId = type === 'item'   ? data?.targetId : undefined;
        const isGive   = type === 'item'   ? data?.isGive   : undefined;

        setCurrentReplay(prev => {
            if (!prev) return prev;
            const event: BattleReplayEvent = {
                turn: currentTurn,
                actionType: type,
                actorId: player,
                shouldTerastallize,
                shouldMegaEvolve,
                isForcedSwitch,
                isBatonPass,
                moveId,
                switchId,
                itemId,
                targetId,
                isGive
            };
            return { ...prev, events: [...prev.events, event] };
        });
    };

    const handlePlayerAction = (player: 1 | 2, type: 'move' | 'switch' | 'item', data: any, isForcedSwitch?: boolean, isBatonPass?: boolean) => {
        const user = player === 1 ? state.currentPokemon1! : state.currentPokemon2!;
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

        recordAction(player, type, data, shouldTerastallize, shouldMegaEvolve, isForcedSwitch, isBatonPass);

        if (player === 1) {
            setP1Action(act);
            if (configRef.current.opponentMode === 'auto') triggerAI();
        } else setP2Action(act);
    };

    const handleBagAction = (type: 'use' | 'give', itemId: string, targetId: number) => {
        uiActions.setShowBagModal(false);
        
        // Infer player based on target ID
        let playerNum: 1 | 2 = 1;
        let target = state.team1.find(p => p.id === targetId);
        
        if (!target) {
            target = state.team2.find(p => p.id === targetId);
            playerNum = 2;
        }
        
        if (!target) return;
        
        if (type === 'use') {
            handlePlayerAction(playerNum, 'item', { itemId, targetId });
        } else {
            handlePlayerAction(playerNum, 'item', { itemId, targetId, isGive: true });
        }
    };

    const handleRunAway = () => {
        setState(prev => ({ ...prev, isBattleInProgress: false, winner: null, waitingForAction: false }));
        setP1Action(null);
        setP2Action(null);
        localStorage.removeItem('poke_sim_battle_state'); // Hardcoded key match
    };

    const triggerAI = () => {
        setState(prev => ({...prev, waitingForAction: true}));
        setTimeout(async () => {
            const currentState = stateRef.current;
            const p2 = currentState.currentPokemon2!; 
            const p1 = currentState.currentPokemon1!;
            if (!p2 || p2.isFainted || !p1) return;
            const isSuppressed = AirLock.isWeatherSuppressed(currentState);
            
            let aiAction;
            if (configRef.current.useLLM) {
                const { decideLLMAction } = await import('../services/llmAiLogic');
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
                    configRef.current.megaEvolutionEnabled, // Pass Mega Config
                    currentState.p2MegaUsed // Pass P2 Mega Usage
                );
            }
            
            recordAction(2, aiAction.type, aiAction.data, aiAction.shouldTerastallize, aiAction.shouldMegaEvolve);
            setP2Action(aiAction);
        }, 1000);
    };

    const triggerP1AI = () => {
        const currentState = stateRef.current;
        const p1 = currentState.currentPokemon1; 
        const p2 = currentState.currentPokemon2;
        if (!p1 || p1.isFainted || !p2) return;
        
        const executeP1AI = async () => {
            const isSuppressed = AirLock.isWeatherSuppressed(currentState);
            let aiAction;
            
            if (configRef.current.useLLM) {
                const { decideLLMAction } = await import('../services/llmAiLogic');
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
                    configRef.current.megaEvolutionEnabled, // Pass Mega Config
                    currentState.p1MegaUsed // Pass P1 Mega Usage
                );
            }
            
            if (aiAction.type === 'move') {
                uiActions.setP1AiSelectedMove(aiAction.data.name);
                if (aiAction.shouldTerastallize) uiActions.setIsTeraToggled(true);
                // Se a IA decidiu Mega Evoluir, ligamos o toggle visualmente (feedback)
                if (aiAction.shouldMegaEvolve) uiActions.setIsMegaToggled(true);
                
                setTimeout(() => { 
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
                setState(prev => ({ ...prev, waitingForAction: true }));
                setTimeout(() => { 
                    uiActions.setAiHighlightingMember(null); 
                    uiActions.setShowSwitchModal(null); 
                    handlePlayerAction(1, 'switch', aiAction.data); 
                }, 3000);
            } else if (aiAction.type === 'item') {
                const { itemId, targetId, isGive } = aiAction.data;
                uiActions.setP1AiBagSelection({ itemId, targetId, isGive });
                uiActions.setShowBagModal(true);
                setState(prev => ({ ...prev, waitingForAction: true }));
                setTimeout(() => {
                    uiActions.setShowBagModal(false);
                    uiActions.setP1AiBagSelection(null);
                    handleBagAction(isGive ? 'give' : 'use', itemId, targetId);
                }, 4000); 
            }
        };
        
        executeP1AI();
    };

    const checkFaintedSwitch = async (currentState: BattleState) => {
        // --- GAME OVER CHECK ---
        const p1Defeated = currentState.team1.every(p => p.isFainted);
        const p2Defeated = currentState.team2.every(p => p.isFainted);

        if (p1Defeated && p2Defeated) { setState(prev => ({...prev, winner: 'draw', isBattleInProgress: false, waitingForAction: false})); return; }
        if (p1Defeated) { setState(prev => ({...prev, winner: 2, isBattleInProgress: false, waitingForAction: false})); return; }
        if (p2Defeated) { setState(prev => ({...prev, winner: 1, isBattleInProgress: false, waitingForAction: false})); return; }

        if (currentState.currentPokemon1?.isFainted || currentState.currentPokemon2?.isFainted) {
            if (currentState.currentPokemon1?.isFainted) {
                if (configRef.current.p1AutoMode) {
                    setState(prev => ({ ...prev, waitingForAction: true }));
                    uiActions.setShowSwitchModal({player: 1, canCancel: false});
                    
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
                        uiActions.setAiHighlightingMember(nextMon.id);
                        await new Promise(r => setTimeout(r, 3000));
                        recordAction(1, 'switch', nextMon, undefined, undefined, true, false);
                        const sRes = BattleEngine.performSwitch(currentState, nextMon, 1, configRef.current.weatherEnabled);
                        currentState = { ...sRes.newState, waitingForAction: false };
                        updateStateWithLogs(currentState, sRes.logs);
                    }
                    uiActions.setAiHighlightingMember(null);
                    uiActions.setShowSwitchModal(null);
                    setState(prev => ({...prev, waitingForAction: false}));
                } else {
                    const healthy = currentState.team1.filter(p => !p.isFainted);
                    if (healthy.length === 1) {
                        await new Promise(r => setTimeout(r, 1000));
                        recordAction(1, 'switch', healthy[0], undefined, undefined, true, false);
                        const sRes = BattleEngine.performSwitch(currentState, healthy[0], 1, configRef.current.weatherEnabled);
                        currentState = { ...sRes.newState, waitingForAction: false };
                        updateStateWithLogs(currentState, sRes.logs);
                    } else if (healthy.length > 1) {
                        uiActions.setShowSwitchModal({player: 1, canCancel: false});
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
                        recordAction(2, 'switch', next, undefined, undefined, true, false);
                        const res = BattleEngine.performSwitch(currentState, next, 2, configRef.current.weatherEnabled);
                        currentState = { ...res.newState, waitingForAction: false };
                        updateStateWithLogs(currentState, res.logs);
                    }
                } else {
                    const healthy = currentState.team2.filter(p => !p.isFainted);
                    if (healthy.length === 1) {
                        await new Promise(r => setTimeout(r, 1000));
                        recordAction(2, 'switch', healthy[0], undefined, undefined, true, false);
                        const sRes = BattleEngine.performSwitch(currentState, healthy[0], 2, configRef.current.weatherEnabled);
                        currentState = { ...sRes.newState, waitingForAction: false };
                        updateStateWithLogs(currentState, sRes.logs);
                    } else if (healthy.length > 1) {
                        uiActions.setShowSwitchModal({player: 2, canCancel: false});
                    }
                }
            }
        }
    };

    const resolveTurn = async () => {
        try {
            const coordinator = BattleCoordinator.runTurn(stateRef.current, p1Action!, p2Action!, configRef.current);
            let switchPromptReceived = false;

            for (const step of coordinator) {
                if (step.state) {
                    updateStateWithLogs(step.state, step.logs);
                }

                await TurnAnimator.processStep(step, uiActions);

                if (step.phase === 'switch-forced' && step.switchPrompt) {
                    switchPromptReceived = true;
                    const { player, isBatonPass, canCancel } = step.switchPrompt;
                    
                    if (player === 1) {
                        if (configRef.current.p1AutoMode) {
                            const currentState = step.state;
                            const team = currentState.team1;
                            const active = currentState.currentPokemon1;
                            const healthy = team.filter(p => !p.isFainted && p.id !== active?.id);
                            if (healthy.length > 0) {
                                const next = healthy[0]; // Removed Math.random() to prevent PRNG desync
                                recordAction(1, 'switch', next, undefined, undefined, !isBatonPass, isBatonPass);
                                const sRes = BattleEngine.performSwitch(currentState, next, 1, configRef.current.weatherEnabled, isBatonPass);
                                updateStateWithLogs(sRes.newState, sRes.logs);
                                await new Promise(r => setTimeout(r, 1000));
                            }
                            setState(prev => ({...prev, waitingForAction: false}));
                        } else {
                            uiActions.setShowSwitchModal({ player: 1, canCancel, isBatonPass });
                        }
                    } else {
                        const currentState = step.state;
                        const team = currentState.team2;
                        const active = currentState.currentPokemon2;
                        const healthy = team.filter(p => !p.isFainted && p.id !== active?.id);
                        if (healthy.length > 0) {
                            const next = healthy[0]; // Removed Math.random() to prevent PRNG desync
                            recordAction(2, 'switch', next, undefined, undefined, !isBatonPass, isBatonPass);
                            const sRes = BattleEngine.performSwitch(currentState, next, 2, configRef.current.weatherEnabled, isBatonPass);
                            updateStateWithLogs(sRes.newState, sRes.logs);
                            await new Promise(r => setTimeout(r, 1000));
                        }
                        setState(prev => ({...prev, waitingForAction: false}));
                    }
                    break;
                }
                else if (step.phase === 'faint-switch') {
                     checkFaintedSwitch(step.state);
                }
            }

            setP1Action(null); 
            setP2Action(null);
            uiActions.setIsTeraToggled(false); 
            uiActions.setIsMegaToggled(false); // Reset Mega Toggle
            
            if (!uiActions.showSwitchModal && !switchPromptReceived) {
                setState(prev => ({...prev, waitingForAction: false}));
            }
        } catch (error) {
            console.error("Error resolving turn:", error);
            setState(prev => ({...prev, waitingForAction: false}));
            window.dispatchEvent(new CustomEvent('show-toast', { detail: "❌ Erro crítico no turno. Estado restaurado." }));
        }
    };

    // Auto-Move Trigger
    useEffect(() => {
        if (!state.isBattleInProgress || state.winner || state.waitingForAction || p1Action || p2Action) return;
        
        const p1 = state.currentPokemon1;
        if (p1 && p1.chargingMove && !p1.isFainted) {
            const chargingMoveObj = p1.moves.find(m => m.name === p1.chargingMove);
            if (chargingMoveObj) {
                const timer = setTimeout(() => {
                    handlePlayerAction(1, 'move', chargingMoveObj);
                }, 600);
                return () => clearTimeout(timer);
            }
        }
        
        if (config.p1AutoMode && p1 && !p1.isFainted && !uiActions.p1AiSelectedMove) {
            triggerP1AI();
        }
    }, [state.turn, state.isBattleInProgress, state.waitingForAction, config.p1AutoMode, state.currentPokemon1?.id, p1Action, p2Action]);

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
