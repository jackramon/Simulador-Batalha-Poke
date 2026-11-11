
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as LiquidOoze from '../abilities/liquid_ooze';

/**
 * Processa o efeito de drenagem da Semente Sanguessuga (Leech Seed) ao fim do turno.
 * Regra: O Pokémon infectado perde 1/8 do HP máximo e o oponente recupera a mesma quantia.
 */
export function handleLeechSeed(
    pokemon: Pokemon, 
    opponent: Pokemon | null, 
    logs: { message: string, color: string }[]
): void {
    if (!pokemon.statusEffects['leech-seed'] || pokemon.isFainted) {
        return;
    }

    const damage = Math.floor(pokemon.maxHP / 8) || 1;

    // Magic Guard impede o dano indireto da semente
    if (pokemon.ability !== 'magic-guard') {
        const actualDamage = Math.min(pokemon.hp, damage);
        pokemon.hp = Math.max(0, pokemon.hp - damage);
        log(logs, `${pokemon.name} perdeu vida pela semente! (-${actualDamage})`, 'text-red-500');
        
        // Se o Pokémon drenado desmaiar
        if (pokemon.hp === 0) {
            pokemon.isFainted = true;
        }

        // O oponente recupera a vida drenada
        if (opponent && !opponent.isFainted) {
            if (pokemon.ability === 'liquid-ooze') {
                LiquidOoze.handleLiquidOozeDamage(opponent, pokemon, actualDamage, logs);
            } else {
                const oldHp = opponent.hp;
                opponent.hp = Math.min(opponent.maxHP, opponent.hp + actualDamage);
                const healed = opponent.hp - oldHp;
                
                if (healed > 0) {
                    log(logs, `${opponent.name} recuperou vida pela semente! (+${healed})`, 'text-green-600');
                }
            }
        }
    } else {
        log(logs, `${pokemon.name} protegeu-se do dano da semente com seu Guarda Mágica!`, 'text-gray-500 italic text-xs');
    }
}
