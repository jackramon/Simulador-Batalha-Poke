
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as SuctionCups from '../abilities/suction_cups';
import * as GuardDog from '../abilities/guard_dog';
import { performSwitch } from '../../switching';

/**
 * Lógica para o item Cartão Vermelho (Red Card).
 * Efeito: Se o portador for atingido por um ataque que cause dano, 
 * o atacante é removido da batalha e um Pokémon aleatório é arrastado para fora.
 * O item é consumido após o uso.
 */
export function checkRedCard(
    holder: Pokemon, 
    attacker: Pokemon, 
    state: BattleState, 
    logs: {message: string, color: string}[]
) {
    // 1. Verificações Básicas de Ativação
    // - Item deve ser Red Card
    // - Portador deve ter sobrevivido ao ataque (Regra Gen 5+)
    // - Atacante deve estar vivo
    if (holder.heldItem !== 'red-card' || holder.isFainted || attacker.isFainted) {
        return;
    }

    // 2. Verifica Imunidade a Troca Forçada (Ventosas / Suction Cups)
    // O atacante é quem seria forçado a trocar, então verificamos a habilidade dele.
    if (SuctionCups.isImmuneToForcedSwitch(attacker, holder.ability, state, logs)) {
        return;
    }

    // 2.5 Verifica Imunidade a Troca Forçada (Cão de Guarda / Guard Dog)
    if (GuardDog.isImmuneToForcedSwitch(attacker, holder.ability, state, logs)) {
        return;
    }

    // 3. Identifica o time do atacante e verifica se há reservas
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const attackerTeam = isP1 ? state.team1 : state.team2;

    // Busca candidatos válidos na reserva (Não desmaiados e não o próprio atacante)
    const validBackups = attackerTeam.filter(p => !p.isFainted && p.id !== attacker.id);

    // Se não houver ninguém para trocar, o item não ativa
    if (validBackups.length === 0) {
        return;
    }

    // --- ATIVAÇÃO ---

    // 4. Consome o Item
    const itemName = 'Cartão Vermelho';
    holder.heldItem = null;
    holder.consumedItem = 'red-card';
    
    log(logs, `O ${itemName} de ${holder.name} foi ativado!`, 'text-red-600 font-bold');

    // 5. Seleciona aleatoriamente um Pokémon da reserva do atacante
    const newPokemon = validBackups[Math.floor(Math.random() * validBackups.length)];

    // 6. Usa a transição canônica para saída, hazards, entrada e clima.
    log(logs, `${attacker.name} foi expulso da batalha!`, 'text-orange-600 font-bold');
    log(logs, `${newPokemon.name} foi arrastado para o campo!`, 'text-orange-600 font-bold');
    const result = performSwitch(state, newPokemon, isP1 ? 1 : 2, true);
    Object.assign(state, result.newState);
    logs.push(...result.logs);
}
