
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Frustração (Frustration).
 * Regra Oficial: O poder base depende da felicidade (friendship) do usuário.
 * Fórmula: Poder = (255 - Felicidade) / 2.5
 * 
 * Quanto MENOR a felicidade, MAIOR o poder.
 * Felicidade 0 = 102 Poder (Máximo).
 * Felicidade 255 = 1 Poder (Mínimo).
 * 
 * Nota: Como o sistema atual não rastreia felicidade explicitamente na interface Pokemon,
 * assumimos o padrão competitivo ideal para este golpe (Felicidade 0) resultando em 102 BP.
 */
export function getFrustrationPower(attacker: Pokemon): number {
    // Se a propriedade friendship existir no futuro, usamos ela. Caso contrário, assumimos 0 (Máximo poder).
    const friendship = (attacker as any).friendship ?? 0;
    
    const power = Math.floor((255 - friendship) / 2.5);
    
    // O poder mínimo é 1
    return Math.max(1, power);
}
