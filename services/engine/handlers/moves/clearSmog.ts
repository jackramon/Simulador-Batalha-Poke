
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Névoa Limpa (Clear Smog).
 * Regra Oficial: Se o golpe acertar (causar dano), todas as mudanças de estágios 
 * de atributos do alvo são resetadas para 0.
 * Nota: Não afeta alvos imunes (ex: Tipo Aço) pois o efeito secundário só ocorre após o dano.
 */
export function handleClearSmog(defender: Pokemon, logs: {message: string, color: string}[]) {
    if (defender.isFainted) return;

    // Reseta todos os estágios para 0
    defender.statStages = {
        accuracy: 0,
        evasion: 0,
        attack: 0,
        defense: 0,
        spAttack: 0,
        spDefense: 0,
        speed: 0
    };

    log(logs, BATTLE_MESSAGES.STATS_RESET(defender.name), 'text-blue-500 font-bold italic');
}
