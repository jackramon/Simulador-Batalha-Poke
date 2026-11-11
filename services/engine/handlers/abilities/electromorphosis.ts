
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Eletromorfose (Electromorphosis).
 * Quando atingido por um ataque, o Pokémon torna-se "Carregado" (Charged).
 */
export function triggerElectromorphosis(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'electromorphosis' || pokemon.isFainted) return;

    if (!pokemon.statusEffects['charged']) {
        pokemon.statusEffects['charged'] = { turns: -1 }; // Dura até o próximo uso de golpe elétrico
        log(logs, `${pokemon.name} se carregou de eletricidade com sua Eletromorfose!`, 'text-yellow-500 font-bold');
    }
}

/**
 * Verifica se o Pokémon está carregado e aplica o bônus de 2x se o movimento for elétrico.
 * Consome o estado após o uso.
 */
export function getChargedMultiplier(pokemon: Pokemon, moveType: string): number {
    if (pokemon.statusEffects['charged'] && moveType === 'electric') {
        // O efeito é consumido no damageModifiers.ts após o cálculo
        return 2;
    }
    return 1;
}

export function consumeChargedEffect(pokemon: Pokemon, moveType: string) {
    if (moveType === 'electric' && pokemon.statusEffects['charged']) {
        delete pokemon.statusEffects['charged'];
    }
}
