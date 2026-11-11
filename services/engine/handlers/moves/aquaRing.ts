
import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as Klutz from '../abilities/klutz';
import * as PsychicNoise from './psychicNoise';

export function handleAquaRing(attacker: Pokemon, logs: LogEntry[]) {
    if (attacker.statusEffects['aqua-ring']) {
        log(logs, `Mas falhou! ${attacker.name} já está protegido pelo anel de água.`, 'text-gray-500 italic');
        return;
    }

    attacker.statusEffects['aqua-ring'] = { turns: -1 };
    log(logs, `${attacker.name} se envolveu em um anel de água!`, 'text-blue-500 font-bold');
}

export function handleAquaRingTurnEnd(pokemon: Pokemon, logs: LogEntry[], state?: BattleState) {
    if (!pokemon.statusEffects['aqua-ring'] || pokemon.isFainted || pokemon.hp >= pokemon.maxHP) return;

    if (PsychicNoise.isHealBlocked(pokemon)) {
        return;
    }

    let healAmount = Math.floor(pokemon.maxHP / 16) || 1;

    // Big Root interaction
    if (pokemon.heldItem === 'big-root' && !Klutz.isItemSuppressed(pokemon, state)) {
        healAmount = Math.floor(healAmount * 1.3);
    }

    pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
    log(logs, `${pokemon.name} recuperou um pouco de vida com o Anel d'Água!`, 'text-blue-500 italic text-xs');
}
