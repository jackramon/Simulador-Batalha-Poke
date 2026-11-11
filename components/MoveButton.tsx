
import React from 'react';
import { Move, Pokemon } from '../types';
import { TYPE_NAMES_PT } from '../data/types';
import { STATUS_TRANSLATIONS, MOVE_TRANSLATIONS, MOVE_DESCRIPTIONS } from '../data/translations';
import { MOVE_EFFECTS } from '../data/moves/effects';
import { calculateTypeEffectiveness, calculateHitChance, isContactMove, calculateDamageRange } from '../services/battleUtils';
import * as Refrigerate from '../services/engine/handlers/abilities/refrigerate';
import * as Pixilate from '../services/engine/handlers/abilities/pixilate';
import * as LiquidVoice from '../services/engine/handlers/abilities/liquid_voice';
import * as HiddenPower from '../services/engine/handlers/moves/hiddenPower';
import * as TerrainPulse from '../services/engine/handlers/moves/terrainPulse';
import * as TeraBlast from '../services/engine/handlers/moves/teraBlast';
import * as TeraStarstorm from '../services/engine/handlers/moves/teraStarstorm';
import * as Klutz from '../services/engine/handlers/abilities/klutz';
import { isGrounded } from '../services/engine/handlers/terrain';
import { TYPE_ENHANCING_ITEMS } from '../data/items';
import { IMPLEMENTED_MOVES } from '../data/dev_registry';

interface MoveButtonProps {
  move: Move;
  user: Pokemon;
  target: Pokemon | null;
  weather: string;
  terrain?: string;
  gravity?: boolean; // Adicionado prop gravity
  onSelect: () => void;
  disabled: boolean;
  showUses: boolean;
  isAiSelected: boolean;
  isTeraToggled?: boolean;
}

