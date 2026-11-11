
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { TYPE_NAMES_PT } from '../../../../data/types';

/**
 * Lógica para o movimento Refletir Tipo (Reflect Type).
 * Regra Oficial (Gen 9):
 * 1. O usuário muda seu tipo para ser igual ao tipo atual do alvo.
 * 2. Se o alvo estiver Terastalizado, copia o Tipo Tera.
 * 3. Falha se o usuário estiver Terastalizado.
 * 4. Falha se o usuário for Arceus ou Silvally (com Multitype/RKS System).
 * 5. Falha se o alvo tiver o Tipo Tera Estelar.
 * 6. Falha se o usuário já tiver os mesmos tipos que o alvo.
 */
export function handleReflectType(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
    if (attacker.isFainted || defender.isFainted) return;

    // 1. Falha se o usuário estiver Terastalizado (Não pode mudar de tipo)
    if (attacker.isTerastallized) {
        log(logs, `Mas falhou! ${attacker.name} está Terastalizado.`, 'text-gray-500 italic');
        return;
    }

    // 2. Falha se o usuário for Arceus ou Silvally (Multitype / RKS System)
    if (['multitype', 'rks-system'].includes(attacker.ability)) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }
    
    // 3. Falha se o alvo tiver o Tipo Tera Estelar
    if (defender.isTerastallized && defender.teraType === 'stellar') {
        log(logs, `Mas falhou! O tipo Estelar não pode ser refletido.`, 'text-gray-500 italic');
        return;
    }

    // 4. Determina os tipos do alvo (Considerando Tera)
    const targetTypes = defender.isTerastallized && defender.teraType
        ? [defender.teraType]
        : defender.types;
    
    if (targetTypes.length === 0) {
         log(logs, `Mas falhou!`, 'text-gray-500 italic');
         return;
    }

    // 5. Falha se os tipos já forem idênticos
    const currentTypes = attacker.types;
    const sameLength = currentTypes.length === targetTypes.length;
    const sameTypes = sameLength && currentTypes.every(t => targetTypes.includes(t));

    if (sameTypes) {
        log(logs, `Mas falhou! ${attacker.name} já tem o mesmo tipo.`, 'text-gray-500 italic');
        return;
    }

    // 6. Executa a mudança
    attacker.types = [...targetTypes];

    const typeNames = targetTypes.map(t => TYPE_NAMES_PT[t] || t).join('/');
    log(logs, `${attacker.name} refletiu o tipo de ${defender.name} e tornou-se ${typeNames}!`, 'text-indigo-600 font-bold italic');
}
