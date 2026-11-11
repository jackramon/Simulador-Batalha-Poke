
import { get, set, clear } from 'idb-keyval';

const CACHE_PREFIX = 'poke_v1_';

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await get<T>(CACHE_PREFIX + key);
    return cached || null;
  } catch (e) {
    console.warn('Erro ao ler do cache (IDB):', e);
    return null;
  }
}

/**
 * Remove todos os itens do banco de dados IndexedDB padrão usado pelo idb-keyval.
 * Isso limpa todo o cache da API.
 */
export async function clearApiCache(): Promise<void> {
  try {
    await clear();
    console.log(`[Cache System] Cache IndexedDB limpo com sucesso.`);
  } catch (e) {
    console.error('Falha ao limpar cache da API (IDB):', e);
  }
}

export async function saveToCache(key: string, data: any): Promise<void> {
  const fullKey = CACHE_PREFIX + key;
  try {
    await set(fullKey, data);
  } catch (e) {
    console.warn('Erro genérico ao salvar no cache (IDB):', e);
  }
}
