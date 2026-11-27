/**
 * Classificação central dos climas de gelo.
 *
 * `snow` representa a Neve da 9ª geração: não causa dano residual e aumenta a Defesa
 * de tipos Gelo. `hail` é o Granizo legado, mantido separadamente por ainda causar
 * dano residual ao fim do turno. Os dois compartilham os efeitos ligados ao tipo Gelo
 * (Blizzard, Snow Cloak, Ice Body, Slush Rush, Ice Face, Forecast, Véu Aurora, etc.).
 */
export type SnowyWeather = 'snow' | 'hail';

export function isSnowyWeather(weather: string | undefined): weather is SnowyWeather {
    return weather === 'snow' || weather === 'hail';
}