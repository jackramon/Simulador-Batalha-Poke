
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Olhar Malévolo (Mean Look), Bloqueio (Block) e Teia de Aranha (Spider Web).
 * Categoria: Status.
 * Efeito: Impede o alvo de fugir ou trocar de lugar enquanto o usuário estiver em campo.
 * Regra Gen 6+: Pokémon do tipo Fantasma não podem ser presos.
 * Falha se o alvo já estiver preso.
 */
export function handleMeanLook(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    moveName: string = 'mean-look'
) {
    if (defender.isFainted) return;

    // Regra: Tipos Fantasma são imunes a aprisionamento (Trap)
    if (defender.types.includes('ghost')) {
        log(logs, `Não afeta Pokémon do tipo Fantasma!`, 'text-gray-500 italic');
        return;
    }

    // Regra: Não pode prender se já estiver preso (pelo status genérico 'cant-escape')
    // Nota: 'cant-escape' também é usado por Thousand Waves, Anchor Shot, Spirit Shackle, Block, Spider Web
    if (defender.statusEffects['cant-escape']) {
        log(logs, `Mas falhou! ${defender.name} já está aprisionado!`, 'text-gray-500 italic');
        return;
    }

    // Aplica o status de aprisionamento
    // A duração é -1, significando "enquanto o usuário estiver em campo".
    defender.statusEffects['cant-escape'] = { 
        turns: -1,
        sourceMoveName: moveName 
    };

    log(logs, BATTLE_MESSAGES.TRAPPED(defender.name), 'text-purple-600 font-bold italic');
}
