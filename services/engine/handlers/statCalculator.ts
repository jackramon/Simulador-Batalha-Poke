
import { Pokemon, StatStages } from '../../../types';
import { NATURES } from '../../../data/natures';
import * as SandRush from './abilities/sand_rush';
import * as MarvelScale from './abilities/marvel_scale';
import * as NeutralizingGas from './abilities/neutralizing_gas';
import * as Klutz from './abilities/klutz';
import * as SlowStart from './abilities/slow_start';
import * as QuickFeet from './abilities/quick_feet';
import * as SolarPower from './abilities/solar_power';
import * as FlowerGift from './abilities/flower_gift';
import * as Unburden from './abilities/unburden';
import * as OrichalcumPulse from './abilities/orichalcum_pulse';
import * as HadronEngine from './abilities/hadron_engine';
import * as SwiftSwim from './abilities/swift_swim';
import * as SurgeSurfer from './abilities/surge_surfer';

export function getStatStageMultiplier(stage: number): number {
  stage = Math.max(-6, Math.min(6, stage));
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 + Math.abs(stage));
}

export function getAccuracyStageMultiplier(stage: number): number {
  stage = Math.max(-6, Math.min(6, stage));
  if (stage >= 0) return (3 + stage) / 3;
  return 3 / (3 + Math.abs(stage));
}

