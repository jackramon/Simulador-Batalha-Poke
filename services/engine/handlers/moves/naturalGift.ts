
import { Pokemon } from '../../../../types';

const NATURAL_GIFT_MAP: Record<string, { type: string, power: number }> = {
    // Frutas de Cura e Status
    'cheri-berry': { type: 'fire', power: 80 },
    'chesto-berry': { type: 'water', power: 80 },
    'pecha-berry': { type: 'electric', power: 80 },
    'rawst-berry': { type: 'grass', power: 80 },
    'aspear-berry': { type: 'ice', power: 80 },
    'leppa-berry': { type: 'fighting', power: 80 },
    'oran-berry': { type: 'poison', power: 80 },
    'persim-berry': { type: 'ground', power: 80 },
    'lum-berry': { type: 'flying', power: 80 },
    'sitrus-berry': { type: 'psychic', power: 80 },
    
    // Pinch Berries (Cura)
    'figy-berry': { type: 'bug', power: 80 },
    'wiki-berry': { type: 'rock', power: 80 },
    'mago-berry': { type: 'ghost', power: 80 },
    'aguav-berry': { type: 'dragon', power: 80 },
    'iapapa-berry': { type: 'dark', power: 80 },

    // Stat-Boosting & Rare Berries
    'liechi-berry': { type: 'grass', power: 100 },
    'ganlon-berry': { type: 'ice', power: 100 },
    'salac-berry': { type: 'fighting', power: 100 },
    'petaya-berry': { type: 'poison', power: 100 },
    'apicot-berry': { type: 'ground', power: 100 },
    'lansat-berry': { type: 'flying', power: 100 },
    'starf-berry': { type: 'psychic', power: 100 },
    'micle-berry': { type: 'rock', power: 100 },
    'custap-berry': { type: 'ghost', power: 100 },
    'jaboca-berry': { type: 'dragon', power: 100 },
    'rowap-berry': { type: 'dark', power: 100 },
    'kee-berry': { type: 'fairy', power: 100 },
    'maranga-berry': { type: 'dark', power: 100 },
    'roseli-berry': { type: 'fairy', power: 100 },
    'enigma-berry': { type: 'bug', power: 100 }
};

/**
 * Obtém a configuração de Tipo e Poder do Dom Natural baseada na Fruta segurada.
 */
export function getNaturalGiftConfig(item: string): { type: string, power: number } | null {
    if (!item) return null;
    return NATURAL_GIFT_MAP[item] || null;
}
