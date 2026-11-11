
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as Oblivious from '../abilities/oblivious';
import * as AromaVeil from '../abilities/aroma_veil';

/**
 * Lógica para o movimento Tormento (Torment).
 * Regra Oficial: 
 * 1. O alvo fica impedido de usar o mesmo movimento duas vezes seguidas.
 * 2. Falha se o alvo já estiver atormentado.
 * 3. Habilidades como Insensível (Oblivious) e Véu de Aroma (Aroma Veil) protegem contra este efeito.
 * 4. Duração: Enquanto o alvo permanecer em campo (status volátil).
 */
export function handleTorment(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se já está sob efeito
    if (defender.statusEffects['torment']) {
        log(logs, `Mas falhou! ${defender.name} já está atormentado.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica imunidades de Habilidade
    // Oblivious (Insensível)
    if (Oblivious.isImmuneToTorment(defender)) {
        log(logs, `A habilidade Insensível de ${defender.name} impede o tormento!`, 'text-gray-500 italic text-xs');
        return;
    }
    
    // Aroma Veil (Véu de Aroma) - Protege a si mesmo e aliados de efeitos mentais
    if (AromaVeil.isImmune(defender, 'torment')) {
        log(logs, `O Véu de Aroma protege ${defender.name} de ataques mentais!`, 'text-pink-500 italic text-xs');
        return;
    }

    // 3. Aplica o status
    // Duração: -1 (Indefinido até troca ou cura)
    defender.statusEffects['torment'] = { turns: -1 };
    
    log(logs, `${defender.name} foi submetido ao tormento!`, 'text-purple-600 font-bold italic');
}
