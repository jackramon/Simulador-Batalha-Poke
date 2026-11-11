import { Pokemon, BattleState } from '../../../../types';
import { handleGooey } from './gooey';

/**
 * Lógica para a habilidade Cabelos Emaranhados (Tangling Hair).
 * Funciona exatamente como Viscosidade (Gooey).
 * Reduz a Velocidade do atacante em 1 estágio ao contato.
 */
export function handleTanglingHair(
    attacker: Pokemon, 
    defender: Pokemon, 
    isContact: boolean, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Reutiliza a lógica de Gooey, pois são idênticas mecanicamente.
    handleGooey(attacker, defender, isContact, logs, state);
}
