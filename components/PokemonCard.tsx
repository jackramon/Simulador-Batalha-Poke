
import React from 'react';
import { Pokemon, StatStages, SideHazards } from '../types';
import { getRawStat } from '../services/battleUtils';
import { TYPE_NAMES_PT, TYPE_COLORS } from '../data/types';
import { STATUS_TRANSLATIONS } from '../data/translations';
import { ABILITY_EFFECTS } from '../data/abilities';
import { ITEMS_DATA } from '../data/items';

interface PokemonCardProps {
  pokemon: Pokemon | null;
  isPlayer: boolean;
  weather: string;
  terrain?: string; // Adicionado terreno opcional
  team: Pokemon[];
  showTeraType?: boolean; // Nova prop para controlar exibição do Tera Type
  animationType?: 'attack' | 'damage' | 'poison' | 'burn' | 'paralysis' | 'sleep' | 'freeze' | 'confusion' | 'infatuation' | 'flinch' | null; // Novo: Controle de animação
  sideHazards?: SideHazards; // Novo: Hazards afetando este lado
  opponentAbility?: string; // Novo: Habilidade do oponente para efeitos de aura
}

// Lista de status internos que NÃO devem ser renderizados como badges na UI
const HIDDEN_STATUSES = [
    // --- Relatados pelo Usuário / Visíveis Indevidamente ---
    'flinch',                 // Recuo (Efeito instantâneo)
    'heal',                   // Cura (Efeito instantâneo)
    'recharge',               // Recarga (Hyper Beam etc)
    'future-sight',           // Visão do Futuro (Marcador invisível no alvo)
    'uproar',                 // Algazarra (Estado de campo/usuário, não status ailment comum)

    // --- Status Voláteis e de Controle (Ocultos para UI Minimalista) ---
    'grounded',               // Smack Down / Thousand Arrows
    'infatuation',            // Attract / Cute Charm
    'curse',                  // Curse (Ghost)
    'yawn',                   // Yawn (Turno de preparação)
    'embargo',                // Embargo
    'heal-block',             // Psychic Noise / Heal Block
    'torment',                // Torment
    'taunt',                  // Taunt
    'perish-song',            // Perish Song (Já tem contador lógico e logs)
    'encore',                 // Bis
    'imprison',               // Selo
    'gastro-acid',            // Ácido Gástrico
    'foresight',              // Profecia
    'miracle-eye',            // Olho Milagroso
    'lock-on',                // Trava de Mira
    'mind-reader',            // Leitura Mental
    'laser-focus',            // Foco Laser
    'magnet-rise',            // Levitação Magnética
    'telekinesis',            // Telecinesia
    'substitute',             // Substituto (Visualmente representado pelo boneco/HP, não precisa de badge)

    // --- Aprisionamento (Exibido via indicador agregado "PRESO") ---
    'bind', 'wrap', 'fire-spin', 'whirlpool', 'clamp',
    'sand-tomb', 'magma-storm', 'infestation', 'snap-trap', 'thunder-cage',

    // --- Rastreadores de Estatística e Dano ---
    'stat-dropped',           // Lash Out / Defiant
    'stat-raised',            // Burning Jealousy
    'physical-damage-taken',  // Counter / Metal Burst
    'special-damage-taken',   // Mirror Coat / Metal Burst
    'avalanche-tracker',      // Avalanche / Revenge
    
    // --- Estados Semi-Invulneráveis (Geralmente animados ou implícitos) ---
    'flying',                 // Fly
    'digging',                // Dig
    'diving',                 // Dive
    'bouncing',               // Bounce
    'shadow-force',           // Shadow Force / Phantom Force

    // --- Travas, Cargas e Preparação ---
    'outrage-lock',           // Outrage
    'petal-dance-lock',       // Petal Dance
    'thrash-lock',            // Thrash
    'raging-fury-lock',       // Raging Fury
    'rollout-lock',           // Rollout / Ice Ball (Trava de movimento)
    'charging',               // Solar Beam / Meteor Beam / Sky Attack
    'beak-blast-charging',    // Beak Blast
    'focus-energy',           // Lansat Berry / Focus Energy
    'charge',                 // Charge (Move)
    
    // --- Contadores de Sequência e Buffs Internos ---
    'rollout-streak',         // Rollout (Contador de dano)
    'fury-cutter-streak',     // Fury Cutter
    'echoed-voice-streak',    // Echoed Voice
    'defense-curl-active',    // Defense Curl (Potencializa Rollout)
    'minimize',               // Minimize (Afeta Stomp/Body Slam)

    // --- Proteções Temporárias ---
    'protect',                // Protect / Detect
    'detect',                 // Detect
    'endure',                 // Endure
    'throat-chop-prevention', // Throat Chop
    'magic-coat',             // Magic Coat
    'quick-guard',            // Guarda Rápida
    'wide-guard',             // Guarda Ampla
    'crafty-shield',          // Escudo Astuto
    'spiky-shield',           // Escudo de Espinhos
    'kings-shield',           // Escudo Real
    'baneful-bunker',         // Bunker Funesto
    'obstruct',               // Obstruir
    'silk-trap',              // Armadilha de Seda
    'burning-bulwark',        // Muralha Ardente

    // --- Ativadores de Habilidade e Itens ---
    'flash-fire-active',      // Flash Fire tracker
    'unburden-active',        // Unburden tracker
    'charged',                // Charge / Electromorphosis / Wind Power
    'truant-loafing',         // Truant logic
    'cud-chew-berry',         // Cud Chew logic
    'commander-active',       // Commander logic
    'libero-activated',       // Libero logic
    'rage-active',            // Rage logic

    // --- Marcadores de Forma e Transformação ---
    'transformed',                // Transform / Imposter
    'disguise-busted',            // Mimikyu
    'ice-face-broken',            // Eiscue
    'gulping-form',               // Cramorant
    'gorging-form',               // Cramorant
    'zero-to-hero-activated',     // Palafin (Saiu de campo)
    'zero-to-hero-transformed',   // Palafin (Hero)
    'tera-shifted',               // Terapagos
    'zen-mode-active',            // Darmanitan
    'hangry-mode',                // Morpeko
    'roosting',                   // Roost (Perda de tipo voador temporária)

    // --- Lógica Interna de Roteamento de Efeitos (Move Effects) ---
    'uproar-start', 'rage-start', 'switch-self', 'self-faint', 'force-switch', 'memento', 'parting-shot-effect',
    'knock-off-effect', 'screen-break', 'remove-terrain', 'reset-stats', 'item-check', 
    'sucker-punch-check', 'pursuit-check', 'last-resort-check', 'break-protect', 
    'always-hit', 'always-crit', 'high-crit', 'hp-based', 'hp-halve', 'leave-1-hp', 
    'terrain-boost', 'variable-damage', 'speed-based', 'weight-based', 'crash-damage', 
    'recoil', 'recoil-half', 'drain', 'priority', 'sound', 
    'stomp-effect', 'bug-bite-effect', 'steal-item', 'scale-shot-stats', 
    'retaliate-boost', 'lash-out-boost', 'assurance-boost', 'venoshock-boost', 
    'tantrum-boost', 'facade-boost', 'secret-power-effect', 'hidden-power-type', 
    'thunder-fang-effect', 'ice-fang-effect', 'brine-boost', 'all-stats-up', 
    'incinerate-effect', 'wake-up-slap', 'trailblaze-effect', 'superpower-drop', 
    'close-combat-drop', 'self-atk-def-down', 'self-spAttack-down-2', 'burning-jealousy',
    'scorching-sands', 'breaking-swipe', 'alluring-voice'
];

