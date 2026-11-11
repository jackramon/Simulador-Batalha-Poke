
import { StatStages } from '../types';

export interface Nature {
  name: string;
  plus?: keyof StatStages;
  minus?: keyof StatStages;
}

export const NATURES: Record<string, Nature> = {
  'hardy': { name: 'Arrojada (Neutro)' },
  'lonely': { name: 'Solitária (+Atk, -Def)', plus: 'attack', minus: 'defense' },
  'brave': { name: 'Brava (+Atk, -Spe)', plus: 'attack', minus: 'speed' },
  'adamant': { name: 'Rígida (+Atk, -SpA)', plus: 'attack', minus: 'spAttack' },
  'naughty': { name: 'Travessa (+Atk, -SpD)', plus: 'attack', minus: 'spDefense' },
  'bold': { name: 'Ousada (+Def, -Atk)', plus: 'defense', minus: 'attack' },
  'docile': { name: 'Dócil (Neutro)' },
  'relaxed': { name: 'Plácida (+Def, -Spe)', plus: 'defense', minus: 'speed' },
  'impish': { name: 'Levada (+Def, -SpA)', plus: 'defense', minus: 'spAttack' },
  'lax': { name: 'Desleixada (+Def, -SpD)', plus: 'defense', minus: 'spDefense' },
  'timid': { name: 'Tímida (+Spe, -Atk)', plus: 'speed', minus: 'attack' },
  'hasty': { name: 'Afobada (+Spe, -Def)', plus: 'speed', minus: 'defense' },
  'serious': { name: 'Séria (Neutro)' },
  'jolly': { name: 'Alegre (+Spe, -SpA)', plus: 'speed', minus: 'spAttack' },
  'naive': { name: 'Ingênua (+Spe, -SpD)', plus: 'speed', minus: 'spDefense' },
  'modest': { name: 'Modesta (+SpA, -Atk)', plus: 'spAttack', minus: 'attack' },
  'mild': { name: 'Mansa (+SpA, -Def)', plus: 'spAttack', minus: 'defense' },
  'quiet': { name: 'Quieta (+SpA, -Spe)', plus: 'spAttack', minus: 'speed' },
  'bashful': { name: 'Acanhada (Neutro)' },
  'rash': { name: 'Ardente (+SpA, -SpD)', plus: 'spAttack', minus: 'spDefense' },
  'calm': { name: 'Calma (+SpD, -Atk)', plus: 'spDefense', minus: 'attack' },
  'gentle': { name: 'Gentil (+SpD, -Def)', plus: 'spDefense', minus: 'defense' },
  'sassy': { name: 'Grossa (+SpD, -Spe)', plus: 'spDefense', minus: 'speed' },
  'careful': { name: 'Cautelosa (+SpD, -SpA)', plus: 'spDefense', minus: 'spAttack' },
  'quirky': { name: 'Excêntrica (Neutro)' },
};
