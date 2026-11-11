
import React from 'react';
import { Pokemon, Move } from '../types';
import { TYPE_NAMES_PT } from '../data/types';
import { calculateTypeEffectiveness, getRawStat } from '../services/battleUtils';
import * as Refrigerate from '../services/engine/handlers/abilities/refrigerate';
import * as LiquidVoice from '../services/engine/handlers/abilities/liquid_voice';
import { ITEMS_DATA } from '../data/items';
import { ABILITY_EFFECTS } from '../data/abilities';

interface SwitchModalProps {
  player: 1 | 2;
  team: Pokemon[];
  currentActive: Pokemon | null;
  opponent: Pokemon | null;
  weather: string;
  aiHighlightId: number | null;
  onSelect: (p: Pokemon) => void;
  onCancel: () => void;
  canCancel: boolean;
}

export const SwitchModal: React.FC<SwitchModalProps> = ({ player, team, currentActive, opponent, weather, aiHighlightId, onSelect, onCancel, canCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-indigo-200">
        <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          Escolha um Pokémon ({player === 1 ? 'Jogador 1' : 'Jogador 2'})
          {aiHighlightId && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-300 animate-pulse">IA escolhendo...</span>}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {team.map((p) => {
            if (!p) return null;
            const isCurrent = currentActive?.id === p.id;
            const isAiHighlighted = aiHighlightId === p.id;
            let matchup = null;
            if (opponent && !p.isFainted) {
              const isWeak = opponent?.types?.some(t => calculateTypeEffectiveness(t, p?.types || [], p?.ability || '').multiplier >= 2);
              const isStrong = p?.moves?.some(m => m?.damageClass !== 'status' && calculateTypeEffectiveness(m?.type, opponent?.types || [], opponent?.ability || '').multiplier >= 2);
              if (isStrong && !isWeak) matchup = { text: 'Forte', class: 'bg-green-100 text-green-700 border-green-200' };
              else if (isStrong && isWeak) matchup = { text: 'Arriscado', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
              else if (!isStrong && isWeak) matchup = { text: 'Fraco', class: 'bg-red-100 text-red-700 border-red-200' };
              else matchup = { text: 'Neutro', class: 'bg-gray-100 text-gray-600 border-gray-200' };
            }

            return (
              <div key={p.id} className={`border-2 rounded-xl p-3 flex items-center gap-3 transition-all ${isAiHighlighted ? 'btn-ai-selected scale-105' : isCurrent ? 'border-indigo-500 bg-indigo-50' : p.isFainted ? 'opacity-50 grayscale border-gray-200' : 'cursor-pointer hover:border-indigo-300 hover:bg-gray-50'}`} onClick={() => !isCurrent && !p.isFainted && !aiHighlightId && onSelect(p)}>
                <div className="relative">
                  <img src={p.spriteUrl} alt={p.name ?? 'Pokémon'} className="w-16 h-16 bg-gray-100 rounded-full object-contain" />
                  {isCurrent && <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1 rounded-full shadow-sm">Ativo</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-gray-800 truncate">
                        {p.name ?? 'Pokémon'}
                        <span className="text-sm text-gray-500 font-normal ml-1">Lv. {p.level || 50}</span>
                    </div>
                    {matchup && <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${matchup.class}`}>{matchup.text}</span>}
                  </div>
                  <div className="text-sm text-gray-600">PV: {p.hp ?? 0}/{p.maxHP ?? 0} | Vel: {getRawStat(p, 'speed', weather)}</div>
                  
                  {/* Item Display */}
                  {p.heldItem && (
                    <div className="text-xs text-amber-600 font-medium truncate">
                      Item: {ITEMS_DATA[p.heldItem]?.name || p.heldItem}
                    </div>
                  )}

                  {/* Ability Display */}
                  {p.ability && (
                    <div className="text-xs text-purple-600 font-medium truncate" title={ABILITY_EFFECTS[p.ability]?.desc || ''}>
                      Hab: {ABILITY_EFFECTS[p.ability]?.name || p.ability}
                    </div>
                  )}

                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.types?.map(t => <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold type-${t}`}>{TYPE_NAMES_PT[t]}</span>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {canCancel && !aiHighlightId && (
          <button className="mt-6 w-full bg-gray-500 text-white font-bold py-3 rounded-lg hover:bg-gray-600" onClick={onCancel}>Cancelar</button>
        )}
      </div>
    </div>
  );
};

interface DetailsModalProps {
  pokemon: Pokemon;
  opponent: Pokemon | null;
  onSelect: (p: Pokemon) => void;
  onBack: () => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({ pokemon, opponent, onSelect, onBack }) => {
  if (!pokemon) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border-4 border-indigo-200">
        <h3 className="text-xl font-bold mb-3 text-gray-800">{pokemon.name ?? 'Pokémon'}</h3>
        
        {/* Ability Badge */}
        <div className="mb-4 bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
            <div className="text-xs font-bold text-indigo-400 uppercase mb-0.5">Habilidade</div>
            <div className="text-sm font-bold text-indigo-900 flex justify-between items-center">
                {pokemon.ability ? (ABILITY_EFFECTS[pokemon.ability]?.name || pokemon.ability) : 'Nenhuma'}
            </div>
            <div className="text-xs text-indigo-700 italic mt-0.5 leading-snug">
                {pokemon.ability ? (ABILITY_EFFECTS[pokemon.ability]?.desc || "Efeito desconhecido.") : ''}
            </div>
        </div>

        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Golpes</h4>
        <div className="space-y-2">
          {pokemon.moves?.map(m => {
            if (!m) return null;
            const effectiveType = (() => {
              let t = m.type;
              t = LiquidVoice.getModifiedType(pokemon, { ...m, type: t });
              t = Refrigerate.getEffectiveMoveType(pokemon, { ...m, type: t });
              return t;
            })();
            const eff = opponent ? calculateTypeEffectiveness(effectiveType, opponent?.types || [], opponent?.ability || '') : { message: '', color: '' };
            return (
              <div key={m.name} className="border p-2 rounded text-sm bg-gray-50">
                <div className="font-bold flex justify-between">
                  <span className="text-gray-800">{m.displayName ?? m.name}</span>
                  <span className={`text-xs px-1 rounded text-white type-${effectiveType}`}>{TYPE_NAMES_PT[effectiveType] || effectiveType}</span>
                </div>
                <div className="text-xs text-gray-500">Poder: {m.power} | Acc: {m.accuracy} | Usos: {m.uses}/{m.maxUses}</div>
                <div className={`text-xs font-bold ${eff.color}`}>{eff.message}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button disabled={pokemon.isFainted} className={`text-white py-3 rounded-lg font-bold shadow-md transform transition active:scale-95 ${pokemon.isFainted ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`} onClick={() => onSelect(pokemon)}>
            {pokemon.isFainted ? 'Desmaiado' : 'Escolher este Pokémon'}
          </button>
          <button className="bg-gray-500 text-white py-2 rounded-lg" onClick={onBack}>Voltar</button>
        </div>
      </div>
    </div>
  );
};
