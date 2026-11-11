
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as StatusConditions from '../effects/statusConditions';
import * as Terrain from '../terrain';
import * as Insomnia from '../abilities/insomnia';
import * as VitalSpirit from '../abilities/vital_spirit';
import * as LeafGuard from '../abilities/leaf_guard';
import * as PurifyingSalt from '../abilities/purifying_salt';
import * as Uproar from './uproar';
import * as NeutralizingGas from '../abilities/neutralizing_gas';

// Chave para o status volátil de Bocejo
const YAWN_KEY = 'yawn';

/**
 * Lógica para o movimento Bocejo (Yawn).
 * Regra Oficial: 
 * 1. Deixa o alvo sonolento no turno de uso.
 * 2. O alvo adormece no final do PRÓXIMO turno.
 * 
 * Falha se:
 * - O alvo já tiver um status não-volátil (Burn, Para, etc).
 * - O alvo já estiver sonolento.
 * - O alvo for imune ao sono (Insomnia, Vital Spirit, Leaf Guard no sol, Purifying Salt).
 * - O campo impedir sono (Electric/Misty Terrain).
 * - Algazarra (Uproar) estiver ativa.
 */
export function handleYawn(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // 1. Verifica se já tem status principal
    const majorStatuses = ['sleep', 'burn', 'poison', 'toxic', 'paralysis', 'freeze'];
    if (majorStatuses.some(s => defender.statusEffects[s])) {
        log(logs, BATTLE_MESSAGES.YAWN_FAIL(), 'text-gray-500 italic');
        return;
    }

    // 2. Verifica se já está sonolento
    if (defender.statusEffects[YAWN_KEY]) {
        log(logs, BATTLE_MESSAGES.YAWN_FAIL(), 'text-gray-500 italic');
        return;
    }

    // 3. Verificações de Imunidade e Campo
    if (state) {
        // Algazarra
        if (Uproar.isUproarActive(state)) {
            log(logs, BATTLE_MESSAGES.UPROAR_BLOCK(), 'text-red-500 italic');
            return;
        }

        // Terrenos
        if (Terrain.isGrounded(defender, state)) {
            if (state.terrain === 'electric') {
                log(logs, `${defender.name} está cercado de eletricidade e não consegue dormir!`, 'text-yellow-600 italic');
                return;
            }
            if (state.terrain === 'misty') {
                log(logs, `A névoa mística protege ${defender.name}!`, 'text-pink-600 italic');
                return;
            }
        }
    }

    // Habilidades
    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
    if (!NeutralizingGas.isAbilitySuppressed(defender.ability, isGasActive)) {
        if (Insomnia.isImmuneToSleep(defender) || VitalSpirit.isImmuneToSleep(defender)) {
            log(logs, `A habilidade de ${defender.name} impede o sono!`, 'text-gray-500 italic');
            return;
        }
        if (LeafGuard.isImmuneToStatus(defender, state?.weather || 'none', state)) {
            log(logs, `Guarda Folha protege ${defender.name} sob o sol!`, 'text-green-600 italic');
            return;
        }
        if (PurifyingSalt.isImmuneToStatus(defender, state)) {
            log(logs, `Sal Purificador protege ${defender.name}!`, 'text-gray-500 italic');
            return;
        }
    }

    // 4. Aplica o efeito Sonolento
    // Turns: 2. 
    // Fim do Turno 1 (Atual): Decrementa para 1.
    // Fim do Turno 2 (Próximo): Decrementa para 0 -> Dorme.
    defender.statusEffects[YAWN_KEY] = { turns: 2 };
    
    log(logs, BATTLE_MESSAGES.YAWN_START(defender.name), 'text-indigo-500 font-bold italic');
}

/**
 * Processa o efeito do Bocejo no final do turno.
 */
export function handleYawnTurnEnd(
    pokemon: Pokemon, 
    logs: LogEntry[], 
    state?: BattleState
) {
    if (!pokemon.statusEffects[YAWN_KEY] || pokemon.isFainted) return;

    pokemon.statusEffects[YAWN_KEY].turns--;

    // Se o contador chegar a 0, tenta aplicar o sono
    if (pokemon.statusEffects[YAWN_KEY].turns <= 0) {
        // Remove o status de sonolência
        delete pokemon.statusEffects[YAWN_KEY];

        // Tenta aplicar o sono (applyStatus fará as verificações finais de imunidade novamente)
        // Isso é importante caso o terreno ou clima tenha mudado no turno final.
        StatusConditions.applyStatus(
            pokemon, 
            'sleep', 
            logs, 
            undefined, // attacker desconhecido no fim do turno, não crítico
            false, 
            state
        );
        
        // Se pegou no sono, a mensagem já vem do applyStatus. 
        // Se falhou (ex: ativou Electric Terrain no último turno), applyStatus avisa ou falha silenciosamente.
        // O log específico de "caiu no sono" pode ser reforçado se o status foi aplicado.
        if (pokemon.statusEffects['sleep']) {
             // O applyStatus já loga a aplicação do status.
             // Podemos adicionar um log extra de flavor se desejado, mas o padrão já é bom.
        }
    }
}
