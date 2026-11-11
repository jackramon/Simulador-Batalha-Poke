
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { calculateStat } from '../statCalculator';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Download.
 * Ao entrar em batalha, o Pokémon compara a Defesa e a Defesa Especial do oponente.
 * - Se Defesa < Defesa Especial: Aumenta o Ataque em 1 estágio.
 * - Se Defesa Especial <= Defesa: Aumenta o Atq. Especial em 1 estágio.
 */
export function handleDownload(
    pokemon: Pokemon, 
    opponent: Pokemon | null, 
    state: BattleState, 
    logs: {message: string, color: string}[]
) {
    if (!opponent || opponent.isFainted) return;

    const isGasActive = NeutralizingGas.isGasActive(state);
    
    // Calcula as defesas efetivas do oponente considerando estágios atuais
    const oppDef = calculateStat(opponent, 'defense', state.weather, isGasActive, false, state.terrain);
    const oppSpDef = calculateStat(opponent, 'spDefense', state.weather, isGasActive, false, state.terrain);

    if (oppDef < oppSpDef) {
        if (pokemon.statStages.attack < 6) {
            pokemon.statStages.attack++;
            log(logs, `O Download de ${pokemon.name} analisou a Defesa de ${opponent.name} e aumentou seu Ataque!`, 'text-indigo-600 font-bold');
        }
    } else {
        if (pokemon.statStages.spAttack < 6) {
            pokemon.statStages.spAttack++;
            log(logs, `O Download de ${pokemon.name} analisou a Defesa Especial de ${opponent.name} e aumentou seu Atq. Especial!`, 'text-indigo-600 font-bold');
        }
    }
}
