import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { handleRecover } from './recover';

/**
 * Lógica para o movimento Bebida de Leite (Milk Drink).
 * Restaura até 50% do HP Máximo do usuário.
 * Funcionalmente idêntico ao Recover.
 */
export function handleMilkDrink(attacker: Pokemon, logs: LogEntry[], state?: BattleState) {
    handleRecover(attacker, logs);
}
