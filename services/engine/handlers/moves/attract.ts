
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Atração (Attract).
 * Regra Oficial:
 * 1. Faz o alvo se apaixonar (Infatuation) se for do gênero oposto.
 * 2. Falha se o usuário ou o alvo não tiverem gênero (Genderless).
 * 3. Falha se o alvo já estiver apaixonado.
 * 4. Habilidades como Insensível (Oblivious) e Véu de Aroma (Aroma Veil) protegem o alvo.
 */
export function handleAttract(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[], 
    state?: BattleState
) {
    if (defender.isFainted) return;

    // 1. Verifica se já está apaixonado
    if (defender.statusEffects['infatuation']) {
        log(logs, `Mas falhou! ${defender.name} já está apaixonado!`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica Gêneros (Falha se algum for sem gênero ou se forem iguais)
    if (attacker.gender === 'genderless' || defender.gender === 'genderless') {
        log(logs, `Mas falhou! Não afeta Pokémon sem gênero.`, 'text-gray-500 italic');
        return;
    }

    if (attacker.gender === defender.gender) {
        log(logs, `Mas falhou! Só funciona em gêneros opostos.`, 'text-gray-500 italic');
        return;
    }

    // 3. Aplica o status
    // O handler central de status cuida de imunidades como Oblivious, Aroma Veil e mensagens de sucesso/imunidade
    StatusConditions.applyStatus(
        defender, 
        'infatuation', 
        logs, 
        attacker, 
        false, // isFromSynchronize
        state
    );
}
