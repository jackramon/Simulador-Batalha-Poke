
import React, { useState } from 'react';
import { WEATHER_DATA, TERRAIN_DATA } from '../data/general';
import { SideHazards, BattleState } from '../types';
import { VolumeControl } from './VolumeControl';
import { InteractiveLogMessage } from './InteractiveLogMessage';

interface BattleHeaderProps {
  turn: number;
  weather: string;
  weatherTurns: number;
  terrain: string;
  terrainTurns: number;
  trickRoom: boolean;
  trickRoomTurns: number;
  gravity?: boolean;
  gravityTurns: number;
  wonderRoom?: boolean;
  wonderRoomTurns: number;
  magicRoom?: boolean;
  magicRoomTurns: number;
  p1Hazards?: SideHazards;
  p2Hazards?: SideHazards;
  onToggleDark?: () => void;
  isDark?: boolean;
}

const HazardBadge: React.FC<{ label: string; count?: number; color: string; title: string }> = ({ label, count, color, title }) => (
    <div className={`px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1 cursor-help ${color}`} title={title}>
        <span>{label}</span>
        {count !== undefined && count > 0 && <span className="bg-white/30 px-1 rounded">{count}</span>}
    </div>
);

export const BattleHeader: React.FC<BattleHeaderProps> = ({ 
  turn, 
  weather, 
  weatherTurns, 
  terrain, 
  terrainTurns, 
  trickRoom, 
  trickRoomTurns, 
  gravity, 
  gravityTurns, 
  wonderRoom, 
  wonderRoomTurns,
  magicRoom,
  magicRoomTurns,
  p1Hazards, 
  p2Hazards,
  onToggleDark,
  isDark
}) => {
  const weatherInfo = WEATHER_DATA[weather] || WEATHER_DATA['none'];
  const terrainInfo = TERRAIN_DATA[terrain] || TERRAIN_DATA['none'];

  // Renderiza hazards de um lado específico
  const renderHazards = (hazards?: SideHazards) => {
      if (!hazards) return null;
      return (
          <div className="flex gap-1 flex-wrap justify-center mt-1">
              {hazards.stealthRock && <HazardBadge label="🪨 Pedras" color="bg-stone-500" title="Pedras Ocultas (Dano na entrada)" />}
              {hazards.spikes > 0 && <HazardBadge label="📌 Espinhos" count={hazards.spikes} color="bg-orange-500" title="Espinhos (Dano na entrada)" />}
              {hazards.stickyWeb && <HazardBadge label="🕸️ Teia" color="bg-purple-500" title="Teia Pegajosa (Reduz velocidade na entrada)" />}
              {hazards.toxicSpikes > 0 && <HazardBadge label="☠️ Veneno" count={hazards.toxicSpikes} color="bg-fuchsia-600" title="Espinhos Tóxicos (Envenena na entrada)" />}
              
              {/* Telas e Ventos */}
              {hazards.reflect > 0 && <HazardBadge label="Reflect" count={hazards.reflect} color="bg-pink-400" title="Refletir (Aumenta Defesa)" />}
              {hazards.lightScreen > 0 && <HazardBadge label="Screen" count={hazards.lightScreen} color="bg-yellow-400" title="Tela de Luz (Aumenta Def. Esp)" />}
              {hazards.auroraVeil > 0 && <HazardBadge label="Veil" count={hazards.auroraVeil} color="bg-cyan-400" title="Véu Aurora (Aumenta Defesas)" />}
              {hazards.tailwind > 0 && <HazardBadge label="💨 Vento" count={hazards.tailwind} color="bg-sky-400" title="Vento de Cauda (Dobra Velocidade)" />}
              {hazards.safeguard > 0 && <HazardBadge label="🛡️ Safe" count={hazards.safeguard} color="bg-green-400" title="Salvaguarda (Previne Status)" />}
              {hazards.mist > 0 && <HazardBadge label="🌫️ Mist" count={hazards.mist} color="bg-blue-300" title="Névoa (Previne Redução de Status)" />}
              {hazards.luckyChant > 0 && <HazardBadge label="🍀 Sorte" count={hazards.luckyChant} color="bg-indigo-400" title="Canção da Sorte (Previne Críticos)" />}
          </div>
      );
  };

  return (
    <div className="flex flex-col items-center mb-4 mt-6 w-full max-w-4xl mx-auto relative">
      {/* Controles de Volume no canto superior */}
      <div className="absolute top-0 right-0 z-50 hidden md:flex flex-row gap-2 items-start">
          {onToggleDark && (
            <button
              onClick={onToggleDark}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-700 backdrop-blur-sm border border-gray-200 dark:border-slate-600 shadow-sm hover:scale-110 transition-transform text-lg"
              title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          )}
          <VolumeControl type="music" label="BGM" />
          <VolumeControl type="master" label="SFX" />
      </div>

      {/* Linha Principal: Turno, Clima, Terreno */}
      <div className="flex justify-center items-center space-x-4 mb-2 flex-wrap gap-y-2 mt-20 md:mt-0">
        <div className="bg-white dark:bg-slate-700 dark:text-indigo-300 dark:border-indigo-800 px-6 py-2 rounded-full shadow-md border-2 border-indigo-100 font-bold text-indigo-800 text-lg">
            Turno: {turn}
        </div>
        <div className={`px-4 py-2 rounded-full shadow-md border-2 font-bold text-sm flex items-center cursor-help ${weatherInfo.class}`}
            onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: weatherInfo.desc }))}>
            <span className="mr-1">{weatherInfo.icon}</span> {weatherInfo.name}
            {weather !== 'none' && <span className="bg-white/30 px-1.5 py-0.5 rounded text-[10px] ml-2 tabular-nums">{weatherTurns}</span>}
        </div>
        <div className={`px-4 py-2 rounded-full shadow-md border-2 font-bold text-sm flex items-center cursor-help ${terrainInfo.class}`}
            onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: terrainInfo.desc }))}>
            <span className="mr-1">{terrainInfo.icon}</span> {terrainInfo.name}
            {terrain !== 'none' && <span className="bg-white/30 px-1.5 py-0.5 rounded text-[10px] ml-2 tabular-nums">{terrainTurns}</span>}
        </div>
        {trickRoom && (
            <div className="px-4 py-2 rounded-full shadow-md border-2 bg-purple-100 border-purple-400 text-purple-800 font-bold text-sm cursor-help flex items-center"
                onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Trick Room Ativo: Lentos atacam primeiro.' }))}>
            Trick Room
            <span className="bg-white/30 px-1.5 py-0.5 rounded text-[10px] ml-2 tabular-nums">{trickRoomTurns}</span>
            </div>
        )}
        {gravity && (
            <div className="px-4 py-2 rounded-full shadow-md border-2 bg-indigo-900 border-indigo-700 text-white font-bold text-sm cursor-help flex items-center"
                onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Gravidade Intensa: Voadores no chão e precisão aumentada.' }))}>
            Gravidade
            <span className="bg-white/30 px-1.5 py-0.5 rounded text-[10px] ml-2 tabular-nums">{gravityTurns}</span>
            </div>
        )}
        {wonderRoom && (
            <div className="px-4 py-2 rounded-full shadow-md border-2 bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800 font-bold text-sm cursor-help flex items-center"
                onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Sala Maravilhosa: Defesa e Def. Especial trocadas.' }))}>
            Wonder Room
            <span className="bg-white/30 px-1.5 py-0.5 rounded text-[10px] ml-2 tabular-nums">{wonderRoomTurns}</span>
            </div>
        )}
        {magicRoom && (
            <div className="px-4 py-2 rounded-full shadow-md border-2 bg-pink-100 border-pink-400 text-pink-800 font-bold text-sm cursor-help flex items-center"
                onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Sala Mágica: Efeitos de itens estão suprimidos.' }))}>
            Magic Room
            <span className="bg-white/30 px-1.5 py-0.5 rounded text-[10px] ml-2 tabular-nums">{magicRoomTurns}</span>
            </div>
        )}
        
        {/* Controle de Volume Mobile */}
        <div className="flex md:hidden gap-2 w-full justify-center">
            {onToggleDark && (
              <button
                onClick={onToggleDark}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-700 backdrop-blur-sm border border-gray-200 dark:border-slate-600 shadow-sm hover:scale-110 transition-transform text-lg"
                title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            )}
            <VolumeControl type="music" />
            <VolumeControl type="master" />
        </div>
      </div>

      {/* Linha Secundária: Hazards e Efeitos de Campo (Dividido por Lado) */}
      <div className="grid grid-cols-2 w-full gap-4 px-4">
          {/* Lado P1 (Esquerda) */}
          <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase font-bold text-green-700 mb-1 ml-1">Campo Aliado (P1)</span>
              <div className="flex gap-1 flex-wrap">{renderHazards(p1Hazards)}</div>
          </div>

          {/* Lado P2 (Direita) */}
          <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-red-700 mb-1 mr-1">Campo Oponente (P2)</span>
              <div className="flex gap-1 flex-wrap justify-end">{renderHazards(p2Hazards)}</div>
          </div>
      </div>
    </div>
  );
};

