
/**
 * Lógica para o movimento Bola Climática (Weather Ball).
 * Regra Oficial:
 * 1. O tipo muda dependendo do clima:
 *    - Sol: Fogo
 *    - Chuva: Água
 *    - Areia: Pedra
 *    - Granizo/Neve: Gelo
 * 2. Se houver clima ativo, o poder base dobra (50 -> 100).
 */

export function getEffectiveType(weather: string): string {
    if (weather === 'sun') return 'fire';
    if (weather === 'rain') return 'water';
    if (weather === 'sand') return 'rock';
    if (weather === 'hail') return 'ice';
    return 'normal';
}

export function getPower(basePower: number, weather: string): number {
    return weather !== 'none' ? basePower * 2 : basePower;
}
