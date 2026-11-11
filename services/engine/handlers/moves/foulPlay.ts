
import { Pokemon } from '../../../../types';
import { calculateStat } from '../statCalculator';
import * as NeutralizingGas from '../abilities/neutralizing_gas';

/**
 * Lógica para o movimento Jogo Sujo (Foul Play).
 * Regra Oficial: Utiliza o status de Ataque do ALVO (Defender) para o cálculo de dano,
 * em vez do Ataque do Usuário.
 * 
 * Interações:
 * - Considera os estágios de Ataque do Alvo.
 * - Habilidade Unaware do Usuário ignora os estágios de Ataque do Alvo.
 * - Modificadores do Usuário (Item, Burn, etc) são aplicados posteriormente no damageUtils.
 */
export function getFoulPlayAttack(
    attacker: Pokemon,
    defender: Pokemon,
    weather: string,
    isGasActive: boolean,
    currentTerrain: string
): number {
    // Se o atacante tiver Desatento (Unaware), ignora os estágios de ataque do defensor.
    let ignoreStages = false;
    
    // Verifica Unaware manualmente aqui pois a lógica inversa (Atacante ignorando status ofensivo do Defensor para cálculo próprio)
    // foge do padrão defensivo comum do Unaware.
    if (attacker.ability === 'unaware' && !NeutralizingGas.isAbilitySuppressed(attacker.ability, isGasActive)) {
        ignoreStages = true;
    }

    // Calcula o Ataque usando o objeto do Defensor
    return calculateStat(defender, 'attack', weather, isGasActive, ignoreStages, currentTerrain);
}