export const MoveButton: React.FC<MoveButtonProps> = ({ move, user, target, weather, terrain, gravity, onSelect, disabled, showUses, isAiSelected, isTeraToggled }) => {
  const currentTerrain = terrain || 'none';
  const currentGravity = gravity || false;

  // Simulação de usuário para previsão de dano com Terastal ativo
  const simulationUser = {
      ...user,
      isTerastallized: user.isTerastallized || isTeraToggled
  };
  
  // Cálculo dinâmico do Tipo
  const effectiveType = (() => {
    let t = move.type;
    if (move.name === 'tera-blast') {
        t = TeraBlast.getTeraBlastType(simulationUser);
    }
    if (move.name === 'tera-starstorm') {
        t = TeraStarstorm.getTeraStarstormType(simulationUser);
    }
    if (move.name === 'terrain-pulse') {
        t = TerrainPulse.getEffectiveType(simulationUser, currentTerrain);
    }
    t = HiddenPower.getEffectiveType(simulationUser, { ...move, type: t });
    t = LiquidVoice.getModifiedType(simulationUser, { ...move, type: t });
    t = Refrigerate.getEffectiveMoveType(simulationUser, { ...move, type: t });
    t = Pixilate.getEffectiveMoveType(simulationUser, { ...move, type: t });
    return t;
  })();

  // Cálculo dinâmico do Poder
  const displayPower = (() => {
      if (move.name === 'terrain-pulse') {
          return TerrainPulse.getTerrainPulsePower(simulationUser, move.power, currentTerrain).power;
      }
      return move.power;
  })();

  const typeDisplay = TYPE_NAMES_PT[effectiveType] || effectiveType;
  let effMessage = '';
  let effColor = '';
  let hitChance: number | string = '';
  let effectivenessMultiplier = 1.0;

  if (target) {
    // Injeta estado Terastal no defenderStatus
    const defenderStatus = { ...target.statusEffects, isTerastallized: target.isTerastallized };
    
    // Passa statusEffects modificado para checar imunidades e tipo Estelar
    const eff = calculateTypeEffectiveness(effectiveType, target.types, target.ability, simulationUser.ability, move.name, defenderStatus);
    effMessage = eff.message;
    effColor = eff.color;
    effectivenessMultiplier = eff.multiplier;
    hitChance = calculateHitChance(move, simulationUser, target, weather, currentGravity);
  }

  // --- DAMAGE CALCULATOR ---
  let damageRange = { min: 0, max: 0 };
  let damageBadge = null;

  if (target && !move.isStatus) {
      damageRange = calculateDamageRange(
          simulationUser, 
          target, 
          { ...move, type: effectiveType }, 
          weather, 
          currentTerrain
      );

      if (damageRange.max > 0) {
          const isOhko = damageRange.min >= target.hp;
          const label = isOhko ? 'KO Garantido' : `${damageRange.min} - ${damageRange.max} PV`;
          
          let badgeColor = 'bg-gray-700 text-white';
          if (damageRange.max >= target.hp) {
              badgeColor = 'bg-red-600 text-white';
          } else if (damageRange.max >= target.hp * 0.5) {
              badgeColor = 'bg-orange-500 text-white';
          }

          if (effectivenessMultiplier === 0) {
              badgeColor = 'bg-gray-500 text-white';
              damageBadge = (
                  <span className={`absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm ${badgeColor}`}>
                      Imune
                  </span>
              );
          } else {
              damageBadge = (
                  <span className={`absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm ${badgeColor}`}>
                      {label}
                  </span>
              );
          }
      } else if (effectivenessMultiplier === 0) {
          damageBadge = (
              <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm bg-gray-500 text-white">
                  Imune
              </span>
          );
      }
  }
  // -------------------------

  const currentDisplayName = MOVE_TRANSLATIONS[move.name] || move.displayName;
  const currentDescription = MOVE_DESCRIPTIONS[move.name] || move.description;
  const currentEffect = move.effect || MOVE_EFFECTS[move.name];

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('show-toast', { detail: currentDescription }));
  };

  const isLowHp = user?.hp <= user?.maxHP / 3;
  const isPinchBoost = isLowHp && (
    (user?.ability === 'blaze' && move?.type === 'fire') ||
    (user?.ability === 'torrent' && move?.type === 'water') ||
    (user?.ability === 'overgrow' && move?.type === 'grass') ||
    (user?.ability === 'swarm' && move?.type === 'bug')
  );

  const isToughClawsBoost = user?.ability === 'tough-claws' && isContactMove(move);
  const isTechnicianBoost = user?.ability === 'technician' && move?.power <= 60;
  const isRefrigerateBoost = Refrigerate.isBoostedByRefrigerate(user, move);
  const isPixilateBoost = Pixilate.isBoostedByPixilate(user, move);
  
  const isItemBoost = user?.heldItem && 
                      !Klutz.isItemSuppressed(user) && 
                      TYPE_ENHANCING_ITEMS[user?.heldItem] === effectiveType;

  const isExpertBeltBoost = user?.heldItem === 'expert-belt' &&
                            !Klutz.isItemSuppressed(user) &&
                            effectivenessMultiplier >= 2;

  const isWeatherBoosted = (weather === 'sun' && effectiveType === 'fire') || 
                           (weather === 'rain' && effectiveType === 'water');
  
  const isWeatherWeakened = (weather === 'sun' && effectiveType === 'water') || 
                            (weather === 'rain' && effectiveType === 'fire');

  const isGroundedUser = isGrounded(simulationUser);
  const isTerrainBoosted = isGroundedUser && (
      (currentTerrain === 'electric' && effectiveType === 'electric') ||
      (currentTerrain === 'grassy' && effectiveType === 'grass') ||
      (currentTerrain === 'psychic' && effectiveType === 'psychic') ||
      (move.name === 'terrain-pulse' && currentTerrain !== 'none')
  );

  const isTerrainWeakened = isGroundedUser && (
      (currentTerrain === 'misty' && effectiveType === 'dragon') ||
      (currentTerrain === 'grassy' && ['earthquake', 'bulldoze', 'magnitude'].includes(move.name))
  );

  const hasFairyAura = (user?.ability === 'fairy-aura' && !user?.isFainted) || (target?.ability === 'fairy-aura' && !target?.isFainted);
  const hasDarkAura = (user?.ability === 'dark-aura' && !user?.isFainted) || (target?.ability === 'dark-aura' && !target?.isFainted);
  const hasAuraBreak = (user?.ability === 'aura-break' && !user?.isFainted) || (target?.ability === 'aura-break' && !target?.isFainted);

  const isFairyAuraBoost = effectiveType === 'fairy' && hasFairyAura && !hasAuraBreak;
  const isDarkAuraBoost = effectiveType === 'dark' && hasDarkAura && !hasAuraBreak;
  
  const isFairyAuraWeakened = effectiveType === 'fairy' && hasFairyAura && hasAuraBreak;
  const isDarkAuraWeakened = effectiveType === 'dark' && hasDarkAura && hasAuraBreak;

  const isBoosted = isPinchBoost || isToughClawsBoost || isTechnicianBoost || isRefrigerateBoost || isPixilateBoost || isItemBoost || isExpertBeltBoost ||
                    isWeatherBoosted || isTerrainBoosted || isFairyAuraBoost || isDarkAuraBoost ||
                    (user?.ability === 'transistor' && move?.type === 'electric') ||
                    (user?.ability === 'steelworker' && move?.type === 'steel') ||
                    (user?.ability === 'dragon-maw' && move?.type === 'dragon') ||
                    (user?.ability === 'rocky-payload' && move?.type === 'rock') ||
                    (user?.ability === 'sharpness' && ['cut', 'slash', 'night-slash', 'air-slash', 'psycho-cut', 'leaf-blade', 'x-scissor', 'cross-poison', 'sacred-sword', 'aqua-cutter', 'kowtow-cleave', 'population-bomb'].includes(move?.name));

  const isWeakened = isWeatherWeakened || isTerrainWeakened || isFairyAuraWeakened || isDarkAuraWeakened;

  const isLocked = user?.lockedMove && user?.lockedMove !== move?.name;
  const isCursed = user?.disabledMoves && user?.disabledMoves[move?.name];
  const isButtonDisabled = disabled || isLocked || !!isCursed;

  const effectName = currentEffect ? STATUS_TRANSLATIONS[currentEffect.status]?.name : null;

  // Lógica de Visual Debugging
  const isFullyImplemented = IMPLEMENTED_MOVES.has(move.name);
  let debugIcon = '⚙️';
  let debugClass = 'text-gray-400 border-gray-300';
  let debugTitle = "Cálculo Genérico de Dano";

  if (isFullyImplemented) {
      debugIcon = '✓';
      debugClass = 'text-green-600 border-green-400';
      debugTitle = "Lógica Implementada";
  } else if (move.damageClass === 'status') {
      debugIcon = '⚠️';
      debugClass = 'text-yellow-600 border-yellow-400';
      debugTitle = "Lógica de Status PENDENTE (Não funcional)";
  }

  return (
    <button 
      className={`btn-move relative text-white font-bold p-3 rounded-xl border-b-4 border-opacity-70 type-${effectiveType} flex flex-col items-center justify-center min-h-[85px] ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${isAiSelected ? 'btn-ai-selected' : ''}`}
      onClick={isButtonDisabled ? undefined : onSelect}
      disabled={isButtonDisabled}
    >
      {/* Indicador de Implementação (Debug) */}
      <span 
          className={`absolute top-1 left-1 text-[10px] w-4 h-4 flex items-center justify-center rounded-full bg-white border shadow-sm ${debugClass}`}
          title={debugTitle}
      >
          {debugIcon}
      </span>

      <div className="flex items-center gap-1">
        <span className="text-lg leading-tight">{currentDisplayName}</span>
        {target && <span className="bg-black/20 px-1 rounded text-xs">{hitChance}%</span>}
      </div>
      
      <span className="text-[10px] font-light mt-0.5 flex items-center gap-1">
        Poder: {displayPower} 
        {isBoosted && <span className="text-green-400 font-bold">▲</span>} 
        {isWeakened && <span className="text-red-500 font-bold">▼</span>}
        | Tipo: {typeDisplay}
      </span>

      {effectName && (
        <span className="text-[10px] mt-1 bg-black/20 px-1.5 rounded-full font-medium italic border border-white/10">
          {effectName}
        </span>
      )}

      {effMessage && (
        <span className={`text-[10px] mt-1 bg-gray-200/90 px-2 py-0.5 rounded shadow-sm font-bold ${effColor}`}>
          {effMessage}
        </span>
      )}

      {showUses && <span className="text-[10px] mt-1 opacity-80">PP: {move.uses}/{move.maxUses}</span>}
      
      {!isLocked && !isCursed && damageBadge}

      {isLocked && (
        <span className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center font-bold text-gray-200 text-xs backdrop-blur-[1px] border-2 border-gray-500">
            <span className="text-2xl mb-1">🔒</span>
            TRAVADO
        </span>
      )}
      
      {!!isCursed && !isLocked && (
        <span className="absolute inset-0 bg-purple-900/60 rounded-xl flex flex-col items-center justify-center font-bold text-white text-xs backdrop-blur-[1px] border-2 border-purple-500">
            <span className="text-2xl mb-1">🚫</span>
            DESATIVADO
        </span>
      )}

      {!isButtonDisabled && <span className="absolute top-1 right-1 text-xs bg-white text-gray-800 rounded-full w-4 h-4 flex items-center justify-center opacity-70 cursor-help" onClick={handleInfoClick}>?</span>}
    </button>
  );
};