export function calculateStat(
    pokemon: Pokemon, 
    statType: keyof StatStages, 
    weather: string, 
    isGasActive: boolean = false,
    ignoreStages: boolean = false,
    terrain: string = 'none',
    isTailwindActive: boolean = false,
    isWonderRoom: boolean = false, // Novo parâmetro para Sala Maravilhosa
    opponentAbility?: string
): number {
  if (!pokemon || pokemon.isFainted) return 0;
  
  let baseStat = 0;
  let stage = 0;
  
  // Valores Base padrão (Retrocompatibilidade)
  const iv = pokemon.ivs ? pokemon.ivs[statType === 'spAttack' ? 'spAttack' : statType === 'spDefense' ? 'spDefense' : statType] : 31;
  const ev = pokemon.evs ? pokemon.evs[statType === 'spAttack' ? 'spAttack' : statType === 'spDefense' ? 'spDefense' : statType] : 85;
  const level = pokemon.level || 50;

  if (statType === 'accuracy') {
      return getAccuracyStageMultiplier(ignoreStages ? 0 : pokemon.statStages.accuracy);
  }
  if (statType === 'evasion') {
      return getAccuracyStageMultiplier(ignoreStages ? 0 : pokemon.statStages.evasion);
  }
  
  switch(statType) {
    case 'attack': baseStat = pokemon.attackStat; stage = ignoreStages ? 0 : pokemon.statStages.attack; break;
    case 'defense': 
        // Wonder Room swap: Usa SpDef Base se ativo
        baseStat = isWonderRoom ? pokemon.spDefenseStat : pokemon.defenseStat; 
        stage = ignoreStages ? 0 : pokemon.statStages.defense; 
        break;
    case 'spAttack': baseStat = pokemon.spAttackStat; stage = ignoreStages ? 0 : pokemon.statStages.spAttack; break;
    case 'spDefense': 
        // Wonder Room swap: Usa Def Base se ativo
        baseStat = isWonderRoom ? pokemon.defenseStat : pokemon.spDefenseStat; 
        stage = ignoreStages ? 0 : pokemon.statStages.spDefense; 
        break;
    case 'speed': baseStat = pokemon.speedStat; stage = ignoreStages ? 0 : pokemon.statStages.speed; break;
    default: return 0;
  }

  let val = 0;

  // Cálculo do Core Stat
  const core = Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100);
  
  val = core + 5;

  // Aplica Natureza
  if (pokemon.nature) {
      const natureData = NATURES[pokemon.nature];
      if (natureData) {
          if (natureData.plus === statType) val = Math.floor(val * 1.1);
          if (natureData.minus === statType) val = Math.floor(val * 0.9);
      }
  }

  // Aplica Estágios (Buffs/Debuffs)
  val = Math.floor(val * getStatStageMultiplier(stage));
  
  // Modificadores de Campo
  if (statType === 'spDefense' && weather === 'sand' && pokemon.types.includes('rock')) {
    val = Math.floor(val * 1.5);
  }

  // Modificador de Neve (Snow/Hail) para Defesa de tipos Gelo (Gen 9)
  if (statType === 'defense' && weather === 'hail' && pokemon.types.includes('ice')) {
    val = Math.floor(val * 1.5);
  }

  // Aplica Tailwind (Vento de Cauda) - Dobra Velocidade
  if (statType === 'speed' && isTailwindActive) {
      val = Math.floor(val * 2);
  }

  const suppressed = NeutralizingGas.isAbilitySuppressed(pokemon.ability, isGasActive);
  const itemsSuppressed = Klutz.isItemSuppressed(pokemon); 

  if (!suppressed) {
      if (pokemon.ability === 'protosynthesis' || pokemon.ability === 'quark-drive') {
          // Simplificação para performance (lógica completa exigiria checagem recursiva)
      }
      
      if (statType === 'speed') {
        if (pokemon.heldItem === 'choice-scarf' && !itemsSuppressed) val = Math.floor(val * 1.5);
        if (pokemon.ability === 'chlorophyll' && weather === 'sun') val *= 2;
        
        val = Math.floor(val * SwiftSwim.getSpeedMultiplier(pokemon, weather));
        val = Math.floor(val * SandRush.getSpeedMultiplier(pokemon, weather));
        val = Math.floor(val * SurgeSurfer.getSpeedMultiplier(pokemon, terrain));
        
        if (pokemon.ability === 'slush-rush' && weather === 'hail') val *= 2;
        
        val = Math.floor(val * QuickFeet.getSpeedMultiplier(pokemon, isGasActive));

        if (Unburden.isUnburdenActive(pokemon, isGasActive)) {
            val *= 2;
        }
      }

      if (statType === 'attack') {
        if (pokemon.heldItem === 'choice-band' && !itemsSuppressed) val = Math.floor(val * 1.5);
        if (pokemon.ability === 'huge-power' || pokemon.ability === 'pure-power') val *= 2;
        if (pokemon.ability === 'hustle') val = Math.floor(val * 1.5);
        
        const hasMajorStatus = Object.keys(pokemon.statusEffects).some(s => 
            ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'].includes(s)
        );
        if (pokemon.ability === 'guts' && hasMajorStatus) val = Math.floor(val * 1.5);
        if (pokemon.ability === 'defeatist' && pokemon.hp <= pokemon.maxHP / 2) val = Math.floor(val * 0.5);

        val = Math.floor(val * FlowerGift.getStatMultiplier(pokemon, 'attack', weather));
        val = Math.floor(val * OrichalcumPulse.getAttackMultiplier(pokemon, weather));
      }

      if (statType === 'attack' || statType === 'speed') {
        val = Math.floor(val * SlowStart.getStatMultiplier(pokemon, statType));
      }

      if (statType === 'spAttack') {
        if (pokemon.heldItem === 'choice-specs' && !itemsSuppressed) val = Math.floor(val * 1.5);
        if (pokemon.ability === 'defeatist' && pokemon.hp <= pokemon.maxHP / 2) val = Math.floor(val * 0.5);
        val = Math.floor(val * SolarPower.getSpAttackMultiplier(pokemon, weather));
        val = Math.floor(val * HadronEngine.getSpAttackMultiplier(pokemon, terrain));
      }

      if (statType === 'spDefense') {
          val = Math.floor(val * FlowerGift.getStatMultiplier(pokemon, 'spDefense', weather));
      }

      if (statType === 'defense') {
          val = Math.floor(val * MarvelScale.getDefenseMultiplier(pokemon));
      }
  } else {
      if (statType === 'speed' && pokemon.heldItem === 'choice-scarf') val = Math.floor(val * 1.5);
      if (statType === 'attack' && pokemon.heldItem === 'choice-band') val = Math.floor(val * 1.5);
      if (statType === 'spAttack' && pokemon.heldItem === 'choice-specs') val = Math.floor(val * 1.5);
  }

  if (statType === 'speed' && pokemon.statusEffects.paralysis && !QuickFeet.ignoresParalysisPenalty(pokemon, isGasActive)) {
      val = Math.floor(val * 0.5);
  }
  
  if (statType === 'speed' && pokemon.heldItem === 'iron-ball' && !itemsSuppressed) val = Math.floor(val * 0.5);

  if (opponentAbility) {
      if (statType === 'attack' && opponentAbility === 'tablets-of-ruin' && pokemon.ability !== 'tablets-of-ruin') {
          val = Math.floor(val * 0.75);
      } else if (statType === 'defense' && opponentAbility === 'sword-of-ruin' && pokemon.ability !== 'sword-of-ruin') {
          val = Math.floor(val * 0.75);
      } else if (statType === 'spAttack' && opponentAbility === 'vessel-of-ruin' && pokemon.ability !== 'vessel-of-ruin') {
          val = Math.floor(val * 0.75);
      } else if (statType === 'spDefense' && opponentAbility === 'beads-of-ruin' && pokemon.ability !== 'beads-of-ruin') {
          val = Math.floor(val * 0.75);
      }
  }

  return val;
}

// Helper para calcular HP Máximo (usado na inicialização)
export function calculateMaxHP(base: number, iv: number, ev: number, level: number): number {
    if (base === 1) return 1; // Shedinja case
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}
