
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Combustão (Burn Up).
 * Regra Oficial: 
 * 1. Falha se o usuário não tiver o tipo Fogo.
 * 2. Se acertar, o usuário perde o tipo Fogo.
 */

export function checkFailure(attacker: Pokemon, logs: {message: string, color: string}[]): boolean {
    // Verifica se o usuário possui o tipo Fogo
    // Nota: Terastal Fire conta como tipo Fogo para este check.
    const hasFireType = attacker.isTerastallized 
        ? attacker.teraType === 'fire'
        : attacker.types.includes('fire');

    if (!hasFireType) {
        log(logs, `Mas falhou! ${attacker.name} não tem mais fogo para queimar!`, 'text-gray-500 italic');
        return true;
    }
    return false;
}

export function handleBurnUpEffect(attacker: Pokemon, logs: {message: string, color: string}[]) {
    if (attacker.isFainted) return;

    // Se estiver Terastalizado, a regra de Burn Up é complexa na Gen 9:
    // O movimento funciona, mas o tipo Tera NÃO é removido. 
    // No entanto, se não estiver Terastalizado, o tipo é removido dos tipos base.
    
    if (attacker.isTerastallized) {
        // Se estiver Terastalizado em Fogo, o golpe funciona mas o tipo não some.
        // Se estiver Terastalizado em outro tipo, o checkFailure já teria barrado se não tivesse fire nos base types?
        // Na verdade, se Terastalizado != Fire, o usuário não é considerado Fire type ofensivamente para Burn Up a menos que o Tera seja Fire.
        // Se Tera = Fire, Burn Up funciona mas não remove o Tera Type (você não pode ficar "Tera Typeless").
        // Logo, nenhum efeito de status ocorre se estiver Terastalizado.
        return;
    }

    // Remove o tipo Fogo
    attacker.types = attacker.types.filter(t => t !== 'fire');
    
    // Se ficou sem tipos, torna-se "typeless" (array vazio, defensivamente neutro)
    log(logs, `${attacker.name} queimou todo o seu combustível e perdeu o tipo Fogo!`, 'text-orange-600 font-bold italic');
}
