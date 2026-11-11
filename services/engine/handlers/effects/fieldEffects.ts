
import { BattleState, Move, Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Forecast from '../abilities/forecast';
import * as DesolateLand from '../abilities/desolate_land';

export function handleFieldMove(state: BattleState, move: Move, logs: LogEntry[]) {
    // Determine target weather based on move name
    let newWeather: BattleState['weather'] | null = null;
    let weatherLog = '';
    let weatherColor = '';

    if (move.name === 'sunny-day') {
        newWeather = 'sun';
        weatherLog = 'O sol ficou forte!';
        weatherColor = 'text-orange-500 font-bold';
    } else if (move.name === 'rain-dance') {
        newWeather = 'rain';
        weatherLog = 'Começou a chover!';
        weatherColor = 'text-blue-500 font-bold';
    } else if (move.name === 'sandstorm') {
        newWeather = 'sand';
        weatherLog = 'Uma tempestade de areia se formou!';
        weatherColor = 'text-yellow-600 font-bold';
    } else if (move.name === 'hail') {
        newWeather = 'hail';
        weatherLog = 'Começou a cair granizo!';
        weatherColor = 'text-cyan-500 font-bold';
    } else if (move.name === 'snowscape') {
        newWeather = 'hail'; // Represents Snow/Hail mechanics
        weatherLog = 'Começou a nevar!';
        weatherColor = 'text-cyan-500 font-bold';
    }

    // Apply Weather
    if (newWeather) {
        if (DesolateLand.isDesolateLandActive(state)) {
            log(logs, 'O calor extremo dissipou a tentativa de mudar o clima!', 'text-orange-600 italic font-bold');
            return;
        }

        const oldWeather = state.weather;
        state.weather = newWeather;
        state.weatherTurns = 5; 
        
        log(logs, weatherLog, weatherColor);

        if (oldWeather !== state.weather) {
            if (state.currentPokemon1) Forecast.handleForecast(state.currentPokemon1, state, logs);
            if (state.currentPokemon2) Forecast.handleForecast(state.currentPokemon2, state, logs);
        }
        return;
    }

    // Handle Trick Room
    if (move.name === 'trick-room' || move.effect?.status === 'trick-room') {
       state.trickRoomActive = !state.trickRoomActive;
       state.trickRoomTurns = 5;
       
       const msg = state.trickRoomActive ? BATTLE_MESSAGES.TRICK_ROOM_START() : BATTLE_MESSAGES.TRICK_ROOM_END();
       log(logs, msg, 'text-purple-600 font-bold');
    }
}

export function handleScreens(state: BattleState, attacker: Pokemon, move: Move, logs: LogEntry[]) {
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const hazards = isP1 ? state.p1Hazards : state.p2Hazards;
    const duration = attacker.heldItem === 'light-clay' ? 8 : 5;

    if (move.name === 'reflect') {
        if (hazards.reflect > 0) {
            log(logs, `Refletir já está ativo!`, 'text-gray-500 italic');
        } else {
            hazards.reflect = duration;
            log(logs, `Refletir aumentou a defesa do time de ${attacker.name}!`, 'text-blue-600 font-bold');
        }
    } else if (move.name === 'light-screen') {
        if (hazards.lightScreen > 0) {
            log(logs, `Tela de Luz já está ativa!`, 'text-gray-500 italic');
        } else {
            hazards.lightScreen = duration;
            log(logs, `Tela de Luz aumentou a defesa especial do time de ${attacker.name}!`, 'text-blue-600 font-bold');
        }
    } else if (move.name === 'aurora-veil') {
        if (state.weather !== 'hail') {
            log(logs, `Véu Aurora falhou! Requer granizo/neve.`, 'text-gray-500 italic');
        } else if (hazards.auroraVeil > 0) {
            log(logs, `Véu Aurora já está ativo!`, 'text-gray-500 italic');
        } else {
            hazards.auroraVeil = duration;
            log(logs, `Véu Aurora protege o time de ${attacker.name}!`, 'text-purple-600 font-bold');
        }
    }
}
