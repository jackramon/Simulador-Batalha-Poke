
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Mil Ondas (Thousand Waves).
 * Regra Oficial: Causa dano e impede o alvo de fugir ou trocar enquanto o usuário estiver em campo.
 * O efeito funciona de forma idêntica ao Tiro de Âncora (Anchor Shot) e Algema Espectral (Spirit Shackle).
 * Tipos Fantasma são imunes a este efeito de aprisionamento.
 */
export function handleTrapping(
    defender: Pokemon, 
    logs: {message: string, color: string}[]
) {
    if (defender.isFainted) return;

    // Tipos Fantasma são imunes a aprisionamento (Regra Geral Gen 6+)
    if (defender.types.includes('ghost')) {
        return;
    }

    // Aplica o status de não escapar
    // 'cant-escape' é verificado em abilities/trapping.ts
    // A duração é -1 (enquanto o usuário estiver em campo ou alvo for nocauteado)
    if (!defender.statusEffects['cant-escape']) {
        defender.statusEffects['cant-escape'] = { turns: -1 };
        log(logs, BATTLE_MESSAGES.TRAPPED(defender.name), 'text-purple-600 font-bold italic');
    }
}
