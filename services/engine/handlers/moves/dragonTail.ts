
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as SuctionCups from '../abilities/suction_cups';
import * as GuardDog from '../abilities/guard_dog';
import * as EntryAbilities from '../abilities/entry';
import * as NaturalCure from '../abilities/natural_cure';
import * as SheerForce from '../abilities/sheer_force';
import * as Ingrain from './ingrain';

/**
 * Lógica para Cauda do Dragão (Dragon Tail) e Arremesso Circular (Circle Throw).
 * Causa dano e força o oponente a trocar de Pokémon por um aleatório da reserva.
 */
export function handleForceSwitch(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    moveName: string,
    state?: BattleState
) {
    if (!state) return;

    // 1. Verifica Sheer Force (Anula o efeito secundário)
    // Nota: Como Dragon Tail aplica dano, Sheer Force remove a troca forçada
    const moveMock: any = { name: moveName, effect: { status: 'force-switch' }, damageClass: 'physical' };
    if (SheerForce.shouldBlockSecondaryEffects(attacker, moveMock)) {
        return;
    }

    // 2. Verifica Imunidade (Ventosas)
    if (SuctionCups.isImmuneToForcedSwitch(defender, attacker.ability, state, logs)) {
        return;
    }

    // 2.5 Verifica Imunidade (Cão de Guarda)
    if (GuardDog.isImmuneToForcedSwitch(defender, attacker.ability, state, logs)) {
        return;
    }

    // 3. Verifica Imunidade (Enraizar/Ingrain)
    if (Ingrain.isImmuneToForcedSwitch(defender)) {
        log(logs, `${defender.name} está enraizado e não pode ser trocado à força!`, 'text-gray-500 italic');
        return;
    }

    // 4. Identifica o time do defensor
    const isP1 = state.currentPokemon1?.id === defender.id;
    const defenderTeam = isP1 ? state.team1 : state.team2;

    // 5. Busca candidatos válidos na reserva (Não desmaiados e não o próprio)
    const validBackups = defenderTeam.filter(p => !p.isFainted && p.id !== defender.id);

    if (validBackups.length === 0) {
        log(logs, `Mas falhou! Não há outro Pokémon para trocar!`, 'text-gray-500 italic');
        return;
    }

    // 6. Seleciona aleatoriamente
    const newPokemon = validBackups[Math.floor(Math.random() * validBackups.length)];

    // 7. Executa a lógica de saída do Pokémon atual (Similar ao switching.ts)
    // Reset de atributos e status voláteis
    defender.statStages = { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    defender.isFlinched = false;
    defender.turnsActive = 0;
    defender.chargingMove = null;
    defender.mustRecharge = false;
    defender.lockedMove = null;
    defender.movesUsed = [];

    // Limpa status voláteis (mantém principais)
    const persistentEffects = ['burn', 'poison', 'toxic', 'paralysis', 'sleep', 'freeze', 'disguise-busted', 'zero-to-hero-activated', 'zero-to-hero-transformed'];
    Object.keys(defender.statusEffects).forEach(status => {
        if (!persistentEffects.includes(status)) {
            delete defender.statusEffects[status];
        }
    });

    if (defender.statusEffects.toxic) {
        defender.statusEffects.toxic.turns = 0;
    }

    // Habilidades de saída
    NaturalCure.handleNaturalCure(defender, logs as any);
    if (defender.ability === 'regenerator' && !defender.isFainted) {
        const heal = Math.floor(defender.maxHP / 3);
        defender.hp = Math.min(defender.maxHP, defender.hp + heal);
        log(logs, `${defender.name} recuperou vida ao sair (Regenerador)!`, 'text-green-500');
    }

    // 8. Atualiza o estado
    if (isP1) {
        state.currentPokemon1 = newPokemon;
    } else {
        state.currentPokemon2 = newPokemon;
    }

    log(logs, `${defender.name} foi arrastado para fora da batalha!`, 'text-orange-600 font-bold');
    log(logs, `${newPokemon.name} foi arrastado para o campo!`, 'text-orange-600 font-bold');

    // 9. Habilidades de entrada do novo Pokémon
    const opponent = isP1 ? state.currentPokemon2 : state.currentPokemon1;
    // O último Pokémon (defender) é passado para lógica de cópia (Costar, Receiver)
    const entryRes = EntryAbilities.handleEntryAbilities(newPokemon, opponent, true, logs as any, state, defender);

    // Atualiza clima se mudou na entrada
    if (entryRes.weather) {
        state.weather = entryRes.weather;
        state.weatherTurns = 5;
    }
}