export const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, isPlayer, weather, terrain, team, showTeraType, animationType, sideHazards, opponentAbility }) => {
  if (!pokemon) return <div className="pokemon-card p-4 w-full max-w-sm rounded-xl border opacity-0"></div>;

  const hpPercent = pokemon ? ((pokemon?.hp ?? 0) / (pokemon?.maxHP || 1)) * 100 : 0;
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500';
  const bgColor = isPlayer
    ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800'
    : 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800';
  const textColor = isPlayer
    ? 'text-green-800 dark:text-green-300'
    : 'text-red-800 dark:text-red-300';

  const genderIcon = pokemon?.gender === 'male' ? '♂' : pokemon?.gender === 'female' ? '♀' : '';
  const genderColor = pokemon?.gender === 'male' ? 'text-blue-500' : pokemon?.gender === 'female' ? 'text-pink-500' : '';

  // Configuração da animação
  let animClass = '';
  if (animationType === 'attack') {
      animClass = isPlayer ? 'anim-lunge' : 'anim-lunge-enemy';
  } else if (animationType === 'damage') {
      animClass = 'anim-shake';
  }

  // Fixed: explicitly typed 'stat' as keyof StatStages to avoid inference issues with 'string | number | symbol'
  const getStatInfo = (stat: keyof StatStages) => {
    if (!pokemon) return { val: 0, arrow: null, colorClass: "text-gray-800" };
    // Passando terrain e tailwind para getRawStat
    const isTailwind = (sideHazards?.tailwind || 0) > 0;
    const val = getRawStat(pokemon, stat, weather, terrain, isTailwind, opponentAbility);
    const stage = pokemon?.statStages?.[stat] ?? 0;
    
    let arrow = null;
    let colorClass = "text-gray-800";
    
    if (stage > 0) { 
        arrow = "▲"; 
        colorClass = "text-green-600 font-bold"; 
    } else if (stage < 0) { 
        arrow = "▼"; 
        colorClass = "text-red-600 font-bold"; 
    }
    
    // --- LÓGICA VISUAL PARA BOOSTS DE HABILIDADE/ITEM/CAMPO (Que não são Stages) ---
    // SPEED
    if (stat === 'speed') {
        const isSwiftSwim = pokemon?.ability === 'swift-swim' && weather === 'rain';
        const isChlorophyll = pokemon?.ability === 'chlorophyll' && weather === 'sun';
        const isSlushRush = pokemon?.ability === 'slush-rush' && weather === 'hail';
        const isSandRush = pokemon?.ability === 'sand-rush' && weather === 'sand';
        const isUnburden = !!pokemon?.statusEffects?.['unburden-active'];
        const isScarf = pokemon?.heldItem === 'choice-scarf';
        const isQuickFeet = pokemon?.ability === 'quick-feet' && Object.keys(pokemon?.statusEffects || {}).some(s => ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'].includes(s));

        if (isSwiftSwim || isChlorophyll || isSlushRush || isSandRush || isUnburden || isScarf || isQuickFeet || isTailwind) {
             colorClass = "text-green-600 font-bold";
             if (!arrow) arrow = "▲"; 
        }

        if (pokemon?.ability === 'slow-start' && (pokemon?.turnsActive ?? 0) < 5) {
             colorClass = "text-red-600 font-bold";
             if (!arrow) arrow = "▼";
        }

        if (pokemon?.statusEffects?.paralysis && pokemon?.ability !== 'quick-feet') {
             colorClass = "text-red-600 font-bold";
             if (!arrow) arrow = "▼";
        }

        if (pokemon?.heldItem === 'iron-ball') {
            colorClass = "text-red-600 font-bold";
            if (!arrow) arrow = "▼";
        }
    }
    
    // ATTACK
    if (stat === 'attack') {
        const isHugePower = pokemon?.ability === 'huge-power' || pokemon?.ability === 'pure-power';
        const isGuts = pokemon?.ability === 'guts' && Object.keys(pokemon?.statusEffects || {}).some(s => ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'].includes(s));
        const isBand = pokemon?.heldItem === 'choice-band';
        const isSlowStart = pokemon?.ability === 'slow-start' && (pokemon?.turnsActive ?? 0) < 5;
        const isDefeatist = pokemon?.ability === 'defeatist' && (pokemon?.hp ?? 0) <= (pokemon?.maxHP ?? 1) / 2;
        const isBurned = pokemon?.statusEffects?.burn && pokemon?.ability !== 'guts';
        const isTabletsOfRuin = opponentAbility === 'tablets-of-ruin' && pokemon?.ability !== 'tablets-of-ruin';

        if (isHugePower || isGuts || isBand) {
             colorClass = "text-green-600 font-bold";
             if (!arrow) arrow = "▲"; 
        }
        
        if (isSlowStart || isDefeatist || isBurned || isTabletsOfRuin) {
             colorClass = "text-red-600 font-bold";
             if (!arrow) arrow = "▼";
        }
    }

    // SP ATTACK
    if (stat === 'spAttack') {
        const isSpecs = pokemon?.heldItem === 'choice-specs';
        const isSolarPower = pokemon?.ability === 'solar-power' && weather === 'sun';
        const isDefeatist = pokemon?.ability === 'defeatist' && (pokemon?.hp ?? 0) <= (pokemon?.maxHP ?? 1) / 2;
        const isVesselOfRuin = opponentAbility === 'vessel-of-ruin' && pokemon?.ability !== 'vessel-of-ruin';

        if (isSpecs || isSolarPower) {
             colorClass = "text-green-600 font-bold";
             if (!arrow) arrow = "▲"; 
        }

        if (isDefeatist || isVesselOfRuin) {
             colorClass = "text-red-600 font-bold";
             if (!arrow) arrow = "▼";
        }
    }
    
    // DEFENSE
    if (stat === 'defense') {
        const isMarvelScale = pokemon?.ability === 'marvel-scale' && Object.keys(pokemon?.statusEffects || {}).some(s => ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'].includes(s));
        const isFurCoat = pokemon?.ability === 'fur-coat'; 
        const isSwordOfRuin = opponentAbility === 'sword-of-ruin' && pokemon?.ability !== 'sword-of-ruin';
        
        if (isMarvelScale || isFurCoat) {
             colorClass = "text-green-600 font-bold";
             if (!arrow) arrow = "▲"; 
        }

        if (isSwordOfRuin) {
             colorClass = "text-red-600 font-bold";
             if (!arrow) arrow = "▼";
        }
    }

    // SP DEFENSE
    if (stat === 'spDefense') {
        const isSandRock = weather === 'sand' && (pokemon?.types || []).includes('rock');
        const isAssaultVest = pokemon?.heldItem === 'assault-vest';
        const isBeadsOfRuin = opponentAbility === 'beads-of-ruin' && pokemon?.ability !== 'beads-of-ruin';
        
        if (isSandRock || isAssaultVest) {
             colorClass = "text-green-600 font-bold";
             if (!arrow) arrow = "▲"; 
        }

        if (isBeadsOfRuin) {
             colorClass = "text-red-600 font-bold";
             if (!arrow) arrow = "▼";
        }
    }

    return { val, arrow, colorClass };
  };

  // Fixed: explicitly typed 'statKey' as keyof StatStages
  const renderStat = (label: string, statKey: keyof StatStages) => {
    const { val, arrow, colorClass } = getStatInfo(statKey);
    return (
      <div className="bg-white/80 dark:bg-slate-700/80 dark:border-slate-600 border p-1 rounded flex items-center justify-center gap-1" title={label}>
        <span className="text-gray-600 dark:text-slate-400 text-[10px] uppercase">{label}:</span>
        <span className={`text-xs ${colorClass}`}>{val}</span>
        {arrow && <span className={`text-[10px] ${colorClass}`}>{arrow}</span>}
      </div>
    );
  };

  const handleAbilityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pokemon?.ability) {
      const desc = ABILITY_EFFECTS[pokemon?.ability]?.desc || pokemon?.ability;
      window.dispatchEvent(new CustomEvent('show-toast', { detail: desc }));
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pokemon?.heldItem) {
      const desc = ITEMS_DATA[pokemon?.heldItem]?.desc || pokemon?.heldItem;
      window.dispatchEvent(new CustomEvent('show-toast', { detail: desc }));
    }
  };

  const handleStatusClick = (e: React.MouseEvent, effect: string) => {
    e.stopPropagation();
    const desc = STATUS_TRANSLATIONS[effect]?.desc || effect;
    window.dispatchEvent(new CustomEvent('show-toast', { detail: desc }));
  };

  const isCurrentlyTrapped = ['bind', 'wrap', 'fire-spin', 'whirlpool', 'clamp', 'sand-tomb', 'magma-storm', 'infestation', 'snap-trap', 'thunder-cage']
    .some(status => !!pokemon?.statusEffects?.[status]);

  const isTerastallized = pokemon?.isTerastallized;
  const teraBorderColor = isTerastallized && pokemon?.teraType ? TYPE_COLORS[pokemon?.teraType] : undefined;

  // Cálculo da porcentagem de IVs
  const calculateIvPercentage = (): number => {
      if (!pokemon?.ivs) return 100; // Retrocompatibilidade ou padrão
      const sum = (Object.values(pokemon?.ivs) as number[]).reduce((a, b) => a + b, 0);
      return Math.round((sum / (31 * 6)) * 100);
  };
  const ivPercent = calculateIvPercentage();
  const ivColor = ivPercent === 100 ? 'text-yellow-500 font-black' : ivPercent >= 80 ? 'text-green-600' : 'text-gray-500';

  return (
    <div 
      className={`pokemon-card relative ${bgColor} p-4 w-full max-w-sm rounded-xl ${isTerastallized ? 'border-4' : 'border'} ${pokemon?.isFainted ? 'opacity-50 grayscale' : ''} ${animClass}`}
      style={teraBorderColor ? { borderColor: teraBorderColor } as React.CSSProperties : undefined}
    >
      {/* Overlay para efeito Terastal pulsante - Separado para não conflitar com animações de movimento no pai */}
      {isTerastallized && teraBorderColor && (
        <div 
          className="absolute inset-0 rounded-xl tera-border-pulse pointer-events-none z-10"
          style={{ '--tera-color': teraBorderColor } as React.CSSProperties}
        />
      )}

      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1 bg-white/60 p-1.5 rounded-full border shadow-sm" title="Equipe Restante">
          {team?.map((p, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full border ${p?.isFainted ? 'bg-gray-300 border-gray-400' : 'bg-red-500 border-red-700'}`} />
          ))}
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/60 px-2 py-1 rounded-lg border shadow-sm">
          {isPlayer ? 'Você (P1)' : 'Oponente (P2)'}
        </span>
      </div>

      <h2 className={`text-2xl md:text-3xl font-extrabold ${textColor} text-center mb-2 leading-tight flex flex-wrap justify-center items-center gap-2`}>
        <span>{pokemon?.name ?? 'Pokémon'}</span>
        {pokemon?.isShiny && (
            <span className="text-yellow-500 text-xl ml-1 animate-pulse" title="Brilhante (Shiny)">✨</span>
        )}
        {pokemon?.gender && pokemon?.gender !== 'genderless' && (
          <span className={`text-2xl ${genderColor} inline-block`} title={pokemon?.gender === 'male' ? 'Macho' : 'Fêmea'}>
            {genderIcon}
          </span>
        )}
      </h2>

      <div className="flex justify-center items-center gap-2 mb-1 flex-wrap">
        {pokemon?.ability && (
          <span className="inline-block bg-gray-700 text-white text-xs px-2 py-1 rounded-full cursor-help hover:bg-gray-600" onClick={handleAbilityClick}>
            Hab: {ABILITY_EFFECTS[pokemon?.ability]?.name || pokemon?.ability}
          </span>
        )}
        <span className="inline-block text-xs px-2 py-1 rounded-full border bg-white text-gray-700 font-bold" title="Nível">
            Nv. {pokemon?.level || 50}
        </span>
        <span className={`inline-block text-xs px-2 py-1 rounded-full border bg-white ${ivColor}`} title="Porcentagem de IVs (Valores Individuais)">
            IV: {ivPercent}%
        </span>
        {/* Indicador Visual de Item (Ícone/Texto pequeno) */}
        {pokemon?.heldItem && (
          <span className="inline-flex items-center bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-1 rounded-full cursor-help hover:bg-amber-200 gap-1" onClick={handleItemClick}>
            <span role="img" aria-label="item">🎁</span> {ITEMS_DATA[pokemon?.heldItem]?.name ?? pokemon?.heldItem}
          </span>
        )}
      </div>

      <div className="flex justify-center gap-1 mt-1 flex-wrap">
        {Object.keys(pokemon?.statusEffects || {})
          .filter(effect => !HIDDEN_STATUSES.includes(effect)) // Filtra status internos
          .map(effect => (
            <span key={effect} className={`status-badge text-white text-xs px-2 rounded status-${effect} cursor-help`} onClick={(e) => handleStatusClick(e, effect)}>
              {STATUS_TRANSLATIONS[effect]?.name || effect}
            </span>
        ))}
        {isCurrentlyTrapped && (
          <span className="bg-orange-600 text-white text-[10px] px-2 rounded flex items-center gap-1 animate-pulse">⚓ PRESO</span>
        )}
      </div>

      <div className="text-center mb-4 mt-2">
        {(pokemon?.types || []).map(t => (
          <span key={t} className={`type-tag text-white text-xs font-bold px-2 py-1 rounded-full mx-1 type-${t}`}>
            {TYPE_NAMES_PT[t] ?? t}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[65px_1fr_65px] gap-2 items-center relative">
        <div className="flex flex-col gap-1">
          {renderStat('Atk', 'attack')}
          {renderStat('Def', 'defense')}
          {renderStat('Vel', 'speed')}
        </div>
        <div className="flex justify-center relative h-32 w-32 mx-auto">
          <img 
            key={`${pokemon?.spriteUrl}-${pokemon?.isMega ? 'mega' : 'base'}`} // Force re-render on sprite change or Mega status
            src={pokemon?.spriteUrl ?? ''} 
            alt={pokemon?.name ?? 'Pokémon'} 
            className={`w-32 h-32 object-contain rounded-full bg-white p-1 border-4 ${isPlayer ? 'border-green-400 scale-x-[-1]' : 'border-red-400'} absolute transition-transform duration-300`} 
            onError={(e) => { e.currentTarget.src = pokemon?.fallbackUrls?.[0] || '' }} 
          />
        </div>
        <div className="flex flex-col gap-1">
          {renderStat('SpA', 'spAttack')}
          {renderStat('SpD', 'spDefense')}
        </div>
      </div>

      <div className="mt-4">
        <div className={`flex justify-between text-sm font-medium ${isPlayer ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          <span>PV:</span>
          <span>{pokemon?.hp ?? 0} / {pokemon?.maxHP ?? 0}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
          <div className={`hp-bar-fill ${hpColor} h-3 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${hpPercent}%` }}></div>
        </div>
      </div>

      {/* Indicador de Tipo Tera */}
      {showTeraType && pokemon?.teraType && (
        <div className="mt-2 flex justify-center">
           <span className={`inline-flex items-center gap-1 text-xs font-bold text-white px-3 py-1 rounded-full shadow-sm type-${pokemon?.teraType} border-2 border-white/30`}>
             <span className="text-sm">💎</span> Tipo Tera: {TYPE_NAMES_PT[pokemon?.teraType] ?? pokemon?.teraType}
           </span>
        </div>
      )}
    </div>
  );
};
