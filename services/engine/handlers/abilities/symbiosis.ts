
import { Pokemon, BattleState } from '../../../../types';
import { ITEMS_DATA } from '../../../../data/items';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Simbiose (Symbiosis).
 * Regra Oficial: Passa o item segurado para um aliado que consumiu o seu próprio item.
 * Adaptação 1v1: Se o Pokémon ativo consumir um item, um aliado saudável na reserva 
 * com Simbiose passa o seu item para o ativo.
 */
export function handleSymbiosis(pokemon: Pokemon, logs: {message: string, color: string}[], state?: BattleState): boolean {
    if (!state || pokemon.isFainted || pokemon.heldItem) {
        return false;
    }

    const isGasActive = NeutralizingGas.isGasActive(state);

    // Identifica a equipe do Pokémon que consumiu o item
    const isP1 = state.team1.some(p => p.id === pokemon.id);
    const team = isP1 ? state.team1 : state.team2;

    // Procura por um aliado na equipe que:
    // 1. Não seja o próprio pokemon ativo.
    // 2. Não esteja desmaiado.
    // 3. Tenha a habilidade Simbiose não suprimida.
    // 4. Possua um item para dar.
    const donor = team.find(p => {
        return p.id !== pokemon.id && 
               !p.isFainted && 
               p.ability === 'symbiosis' && 
               p.heldItem !== null &&
               !NeutralizingGas.isAbilitySuppressed(p.ability, isGasActive);
    });

    if (donor && donor.heldItem) {
        const itemKey = donor.heldItem;
        const itemName = ITEMS_DATA[itemKey]?.name || itemKey;

        // Transferência de item
        pokemon.heldItem = itemKey;
        donor.heldItem = null;
        donor.hadItem = true; // Marca que o doador perdeu o item

        log(logs, `${donor.name} passou seu item ${itemName} para ${pokemon.name} através da Simbiose!`, 'text-indigo-600 font-bold italic');
        return true;
    }

    return false;
}
