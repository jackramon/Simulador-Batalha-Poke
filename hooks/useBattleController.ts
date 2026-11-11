
import { useState, useRef } from 'react';
import { Action } from '../types';
import { isTrapped } from '../services/battleUtils';
import { useBattleState } from './useBattleState';
import { useBattleUI } from './useBattleUI';
import { useTurnManager } from './useTurnManager';
import AudioManager from '../services/audio/AudioManager';

export const useBattleController = () => {
  // 1. Data Layer
  const battleState = useBattleState();
  const { 
      state, setState, config, setConfig, isLoading, 
      resetBattle, startBattle, updateStateWithLogs, 
      p1CustomTeamRef, p2CustomTeamRef, stateRef, configRef,
      currentReplay, setCurrentReplay
  } = battleState;

  // 2. UI Layer
  const battleUI = useBattleUI(p1CustomTeamRef, p2CustomTeamRef, setConfig);
  
  // Local Actions State (Needed for Turn Manager but exposed via Controller for bag usage etc)
  const [p1Action, setP1Action] = useState<Action | null>(null);
  const [p2Action, setP2Action] = useState<Action | null>(null);

  // 3. Logic Layer (Injection)
  const turnManager = useTurnManager({
      state, setState, stateRef, config, configRef, updateStateWithLogs,
      currentReplay, setCurrentReplay,
      uiActions: {
          ...battleUI,
          p1Action, setP1Action,
          p2Action, setP2Action
      }
  });

  // 4. Derived Values
  const currentPlayer = (config.opponentMode === 'manual' && p1Action !== null && p2Action === null) ? 2 : 1;
  const currentActive = currentPlayer === 1 ? state.currentPokemon1 : state.currentPokemon2;
  const currentTarget = currentPlayer === 1 ? state.currentPokemon2 : state.currentPokemon1;
  const isCurrentTrapped = isTrapped(currentActive, currentTarget);

  const handleStartClick = () => {
      // CRITICAL: Resume Audio Context on User Interaction
      AudioManager.resumeContext();

      if (config.p1Mode === 'builder') {
          const savedCount = p1CustomTeamRef.current?.length || 0;
          if (savedCount < config.p1TeamSize) {
              battleUI.setActiveBuilderPlayer(1);
              window.dispatchEvent(new CustomEvent('show-toast', { detail: "⚠️ Complete sua equipe!" }));
              return;
          }
      }

      if ((config.p2Mode as any) === 'builder') {
          const savedCount = p2CustomTeamRef.current?.length || 0;
          if (savedCount < config.p2TeamSize) {
              battleUI.setActiveBuilderPlayer(2);
              window.dispatchEvent(new CustomEvent('show-toast', { detail: "⚠️ Complete a equipe do oponente!" }));
              return;
          }
      }

      startBattle();
  };

  // 5. Public API
  return {
    // State & Config
    state,
    config,
    setConfig,
    isLoading,
    stateRef,
    configRef,
    
    // UI State
    p1AiSelectedMove: battleUI.p1AiSelectedMove,
    aiHighlightingMember: battleUI.aiHighlightingMember,
    p1AiBagSelection: battleUI.p1AiBagSelection,
    showSwitchModal: battleUI.showSwitchModal,
    setShowSwitchModal: battleUI.setShowSwitchModal,
    showDetailsModal: battleUI.showDetailsModal,
    setShowDetailsModal: battleUI.setShowDetailsModal,
    showBagModal: battleUI.showBagModal,
    setShowBagModal: battleUI.setShowBagModal,
    activeBuilderPlayer: battleUI.activeBuilderPlayer,
    setActiveBuilderPlayer: battleUI.setActiveBuilderPlayer,
    isTeraToggled: battleUI.isTeraToggled,
    setIsTeraToggled: battleUI.setIsTeraToggled,
    isMegaToggled: battleUI.isMegaToggled,
    setIsMegaToggled: battleUI.setIsMegaToggled,
    toastMessage: battleUI.toastMessage,
    animationState: battleUI.animationState,
    
    // Refs
    p1CustomTeamRef,
    p2CustomTeamRef,

    // Actions & Handlers
    p1Action,
    p2Action,
    handleStartClick,
    handleBuilderSave: battleUI.handleBuilderSave,
    handleRunAway: turnManager.handleRunAway,
    handleBagAction: turnManager.handleBagAction,
    handlePlayerAction: turnManager.handlePlayerAction,
    recordAction: turnManager.recordAction,
    resetBattle,
    updateStateWithLogs,
    checkFaintedSwitch: turnManager.checkFaintedSwitch,
    
    // Derived
    currentPlayer,
    currentActive,
    currentTarget,
    isCurrentTrapped,
    currentReplay
  };
};
