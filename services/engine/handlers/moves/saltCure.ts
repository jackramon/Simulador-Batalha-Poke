
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

export function applySaltCure(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
    // Se o alvo já tiver o efeito, não faz nada (ou renova, mas sem stack)
    if (defender.statusEffects['salt-cure']) {
        return;
    }
    
    // Aplica o status volátil 'salt-cure'
    // Duração infinita (-1) até que o Pokémon saia de campo
    defender.statusEffects['salt-cure'] = { turns: -1 };
    
    log(logs, `${defender.name} está sendo curado com sal!`, 'text-orange-600 font-bold italic');
}

export function handleSaltCureDamage(pokemon: Pokemon, logs: LogEntry[]) {
    if (!pokemon.statusEffects['salt-cure'] || pokemon.isFainted) return;

    if (pokemon.ability === 'magic-guard') {
        // Magic Guard protege contra danos indiretos
        return;
    }

    // Dano base: 1/8 do HP máximo (12.5%)
    // Se for tipo Água ou Aço: 1/4 do HP máximo (25%)
    const isWaterOrSteel = pokemon.types.includes('water') || pokemon.types.includes('steel');
    const fraction = isWaterOrSteel ? 4 : 8;
    
    const damage = Math.floor(pokemon.maxHP / fraction) || 1;
    pokemon.hp = Math.max(0, pokemon.hp - damage);

    log(logs, `${pokemon.name} foi ferido pela Cura de Sal! (-${damage})`, 'text-red-500 italic text-xs');

    if (pokemon.hp === 0) {
        pokemon.isFainted = true;
        log(logs, BATTLE_MESSAGES.FAINTED(pokemon.name), 'text-red-900 font-bold');
    }
}
