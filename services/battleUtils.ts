
import { Pokemon, Move, StatStages, BattleState } from '../types';
import { 
    NON_CONTACT_PHYSICAL_MOVES, 
    CONTACT_SPECIAL_MOVES
} from '../data/moves';
import { TRANSLATION_REGEX } from '../data/general';
import * as StatCalculator from './engine/handlers/statCalculator';
import * as Trapping from './engine/handlers/abilities/trapping';
import * as DamageUtils from './engine/handlers/damageUtils';
import { calculateTypeEffectiveness } from './engine/mechanics/effectiveness';

// Re-exports from modularized mechanics
export * from './engine/mechanics/effectiveness';
export * from './engine/mechanics/accuracy';

export function getStatStageMultiplier(stage: number): number {
  return StatCalculator.getStatStageMultiplier(stage);
}

export function getAccuracyStageMultiplier(stage: number): number {
  return StatCalculator.getAccuracyStageMultiplier(stage);
}

export function getRawStat(
    pokemon: Pokemon, 
    statType: keyof StatStages, 
    weather: string, 
    terrain: string = 'none',
    isTailwindActive: boolean = false,
    opponentAbility?: string
): number {
  let val = StatCalculator.calculateStat(pokemon, statType, weather, false, false, terrain, isTailwindActive, false, opponentAbility);
  
  return val;
}

export function getEffectiveSpeed(
    pokemon: Pokemon, 
    weather: string,
    isTailwindActive: boolean = false
): number {
  // Speed calculation with terrain and tailwind
  return StatCalculator.calculateStat(pokemon, 'speed', weather, false, false, 'none', isTailwindActive);
}

export function isContactMove(move: Move): boolean {
  return (move.damageClass === 'physical' && !NON_CONTACT_PHYSICAL_MOVES.includes(move.name)) ||
         CONTACT_SPECIAL_MOVES.includes(move.name);
}

export const isTrapped = Trapping.isTrapped;

export function translateMoveDescription(text: string): string {
  if (!text) return "Sem descrição.";
  let t = text;
  TRANSLATION_REGEX.forEach((item: { p: RegExp; r: string }) => {
      t = t.replace(item.p, item.r);
  });
  return t; 
}

export function calculateDamageRange(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    weather: string, 
    terrain: string = 'none'
): { min: number, max: number } {
    if (move.damageClass === 'status') return { min: 0, max: 0 };

    // Injeta estado Terastal no cálculo de efetividade para suportar Tera Starstorm
    const defenderStatus = { ...defender.statusEffects, isTerastallized: defender.isTerastallized };
    const eff = calculateTypeEffectiveness(move.type, defender.types, defender.ability, attacker.ability, move.name, defenderStatus);
    
    // Mock state context for minimal environment awareness
    const mockState: Partial<BattleState> = {
        weather: weather as any,
        terrain: terrain as any,
        currentPokemon1: attacker,
        currentPokemon2: defender,
        team1: [attacker],
        team2: [defender],
        p1Hazards: {} as any,
        p2Hazards: {} as any,
    };

    const min = DamageUtils.calculateDamage(
        attacker, defender, move, weather, false, eff.multiplier, 0, [], mockState as BattleState, 85
    );

    const max = DamageUtils.calculateDamage(
        attacker, defender, move, weather, false, eff.multiplier, 0, [], mockState as BattleState, 100
    );

    return { min, max };
}
