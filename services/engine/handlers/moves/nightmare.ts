
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Comatose from '../abilities/comatose';

const NIGHTMARE_KEY = 'nightmare';

/**
 * Lógica para o movimento Pesadelo (Nightmare).
 * Regra Oficial: 
 * 1. O alvo deve estar dormindo (Status Sleep ou habilidade Comatose).
 * 2. O alvo recebe o status volátil Nightmare.
 * 3. O alvo perde 1/4 do HP máximo ao final de cada turno.
 * 4. Se o alvo acordar, o status Nightmare é removido.
 */
export function handleNightmare(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
    if (defender.isFainted) return;

    // Verifica se está dormindo (ou tratado como dormindo por Comatose)
    const isAsleep = !!defender.statusEffects.sleep || Comatose.isTreatedAsAsleep(defender);

    if (!isAsleep) {
        log(logs, `Mas falhou! ${defender.name} não está dormindo.`, 'text-gray-500 italic');
        return;
    }

    if (defender.statusEffects[NIGHTMARE_KEY]) {
        log(logs, `Mas falhou! ${defender.name} já está tendo um pesadelo.`, 'text-gray-500 italic');
        return;
    }

    defender.statusEffects[NIGHTMARE_KEY] = { turns: -1 };
    log(logs, `${defender.name} começou a ter um pesadelo!`, 'text-purple-800 font-bold italic');
}

/**
 * Processa o dano de Pesadelo no final do turno.
 * Verifica também se o Pokémon acordou para remover o status.
 */
export function handleNightmareTurnEnd(pokemon: Pokemon, logs: LogEntry[]) {
    if (!pokemon.statusEffects[NIGHTMARE_KEY] || pokemon.isFainted) return;

    // Verifica se ainda está dormindo
    const isAsleep = !!pokemon.statusEffects.sleep || Comatose.isTreatedAsAsleep(pokemon);

    if (!isAsleep) {
        delete pokemon.statusEffects[NIGHTMARE_KEY];
        log(logs, `${pokemon.name} acordou do pesadelo!`, 'text-blue-500 font-bold');
        return;
    }

    // Dano de 1/4 do HP Máximo
    // Guarda Mágica (Magic Guard) protege contra dano residual
    if (pokemon.ability !== 'magic-guard') {
        const damage = Math.floor(pokemon.maxHP / 4) || 1;
        pokemon.hp = Math.max(0, pokemon.hp - damage);
        log(logs, `${pokemon.name} está preso em um pesadelo! (-${damage})`, 'text-purple-800 font-bold');

        if (pokemon.hp === 0) {
            pokemon.isFainted = true;
            log(logs, BATTLE_MESSAGES.FAINTED(pokemon.name), 'text-red-900 font-bold');
        }
    }
}
