
import { Pokemon, BattleState, Move } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { calculateDamage } from '../damageUtils';
import { calculateTypeEffectiveness } from '../../mechanics/effectiveness';
import * as NeutralizingGas from '../abilities/neutralizing_gas';

// Chave para armazenar o status
const FUTURE_SIGHT_KEY = 'future-sight';

/**
 * Inicia a contagem da Visão do Futuro.
 * Regra: Falha se já houver uma Visão do Futuro ativa mirando na posição do alvo.
 */
export function handleFutureSightStart(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.statusEffects[FUTURE_SIGHT_KEY]) {
        log(logs, 'Mas falhou! Já existe um ataque previsto para este alvo.', 'text-gray-500 italic');
        return;
    }

    // Registra o status no alvo.
    // Armazena uma cópia (snapshot) dos atributos ofensivos do atacante para uso futuro (opcional, 
    // mas a regra Gen 5+ usa o SpAtk do usuário no momento do impacto se ele estiver em campo, 
    // ou do slot se trocou. Para este simulador simplificado, vinculamos ao atacante original).
    defender.statusEffects[FUTURE_SIGHT_KEY] = { 
        turns: 3, // Turno atual + 2 turnos finais = Dano no final do 3º turno
        sourceMoveName: attacker.id.toString() // Usa ID para rastrear origem se necessário
    };

    log(logs, BATTLE_MESSAGES.FUTURE_SIGHT_START(attacker.name), 'text-indigo-600 font-bold italic');
}

/**
 * Processa a contagem e causa dano no final do turno.
 * Deve ser chamado no turnEnd.ts.
 */
export function handleFutureSightEnd(
    defender: Pokemon, 
    state: BattleState, 
    logs: {message: string, color: string}[]
) {
    if (!defender.statusEffects[FUTURE_SIGHT_KEY] || defender.isFainted) return;

    defender.statusEffects[FUTURE_SIGHT_KEY].turns--;

    if (defender.statusEffects[FUTURE_SIGHT_KEY].turns <= 0) {
        // HORA DO DANO
        delete defender.statusEffects[FUTURE_SIGHT_KEY];
        
        log(logs, BATTLE_MESSAGES.FUTURE_SIGHT_HIT(defender.name), 'text-purple-600 font-black text-lg');

        // Precisamos encontrar quem usou o golpe para calcular o dano.
        // No 1v1, é o oponente do defensor.
        const isP1 = state.currentPokemon1?.id === defender.id;
        const attacker = isP1 ? state.currentPokemon2 : state.currentPokemon1;

        if (!attacker) return; // Se não houver atacante (ex: batalha acabou), aborta.

        // Cria um objeto de movimento "mock" para o cálculo de dano
        const futureSightMove: Move = {
            name: 'future-sight',
            displayName: 'Visão do Futuro',
            type: 'psychic',
            power: 120,
            accuracy: 100,
            damageClass: 'special',
            isStatus: false,
            uses: 0, maxUses: 0, description: ''
        };

        // Calcula eficácia de tipo
        const eff = calculateTypeEffectiveness(
            futureSightMove.type, 
            defender.types, 
            defender.ability, 
            attacker.ability, 
            futureSightMove.name,
            { ...defender.statusEffects, isTerastallized: defender.isTerastallized }
        );

        // Se o golpe for imune, não calcula dano
        if (eff.multiplier === 0) {
            log(logs, eff.message, eff.color);
            return;
        }

        if (eff.multiplier !== 1) {
            log(logs, eff.message, eff.color);
        }

        // Simulação de cálculo de dano
        const damage = calculateDamage(
            attacker, 
            defender, 
            futureSightMove, 
            state.weather, 
            false, // Sem crítico forçado (poderia ser randomizado)
            eff.multiplier, // Multiplicador de eficácia calculado
            0,   // Hit Index
            logs,
            state,
            undefined, // fixedRoll
            undefined  // defenderAction (Não se aplica)
        );

        if (damage > 0) {
            defender.hp = Math.max(0, defender.hp - damage);
            log(logs, BATTLE_MESSAGES.DAMAGE_DEALT(damage), 'text-red-700 font-bold');
            
            if (defender.hp === 0) {
                defender.isFainted = true;
                log(logs, BATTLE_MESSAGES.FAINTED(defender.name), 'text-red-900 font-bold');
            }
        }
    }
}
