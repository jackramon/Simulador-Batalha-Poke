
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Pó de Raiva (Rage Powder) e Siga-me (Follow Me).
 * Regra Oficial: O usuário se torna o centro das atenções, forçando oponentes a atacá-lo.
 * Em batalhas 1v1, este efeito é implícito (já que só há um alvo), mas a execução do movimento 
 * ainda deve ser registrada.
 * 
 * Imunidades (Apenas Rage Powder):
 * - Pokémon do tipo Grama.
 * - Pokémon com a habilidade Sobretudo (Overcoat).
 * - Pokémon segurando Óculos de Proteção (Safety Goggles).
 * 
 * Nota: A verificação de imunidade "pó" já é tratada parcialmente pelo roteador de status,
 * mas como Rage Powder é um movimento de redirecionamento, a lógica de "falha" visual
 * é mais sutil. Aqui apenas logamos o sucesso da atração.
 */
export function handleRagePowder(attacker: Pokemon, logs: LogEntry[]) {
    // Em 1v1, o redirecionamento é redundante, mas o efeito visual ocorre.
    log(logs, `${attacker.name} tornou-se o centro das atenções!`, 'text-green-600 font-bold');
}
