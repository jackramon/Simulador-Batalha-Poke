import { describe, expect, it } from 'vitest';
import { handleWeatherDamage } from '../../services/engine/handlers/moves/weather_damage';
import { calculateStat } from '../../services/engine/handlers/statCalculator';
import { triggerSnowWarning } from '../../services/engine/handlers/abilities/snow_warning';
import { handleIceBody } from '../../services/engine/handlers/abilities/ice_body';
import { handleSnowscape } from '../../services/engine/handlers/moves/snowscape';
import { handleFieldMove, handleScreens } from '../../services/engine/handlers/effects/fieldEffects';
import { isSnowyWeather } from '../../services/engine/mechanics/weather';
import { createBattleState, createMove, createPokemon } from '../factories';

// 4.1.1 — Neve da 9ª geração não causa dano residual, mas mantém o aumento de Defesa
// de tipos Gelo. O Granizo legado continua existindo separado, com o próprio dano residual.

describe('4.1.1 Snow não causa dano e o Hail legado permanece separado', () => {
  it('neve não causa dano residual', () => {
    const pokemon = createPokemon({ types: ['normal'], hp: 160, maxHP: 160 });
    const logs: Array<{ message: string; color: string }> = [];

    handleWeatherDamage(pokemon, 'snow', logs);

    expect(pokemon.hp).toBe(160);
    expect(logs).toHaveLength(0);
  });

  it('granizo legado continua causando dano residual', () => {
    const pokemon = createPokemon({ types: ['normal'], hp: 160, maxHP: 160 });
    const logs: Array<{ message: string; color: string }> = [];

    handleWeatherDamage(pokemon, 'hail', logs);

    expect(pokemon.hp).toBe(150);
    expect(logs).toHaveLength(1);
  });

  it('mantém o aumento defensivo de tipos Gelo na neve', () => {
    const ice = createPokemon({ types: ['ice'], defenseStat: 100 });
    const base = calculateStat(ice, 'defense', 'none');
    const expected = Math.floor(base * 1.5);

    expect(calculateStat(ice, 'defense', 'snow')).toBe(expected);
    expect(calculateStat(ice, 'defense', 'hail')).toBe(expected);
  });

  it('Alerta de Neve e Paisagem de Neve produzem neve', () => {
    const state = createBattleState(
      [createPokemon({ ability: 'snow-warning' })],
      [createPokemon()],
      { weather: 'none' },
    );
    expect(triggerSnowWarning(state.currentPokemon1!, state, [])).toBe('snow');

    const snowState = createBattleState([createPokemon({ id: 1 })], [createPokemon({ id: 2 })]);
    handleSnowscape(snowState, [], createPokemon());
    expect(snowState.weather).toBe('snow');
    expect(snowState.weatherTurns).toBe(5);
  });

  it('o golpe Granizo mantém o clima legado e Véu Aurora aceita neve', () => {
    const hailState = createBattleState([createPokemon()], [createPokemon()]);
    handleFieldMove(
      hailState,
      createMove({ name: 'hail', damageClass: 'status', isStatus: true }),
      [],
    );
    expect(hailState.weather).toBe('hail');

    const snowState = createBattleState([createPokemon()], [createPokemon()], { weather: 'snow' });
    const logs: Array<{ message: string; color: string }> = [];
    handleScreens(snowState, snowState.currentPokemon1!, createMove({ name: 'aurora-veil' }), logs);

    expect(snowState.p1Hazards.auroraVeil).toBeGreaterThan(0);
  });

  it('Corpo de Gelo cura na neve e a classificação de clima é explícita', () => {
    const pokemon = createPokemon({ ability: 'ice-body', types: ['ice'], hp: 50, maxHP: 160 });

    expect(handleIceBody(pokemon, 'snow', [])).toBe(true);
    expect(pokemon.hp).toBe(60);

    expect(isSnowyWeather('snow')).toBe(true);
    expect(isSnowyWeather('hail')).toBe(true);
    expect(isSnowyWeather('sand')).toBe(false);
  });
});