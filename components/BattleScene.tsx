
import React, { useState, useEffect, useRef } from 'react';
import { Pokemon, SideHazards } from '../types';
import { TYPE_COLORS } from '../data/types';
import { getRawStat } from '../services/battleUtils';
import { getMoveAnimation } from './animations/moveAnimations';
import { getDynamicMoveStyles } from './animations/styleRegistry';
import { getStatusAnimation } from './animations/statusRegistry';
import { getDamageAnimation } from './animations/general/damage';
import { getPhysicalAttackAnimation } from './animations/general/physicalAttack';
import { getSpecialAttackAnimation } from './animations/general/specialAttack';
import { getExitAnimation } from './animations/transitions/exit';
import { getEntryAnimation } from './animations/transitions/entry';
import { Screens } from './animations/field/Screens';
import { Hazards } from './animations/field/Hazards';
import { Impact } from './animations/general/Impact';
import { getProjectileAnimation } from './animations/ProjectileRegistry';
import AudioManager from '../services/audio/AudioManager';

interface BattleSceneProps {
  p1: Pokemon | null;
  p2: Pokemon | null;
  weather: string;
  terrain: string;
  animationState: { id: number; type: 'attack' | 'damage' | 'poison' | 'burn' | 'paralysis' | 'sleep' | 'freeze' | 'confusion' | 'infatuation' | 'flinch' } | null;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  team1: Pokemon[];
  team2: Pokemon[];
  p1Hazards?: SideHazards;
  p2Hazards?: SideHazards;
}

const STATUS_ICONS: Record<string, string> = {
    'poison': '☠️',
    'toxic': '☠️',
    'burn': '🔥',
    'paralysis': '⚡',
    'sleep': '💤',
    'freeze': '🧊',
    'confusion': '🐥',
    'infatuation': '😍',
    'leech-seed': '🌱',
    'bind': '🕸️',
    'wrap': '🕸️',
    'clamp': '🕸️',
    'snap-trap': '🕸️',
    'thunder-cage': '🕸️',
    'infestation': '🕸️',
    'cant-escape': '⚓',
    'fire-spin': '🌪️',
    'magma-storm': '🌪️',
    'whirlpool': '🌀',
    'sand-tomb': '🏜️'
};

