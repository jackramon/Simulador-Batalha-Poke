
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as PsychicNoise from './psychicNoise';

const WISH_KEY = 'wish';

/**
 * Lógica para o movimento Desejo (Wish).
 * Regra Oficial: O usuário faz um desejo. No final do PRÓXIMO turno, 
 * o Pokémon que estiver na posição ativa recupera HP igual a 50% do HP Máximo do usuário que usou o golpe.
 */
export function handleWishStart(attacker: Pokemon, logs: LogEntry[]) {
    // Falha se já houver um desejo ativo pendente para este slot
    if (attacker.statusEffects[WISH_KEY]) {
        log(logs, `Mas falhou! Já existe um desejo pendente.`, 'text-gray-500 italic');
        return;
    }

    const healAmount = Math.floor(attacker.maxHP / 2) || 1;

    // Turnos: 2. 
    // Final do Turno 1 (Uso): Decrementa para 1.
    // Final do Turno 2 (Próximo): Decrementa para 0 -> Cura.
    attacker.statusEffects[WISH_KEY] = {
        turns: 2,
        hp: healAmount // Armazena a quantidade de cura baseada no usuário original
    };

    log(logs, `${attacker.name} fez um desejo!`, 'text-blue-500 font-bold italic');
}

/**
 * Processa o efeito do Desejo no final do turno.
 */
export function handleWishEnd(pokemon: Pokemon, logs: LogEntry[]) {
    if (!pokemon.statusEffects[WISH_KEY] || pokemon.isFainted) return;

    pokemon.statusEffects[WISH_KEY].turns--;

    if (pokemon.statusEffects[WISH_KEY].turns <= 0) {
        const healAmount = pokemon.statusEffects[WISH_KEY].hp || 0;
        
        // Remove o status antes de aplicar a cura
        delete pokemon.statusEffects[WISH_KEY];

        // Verifica Bloqueio de Cura (Heal Block)
        if (PsychicNoise.isHealBlocked(pokemon)) {
            log(logs, `O desejo de ${pokemon.name} se tornou realidade, mas o Bloqueio de Cura impediu a recuperação!`, 'text-gray-500 italic');
            return;
        }

        if (pokemon.hp < pokemon.maxHP) {
            pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
            log(logs, `O desejo de ${pokemon.name} se tornou realidade! (+${healAmount} PV)`, 'text-green-600 font-black animate-pulse');
        } else {
            log(logs, `O desejo de ${pokemon.name} se tornou realidade, mas seu HP já estava cheio.`, 'text-gray-500 italic');
        }
    }
}
