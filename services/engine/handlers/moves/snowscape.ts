
import { BattleState, LogEntry, Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as Forecast from '../abilities/forecast';

/**
 * Lógica para o movimento Paisagem de Neve (Snowscape).
 * Efeito:
 * 1. Muda o clima para Neve (Hail no sistema) por 5 turnos.
 * 2. Se o usuário segurar Icy Rock, dura 8 turnos.
 * 3. Aumenta a Defesa de tipos Gelo em 50% (implementado em statCalculator.ts).
 */
export function handleSnowscape(
    state: BattleState, 
    logs: LogEntry[], 
    attacker: Pokemon
) {
    if (state.weather === 'hail') {
        log(logs, `Mas falhou! Já está nevando.`, 'text-gray-500 italic');
        return;
    }

    state.weather = 'hail';
    state.weatherTurns = attacker.heldItem === 'icy-rock' ? 8 : 5;

    log(logs, `Começou a nevar!`, 'text-cyan-500 font-bold');

    // Atualiza a forma de Castform se estiver em campo
    if (state.currentPokemon1) Forecast.handleForecast(state.currentPokemon1, state, logs);
    if (state.currentPokemon2) Forecast.handleForecast(state.currentPokemon2, state, logs);
}
