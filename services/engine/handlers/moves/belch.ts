
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Arroto (Belch).
 * Regra Oficial: O usuário deve ter consumido uma Fruta (Berry) durante a batalha para usar este movimento.
 * Se não tiver consumido, o movimento falha.
 * O consumo pode ser via uso natural (HP baixo), Fling, Bug Bite, etc.
 * Consumir itens que não sejam Berry não conta.
 */
export function checkFailure(attacker: Pokemon, logs: {message: string, color: string}[]): boolean {
    const consumed = attacker.consumedItem;

    // Verifica se algum item foi consumido e se é uma Berry (termina com '-berry')
    if (!consumed || !consumed.endsWith('-berry')) {
        log(logs, BATTLE_MESSAGES.BELCH_FAIL(), 'text-gray-500 italic');
        return true; // Falhou
    }

    return false; // Sucesso (pode executar)
}