// Hook para gerenciar transições de Pokémon (Entrada/Saída)
const usePokemonTransition = (pokemon: Pokemon | null, isPlayer: boolean) => {
    // Inicialização Inteligente: Se já houver um Pokémon (montagem inicial), começamos na fase 'throwing'
    // Se não houver, começamos em 'static' com activePokemon nulo
    const [activePokemon, setActivePokemon] = useState<Pokemon | null>(null);
    const [leavingPokemon, setLeavingPokemon] = useState<Pokemon | null>(null);
    const [phase, setPhase] = useState<'static' | 'exiting' | 'throwing' | 'entering'>(pokemon ? 'throwing' : 'static');
    
    // Rastreia o ID do Pokémon atual para detectar trocas
    const currentPokemonIdRef = useRef<number | undefined>(pokemon?.id);

    // Efeito de Sequência (Executa a animação baseada na fase)
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        if (phase === 'exiting') {
            timer = setTimeout(() => {
                setLeavingPokemon(null);
                setPhase('throwing');
            }, 500); // Tempo da animação de saída
        } 
        else if (phase === 'throwing') {
            timer = setTimeout(() => {
                // Ao terminar o arremesso, define o Pokémon ativo (vindo da prop) e inicia entrada
                setActivePokemon(pokemon);
                setPhase('entering');
            }, 600); // Tempo do arremesso da bola
        } 
        else if (phase === 'entering') {
            timer = setTimeout(() => {
                setPhase('static');
            }, 400); // Tempo da animação de entrada (flash)
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [phase, pokemon]); // Depende de 'pokemon' para setar o correto na fase 'throwing'

    // Efeito de Gatilho (Detecta mudança de prop para iniciar sequência)
    useEffect(() => {
        // Se o ID mudou (Troca real)
        if (pokemon?.id !== currentPokemonIdRef.current) {
            currentPokemonIdRef.current = pokemon?.id;
            
            if (activePokemon) {
                // Se já tinha um ativo, inicia saída
                setLeavingPokemon(activePokemon);
                setPhase('exiting');
            } else if (pokemon) {
                // Se estava vazio e chegou um (ex: start tardio), inicia arremesso
                setPhase('throwing');
            }
        } else {
            // Se o ID é o mesmo (apenas update de HP/Status), atualiza silenciosamente
            if (pokemon && activePokemon && pokemon !== activePokemon) {
                setActivePokemon(pokemon);
            }
        }
    }, [pokemon, activePokemon]);

    // Hook para tocar o grito (Cry) na entrada
    useEffect(() => {
        if (phase === 'entering' && activePokemon && activePokemon.cries) {
            const timer = setTimeout(() => {
                const cryUrl = activePokemon.cries?.latest || activePokemon.cries?.legacy;
                if (cryUrl) {
                    AudioManager.playCry(cryUrl);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [phase, activePokemon]);

    return { activePokemon, leavingPokemon, phase };
};

// Hook para monitorar mudanças de estatísticas e disparar animações
const useStatChangeMonitor = (pokemon: Pokemon | null) => {
    const [animClass, setAnimClass] = useState<string | null>(null);
    const [key, setKey] = useState(0);
    const prevStatsRef = useRef<number>(0);
    const prevIdRef = useRef<number | null>(null);
    
    // Serializa os estágios para garantir detecção de mudanças profundas
    const statsSignature = pokemon ? JSON.stringify(pokemon?.statStages || {}) : '';

    useEffect(() => {
        if (!pokemon) {
            setAnimClass(null);
            return;
        }

        const currentSum = Object.values(pokemon?.statStages || {}).reduce((a, b) => a + b, 0);

        // Reset ao trocar de Pokémon
        if (prevIdRef.current !== pokemon?.id) {
            prevIdRef.current = pokemon?.id ?? null;
            prevStatsRef.current = currentSum;
            setAnimClass(null);
            return;
        }

        // Se a assinatura mudou (qualquer stat mudou), verifica a direção baseada na soma
        // Se a soma for igual mas houve mudança (ex: +2 Atk, -2 Def), priorizamos Boost para feedback visual
        if (currentSum > prevStatsRef.current) {
            setAnimClass('anim-stat-boost');
            setKey(k => k + 1);
            setTimeout(() => setAnimClass(null), 2000);
        } else if (currentSum < prevStatsRef.current) {
            setAnimClass('anim-stat-drop');
            setKey(k => k + 1);
            setTimeout(() => setAnimClass(null), 2000);
        } else if (statsSignature !== (prevStatsRef as any)._lastSignature) {
            // Mudança neutra na soma, mas houve alteração
            setAnimClass('anim-stat-boost');
            setKey(k => k + 1);
            setTimeout(() => setAnimClass(null), 2000);
        }

        prevStatsRef.current = currentSum;
        (prevStatsRef as any)._lastSignature = statsSignature;

    }, [pokemon?.id, statsSignature]); // Usa a assinatura como dependência

    return { animClass, key };
};

export const BattleScene: React.FC<BattleSceneProps> = ({ 
  p1, p2, weather, terrain, animationState, 
  isMaximized, onToggleMaximize, team1, team2,
  p1Hazards, p2Hazards
}) => {
  // Gerenciamento de Transições
  const transP1 = usePokemonTransition(p1, true);
  const transP2 = usePokemonTransition(p2, false);

  // Monitoramento de Stat Changes (Visual)
  const statAnimP1 = useStatChangeMonitor(transP1.activePokemon);
  const statAnimP2 = useStatChangeMonitor(transP2.activePokemon);

  // Helper para renderizar projéteis
  const renderProjectile = () => {
    if (animationState?.type !== 'attack') return null;

    if (p1 && animationState.id === p1.id) {
        const projectile = getProjectileAnimation(p1.selectedMove?.name, true);
        if (projectile) return projectile;
    }
    if (p2 && animationState.id === p2.id) {
        const projectile = getProjectileAnimation(p2.selectedMove?.name, false);
        if (projectile) return projectile;
    }
    return null;
  };

  // Configuração Dinâmica do Cenário
  const getTerrainStyle = () => {
    const skyTop = weather === 'rain' ? '#334155' : weather === 'sun' ? '#0ea5e9' : '#38bdf8';
    const skyBot = weather === 'rain' ? '#475569' : weather === 'sun' ? '#7dd3fc' : '#bae6fd';
    const skyGradient = `linear-gradient(to bottom, ${skyTop} 0%, ${skyBot} 55%`;

    switch (terrain) {
      case 'electric':
        return {
          background: `
            ${skyGradient}, #facc15 55%, #eab308 100%),
            repeating-linear-gradient(90deg, transparent 0, transparent 29px, rgba(255,255,255,0.3) 30px) 0 55% / 100% 45% no-repeat
          `
        };
      case 'grassy':
        return {
          background: `
            ${skyGradient}, #4ade80 55%, #16a34a 100%),
            radial-gradient(circle at 50% 100%, rgba(255,255,255,0.2) 0%, transparent 10%) 0 55% / 20px 20px repeat-x
          `
        };
      case 'misty':
        return {
          background: `
            ${skyGradient}, #f472b6 55%, #fce7f3 100%)
          `
        };
      case 'psychic':
        return {
          background: `
            linear-gradient(to bottom, #1e1b4b 0%, #4338ca 55%, #a855f7 55%, #581c87 100%),
            repeating-radial-gradient(circle at 50% 120%, transparent 0, transparent 40px, rgba(255,255,255,0.05) 41px, transparent 42px)
          `
        };
      default:
        return {
          background: `
            ${skyGradient}, #a3e635 55%, #65a30d 100%)
          `
        };
    }
  };

  const renderWeather = () => {
    switch (weather) {
      case 'rain':
        return (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[40%] bg-slate-700 blur-xl opacity-80 z-10"></div>
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               <div className="absolute top-[-100%] left-[-50%] w-[200%] h-[300%] rotate-[20deg] opacity-30">
                   <div className="w-full h-full animate-rain-slow" style={{
                       backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                       backgroundSize: '20px 30px, 30px 20px, 22px 22px',
                       backgroundRepeat: 'repeat'
                   }}></div>
               </div>
               <div className="absolute top-[-100%] left-[-50%] w-[200%] h-[300%] rotate-[30deg] opacity-60">
                   <div className="w-full h-full animate-rain-fast" style={{
                       backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.8) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.7) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.8) 2px, transparent 2px)`,
                       backgroundSize: '40px 60px, 50px 50px, 40px 40px',
                       backgroundRepeat: 'repeat',
                       filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.4))'
                   }}></div>
               </div>
            </div>
            <div className="absolute inset-0 bg-slate-900/30 pointer-events-none z-10 mix-blend-multiply"></div>
          </>
        );
      case 'sun':
        return (
          <>
            <div className="absolute top-[-30px] left-[-30px] w-32 h-32 bg-yellow-200 rounded-full blur-2xl opacity-60 z-10 animate-pulse-slow mix-blend-screen"></div>
            <div className="absolute top-[-10px] left-[-10px] w-16 h-16 bg-white rounded-full blur-md opacity-90 z-10"></div>
            <div className="absolute inset-0 pointer-events-none z-10 bg-orange-400/10 mix-blend-overlay"></div>
          </>
        );
      case 'sand':
        return (
          <div className="absolute inset-0 pointer-events-none z-20 bg-yellow-900/20 sepia contrast-125">
             <div className="absolute inset-0 animate-sand opacity-60" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
                backgroundSize: '200px 200px'
             }}></div>
          </div>
        );
      case 'hail':
        return (
          <div className="absolute inset-0 pointer-events-none z-20 opacity-70">
             <div className="absolute inset-0 animate-snow" style={{
               backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 2px)',
               backgroundSize: '25px 25px',
               animationDuration: isMaximized ? '3.5s' : '1.5s'
             }}></div>
          </div>
        );
      default: return null;
    }
  };

  // Helper para HUD
  const renderHUD = (pokemon: Pokemon, team: Pokemon[], isPlayer: boolean, opponentAbility?: string) => {
      const hpPercent = ((pokemon?.hp ?? 0) / (pokemon?.maxHP || 1)) * 100;
      const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500';
      
      const calculateIvPercentage = (): number => {
          if (!pokemon?.ivs) return 100;
          const sum = (Object.values(pokemon?.ivs) as number[]).reduce((a, b) => a + b, 0);
          return Math.round((sum / (31 * 6)) * 100);
      };
      const iv = calculateIvPercentage();
      const speed = getRawStat(pokemon, 'speed', weather, terrain, false, opponentAbility);

      return (
          <div className={`absolute z-40 ${isPlayer ? 'bottom-6 right-6' : 'top-6 left-6'} bg-gray-900/80 rounded-lg p-3 text-white border-2 border-gray-600 shadow-xl min-w-[200px] backdrop-blur-sm select-none`}>
              {/* Nome e Gênero/Nível */}
              <div className="flex justify-between items-baseline mb-1 gap-2">
                  <div className="flex items-center gap-1 overflow-hidden">
                      <span className="font-bold text-sm tracking-wide drop-shadow-md whitespace-nowrap truncate">{pokemon?.name ?? 'Pokémon'}</span>
                      <div className="flex gap-0.5">
                        {Object.keys(pokemon?.statusEffects || {}).map(status => {
                            if (STATUS_ICONS[status]) {
                                return <span key={status} className="text-sm cursor-help" title={status}>{STATUS_ICONS[status]}</span>;
                            }
                            return null;
                        })}
                      </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs shrink-0">
                      {pokemon?.gender === 'male' && <span className="text-blue-400">♂</span>}
                      {pokemon?.gender === 'female' && <span className="text-pink-400">♀</span>}
                      <span className="text-gray-300 font-bold mr-1">Nv. {pokemon?.level || 50}</span>
                      <span className="text-yellow-400 font-mono font-bold">IV {iv}%</span>
                  </div>
              </div>

              {/* Barra de HP */}
              <div className="w-full bg-gray-700 h-2.5 rounded-full mb-1 border border-gray-600 relative overflow-hidden">
                  <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
              </div>

              {/* Texto de HP (Para Todos) e Ícones de Time (Para Todos) */}
              <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] font-mono text-gray-300">
                      {pokemon?.hp ?? 0}/{pokemon?.maxHP ?? 0} <span className="ml-2 text-blue-200">Vel: {speed}</span>
                  </span>
                  
                  <div className="flex gap-0.5">
                      {team?.map((p, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full border border-gray-500 ${p?.isFainted ? 'bg-gray-600' : 'bg-red-500'}`} />
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const getTeraStyle = (pokemon: Pokemon | null) => {
      if (pokemon?.isTerastallized && pokemon.teraType) {
          const color = TYPE_COLORS[pokemon.teraType];
          // Borda mais grossa com múltiplas camadas de sombra
          return { filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 5px ${color}) drop-shadow(0 0 10px ${color})` };
      }
      return {};
  };

  const resolveAnimation = (pokemon: Pokemon | null, isPlayer: boolean, phase: string): { className?: string; style?: React.CSSProperties } => {
      if (!pokemon) return { className: '', style: {} };

      // 1. Transições (Entry/Exit) tem prioridade máxima
      if (phase === 'exiting') {
          return getExitAnimation(isPlayer);
      }
      if (phase === 'entering') {
          return getEntryAnimation(isPlayer);
      }
      if (phase === 'throwing') {
          return { style: { display: 'none' } }; // Oculta sprite enquanto joga a bola
      }

      const animType = animationState?.id === pokemon.id ? animationState?.type : null;
      
      // 2. Verifica Animações de Status
      if (animType === 'poison' || animType === 'burn' || animType === 'paralysis' || animType === 'sleep' || animType === 'freeze' || animType === 'confusion' || animType === 'infatuation' || animType === 'flinch') {
          return getStatusAnimation(animType as any, isPlayer);
      }

      // 3. Tenta obter animação específica do movimento (Dig, Fly, etc)
      const moveAnim = getMoveAnimation(pokemon, animType === 'attack' || animType === 'damage' ? animType : null, isPlayer);
      if (moveAnim.className || moveAnim.style) return moveAnim;

      // 4. Fallback para animações padrão
      if (animType === 'attack') {
          const damageClass = pokemon.selectedMove?.damageClass;
          if (damageClass === 'physical') {
              return getPhysicalAttackAnimation(isPlayer);
          }
          return getSpecialAttackAnimation(isPlayer);
      }
      if (animType === 'damage') {
          return getDamageAnimation();
      }

      // 5. Idle
      return { className: isPlayer ? 'animate-idle-float' : 'animate-idle-float-delay' };
  };

  // Determine qual Pokémon renderizar baseado na fase de transição
  const renderP1 = transP1.phase === 'exiting' ? transP1.leavingPokemon : transP1.activePokemon;
  const renderP2 = transP2.phase === 'exiting' ? transP2.leavingPokemon : transP2.activePokemon;

  const p1AnimData = resolveAnimation(renderP1, true, transP1.phase);
  const p2AnimData = resolveAnimation(renderP2, false, transP2.phase);

  // Dimensões do Sprite baseadas no estado maximizado
  const spriteSizeP2 = isMaximized ? 'w-24 h-24 md:w-32 md:h-32' : 'w-14 h-14 md:w-16 md:h-16';
  const spriteSizeP1 = isMaximized ? 'w-28 h-28 md:w-40 md:h-40' : 'w-16 h-16 md:w-20 md:h-20';

  // Posições ajustadas para o modo maximizado para não sobrepor o HUD
  const p2Pos = isMaximized ? 'top-[50%] right-[15%]' : 'top-[28%] right-[8%]';
  const p1Pos = isMaximized ? 'bottom-[10%] left-[10%]' : 'bottom-[2%] left-[5%]';
  
  const shadowP2Pos = isMaximized ? 'top-[70%] right-[15%]' : 'top-[58%] right-[8%]';
  const shadowP1Pos = isMaximized ? 'bottom-[15%] left-[12%]' : 'bottom-[8%] left-[8%]';

  // Tamanho do container
  const containerClass = isMaximized 
      ? 'w-full h-[400px] md:h-[450px] max-w-4xl mx-auto rounded-xl border-[4px] border-gray-800 bg-gray-800 overflow-hidden shadow-2xl flex-shrink-0 transition-all duration-700 isolate relative' 
      : 'w-full max-w-[300px] h-32 md:w-44 md:h-32 mx-auto rounded-xl border-[4px] border-gray-800 bg-gray-800 overflow-hidden shadow-2xl flex-shrink-0 transition-all duration-700 isolate relative';

  return (
    <div className="flex flex-col items-center relative w-full transition-all duration-500">
        
        {/* Botão de Maximizar */}
        {!isMaximized && (
            <button 
                onClick={onToggleMaximize}
                className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 bg-gray-200/50 hover:bg-gray-200 px-2 py-1 rounded-full backdrop-blur-sm"
                title="Maximizar Tela de Batalha"
            >
                <span className="text-sm font-bold">⛶ Ampliar</span>
            </button>
        )}

        <div className={containerClass}>
            {/* Botão de Minimizar */}
            {isMaximized && (
                <button 
                    onClick={onToggleMaximize}
                    className="absolute top-2 right-2 z-50 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                    title="Minimizar"
                >
                    <span className="text-lg font-bold">✕</span>
                </button>
            )}

            {/* Estilos CSS */}
            <style>{`
                @keyframes rain-fall { 0% { background-position: 0px 0px; } 100% { background-position: 100px 400px; } }
                @keyframes rain-fall-slow { 0% { background-position: 0px 0px; } 100% { background-position: 50px 400px; } }
                .animate-rain-fast { animation: rain-fall 0.8s linear infinite; }
                .animate-rain-slow { animation: rain-fall-slow 2.0s linear infinite; }
                @keyframes snow { 0% { background-position: 0 0; } 100% { background-position: 20px 100%; } }
                @keyframes sand { 0% { background-position: 0 0; } 100% { background-position: 150% 0; } }
                @keyframes idle-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
                @keyframes flash { 0% { opacity: 0; } 15% { opacity: 0.9; } 100% { opacity: 0; } }
                
                /* Injeção Dinâmica de CSS dos Movimentos e Transições */
                ${getDynamicMoveStyles()}

                .animate-snow { animation: snow 1.5s linear infinite; }
                .animate-sand { animation: sand 2s linear infinite; }
                .animate-idle-float { animation: idle-float 2.5s ease-in-out infinite; }
                .animate-idle-float-delay { animation: idle-float 2.8s ease-in-out infinite reverse; }
                .animate-flash { animation: flash 0.3s ease-out forwards; }
            `}</style>

            <div className="absolute inset-0 transition-all duration-1000 ease-in-out z-0" style={getTerrainStyle()}></div>
            {renderWeather()}
            {animationState?.type === 'damage' && <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-flash"></div>}
            
            {/* Renderização de Projéteis Especiais */}
            {renderProjectile()}

            {/* Pokéballs Throw Animations */}
            {transP1.phase === 'throwing' && <div className="pokeball-projectile anim-throw-p1"></div>}
            {transP2.phase === 'throwing' && <div className="pokeball-projectile anim-throw-p2"></div>}

            {/* Sombras - Escondidas se o pokemon estiver 'voando', 'cavando' ou em transição */}
            {!renderP2?.chargingMove && transP2.phase !== 'throwing' && (
                <div className={`absolute ${shadowP2Pos} w-12 h-3 bg-black/40 rounded-[50%] blur-[2px] transform scale-y-50 mix-blend-multiply transition-all duration-500 z-10 ${isMaximized ? 'scale-150' : ''} ${transP2.phase !== 'static' ? 'opacity-0' : 'opacity-100'}`}></div>
            )}
            {!renderP1?.chargingMove && transP1.phase !== 'throwing' && (
                <div className={`absolute ${shadowP1Pos} w-16 h-4 bg-black/40 rounded-[50%] blur-[3px] transform scale-y-50 mix-blend-multiply transition-all duration-500 z-10 ${isMaximized ? 'scale-150' : ''} ${transP1.phase !== 'static' ? 'opacity-0' : 'opacity-100'}`}></div>
            )}

            {/* Sprites P2 (Oponente) */}
            {renderP2 && !renderP2?.isFainted && transP2.phase !== 'throwing' && (
                <div 
                    className={`absolute ${p2Pos} z-20 ${spriteSizeP2} flex items-center justify-center transition-all duration-500 ${p2AnimData.className}`}
                    style={p2AnimData.style}
                >
                <img 
                    key={renderP2?.pixelSpriteUrl} // Force re-render on sprite change
                    src={renderP2?.pixelSpriteUrl} 
                    alt={renderP2?.name ?? 'Pokémon'} 
                    className="w-full h-full object-contain filter drop-shadow-md"
                    style={{ imageRendering: 'pixelated', ...getTeraStyle(renderP2) }}
                />
                <Screens hazards={p2Hazards} />
                <Hazards hazards={p2Hazards} />
                {animationState?.id === renderP2?.id && animationState.type === 'damage' && <Impact />}
                {/* Stat Change Overlay */}
                {statAnimP2.animClass && (
                    <div key={`stat-p2-${statAnimP2.key}`} className={statAnimP2.animClass}></div>
                )}
                </div>
            )}

            {/* Sprites P1 (Jogador) */}
            {renderP1 && !renderP1?.isFainted && transP1.phase !== 'throwing' && (
                <div 
                    className={`absolute ${p1Pos} z-30 ${spriteSizeP1} flex items-center justify-center transition-all duration-500 ${p1AnimData.className}`}
                    style={p1AnimData.style}
                >
                <img 
                    key={renderP1?.backSpriteUrl} // Force re-render on sprite change
                    src={renderP1?.backSpriteUrl} 
                    alt={renderP1?.name ?? 'Pokémon'} 
                    className="w-full h-full object-contain filter drop-shadow-md"
                    style={{ 
                        imageRendering: 'pixelated', 
                        transform: renderP1?.backSpriteUrl && !renderP1?.backSpriteUrl.includes('/back/') ? 'scaleX(-1)' : undefined,
                        ...getTeraStyle(renderP1) 
                    }}
                />
                <Screens hazards={p1Hazards} />
                <Hazards hazards={p1Hazards} />
                {animationState?.id === renderP1?.id && animationState.type === 'damage' && <Impact />}
                {/* Stat Change Overlay */}
                {statAnimP1.animClass && (
                    <div key={`stat-p1-${statAnimP1.key}`} className={statAnimP1.animClass}></div>
                )}
                </div>
            )}

            {/* HUDs (Apenas Maximizado) */}
            {/* O HUD deve sumir durante a troca para não mostrar dados do Pokémon errado */}
            {isMaximized && renderP2 && transP2.phase === 'static' && renderHUD(renderP2, team2, false, renderP1?.ability)}
            {isMaximized && renderP1 && transP1.phase === 'static' && renderHUD(renderP1, team1, true, renderP2?.ability)}
        </div>
    </div>
  );
};