interface BattleLogsProps {
  logs: { message: string; color: string }[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  state: BattleState;
}

export const BattleLogs: React.FC<BattleLogsProps> = ({ logs, containerRef, state }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = logs.map(l => l.message).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative mt-6 group">
      <div 
        ref={containerRef} 
        className="message-log bg-gray-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 p-4 pr-12 rounded-xl text-sm text-gray-700 h-40 overflow-y-auto shadow-inner border border-gray-200"
      >
        {logs.map((log, i) => (
          <div key={i} className={`mt-1 ${log.color}`}>
            <InteractiveLogMessage message={log.message} color={log.color} state={state} />
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleCopy}
        className={`absolute top-2 right-3 p-1.5 rounded-lg bg-white/80 dark:bg-slate-700/80 dark:border-slate-600 dark:text-slate-400 backdrop-blur-sm border shadow-sm transition-all duration-200 hover:bg-white ${copied ? 'opacity-100 border-green-400 text-green-600' : 'opacity-40 hover:opacity-100 border-gray-300 text-gray-500'}`}
        title="Copiar Logs para a Área de Transferência"
      >
        {copied ? (
           <span className="text-xs font-bold flex items-center gap-1">✓ <span className="hidden sm:inline">Copiado</span></span>
        ) : (
           <span className="text-lg leading-none">📋</span>
        )}
      </button>
    </div>
  );
};
