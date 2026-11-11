import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para o movimento Obstruir (Obstruct).
 * 
 * Mecânica:
 * - Movimento do tipo Noturno.
 * - Categoria Status.
 * - Prioridade: +4.
 * - Efeito: Protege o usuário de todos os ataques.
 * - Efeito Secundário: Se um oponente fizer contato com o usuário protegido, a Defesa do atacante cai em 2 estágios.
 * 
 * Implementação:
 * - A proteção básica é tratada pelo sistema de 'protect' em services/engine/handlers/effects/statusMoveRouter.ts.
 * - O efeito de contato (redução de defesa) deve ser tratado em services/engine/handlers/damageUtils.ts ou onde o contato com Protect é verificado.
 * - Atualmente, o sistema trata 'obstruct' como um alias de 'protect' com prioridade +4 (já configurado em data/moves/categories.ts).
 * - A lógica de contato específica (redução de defesa) precisaria ser adicionada ao handler de contato se ainda não existir.
 */

export function isObstruct(move: Move): boolean {
    return move.name === 'obstruct';
}
