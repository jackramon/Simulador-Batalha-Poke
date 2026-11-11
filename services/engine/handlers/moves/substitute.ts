
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { checkConsumableItems } from '../../../handlers/items';

export function handleSubstitute(
    pokemon: Pokemon, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // 1. Verifica se já existe um substituto
    if (pokemon.statusEffects['substitute']) {
        log(logs, BATTLE_MESSAGES.SUBSTITUTE_ALREADY(pokemon.name), 'text-gray-500 italic');
        return;
    }

    // 2. Calcula custo de HP (25% do Máximo, arredondado para baixo)
    const hpCost = Math.floor(pokemon.maxHP / 4);

    // 3. Verifica se tem HP suficiente
    // Nos jogos, precisa ter MAIS que 1/4 para usar (não pode ficar com 0 exatamente pelo custo)
    if (pokemon.hp <= hpCost) {
        log(logs, BATTLE_MESSAGES.SUBSTITUTE_FAIL_HP(), 'text-gray-500 italic');
        return;
    }

    // 4. Aplica custo
    pokemon.hp -= hpCost;
    
    // 5. Cria o Substituto
    // HP do Substituto é igual ao custo pago.
    pokemon.statusEffects['substitute'] = {
        turns: -1, // Dura até quebrar
        hp: hpCost
    };

    log(logs, BATTLE_MESSAGES.SUBSTITUTE_START(pokemon.name), 'text-green-700 font-bold');

    // 6. Verifica ativação de itens (Berries de cura, etc) após perder HP
    checkConsumableItems(pokemon, logs as any, state);
}
