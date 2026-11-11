
import React, { useState, useEffect } from 'react';
import { Pokemon } from '../types';

const KEY_P1_CUSTOM_TEAM = 'poke_sim_p1_team';
const KEY_P2_CUSTOM_TEAM = 'poke_sim_p2_team';

export const useBattleUI = (
    p1CustomTeamRef: React.MutableRefObject<Pokemon[] | null>,
    p2CustomTeamRef: React.MutableRefObject<Pokemon[] | null>,
    setConfig: React.Dispatch<React.SetStateAction<any>>
) => {
  const [p1AiSelectedMove, setP1AiSelectedMove] = useState<string | null>(null);
  const [aiHighlightingMember, setAiHighlightingMember] = useState<number | null>(null);
  const [p1AiBagSelection, setP1AiBagSelection] = useState<{ itemId: string, targetId: number, isGive: boolean } | null>(null);
  
  const [showSwitchModal, setShowSwitchModal] = useState<{player: 1|2, canCancel: boolean, isBatonPass?: boolean} | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<{pokemon: Pokemon, player: 1|2} | null>(null);
  const [showBagModal, setShowBagModal] = useState<boolean>(false); 
  const [activeBuilderPlayer, setActiveBuilderPlayer] = useState<1 | 2 | null>(null);

  const [isTeraToggled, setIsTeraToggled] = useState<boolean>(false); 
  const [isMegaToggled, setIsMegaToggled] = useState<boolean>(false); // New Mega State

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [animationState, setAnimationState] = useState<{id: number, type: 'attack' | 'damage' | 'poison' | 'burn' | 'paralysis' | 'sleep' | 'freeze' | 'confusion' | 'infatuation' | 'flinch'} | null>(null);

  // Toast Listener
  useEffect(() => {
      const handler = (e: any) => {
          setToastMessage(e.detail);
          setTimeout(() => setToastMessage(null), 3000);
      };
      window.addEventListener('show-toast', handler);
      return () => window.removeEventListener('show-toast', handler);
  }, []);

  const handleBuilderSave = (customTeam: Pokemon[]) => {
      if (activeBuilderPlayer === 1) {
          p1CustomTeamRef.current = customTeam;
          try { localStorage.setItem(KEY_P1_CUSTOM_TEAM, JSON.stringify(customTeam)); } catch (e) {}
          setConfig((prev: any) => ({ ...prev, p1Mode: 'builder' }));
          window.dispatchEvent(new CustomEvent('show-toast', { detail: "✅ Equipe do Jogador 1 definida!" }));
      } else if (activeBuilderPlayer === 2) {
          p2CustomTeamRef.current = customTeam;
          try { localStorage.setItem(KEY_P2_CUSTOM_TEAM, JSON.stringify(customTeam)); } catch (e) {}
          setConfig((prev: any) => ({ ...prev, p2Mode: 'builder' }));
          window.dispatchEvent(new CustomEvent('show-toast', { detail: "✅ Equipe do Oponente definida!" }));
      }
      setActiveBuilderPlayer(null);
  };

  return {
    p1AiSelectedMove, setP1AiSelectedMove,
    aiHighlightingMember, setAiHighlightingMember,
    p1AiBagSelection, setP1AiBagSelection,
    showSwitchModal, setShowSwitchModal,
    showDetailsModal, setShowDetailsModal,
    showBagModal, setShowBagModal,
    activeBuilderPlayer, setActiveBuilderPlayer,
    isTeraToggled, setIsTeraToggled,
    isMegaToggled, setIsMegaToggled, // Export Mega Toggle
    toastMessage, setToastMessage,
    animationState, setAnimationState,
    handleBuilderSave
  };
};
