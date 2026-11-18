import { describe, it, expect, afterEach, vi } from 'vitest';

/**
 * Regressão do bug de tela branca em origens opacas:
 * `localStorage` pode lançar SecurityError no simples acesso (iframe sandbox,
 * file:// em alguns navegadores, Safari privado). O utilitário precisa degradar
 * para memória em vez de derrubar a aplicação.
 */

function definirLocalStorage(descritor: PropertyDescriptor) {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...descritor });
}

function criarStorageFalso() {
    const dados = new Map<string, string>();
    return {
        dados,
        getItem: (k: string) => (dados.has(k) ? dados.get(k)! : null),
        setItem: (k: string, v: string) => { dados.set(k, String(v)); },
        removeItem: (k: string) => { dados.delete(k); },
        clear: () => dados.clear(),
        key: (i: number) => [...dados.keys()][i] ?? null,
        get length() { return dados.size; },
    };
}

async function carregarModulo() {
    // o módulo memoiza a sondagem: recarrega para cada cenário
    vi.resetModules();
    return await import('../../utils/safeStorage');
}

afterEach(() => {
    delete (globalThis as any).localStorage;
    vi.resetModules();
});

describe('safeStorage', () => {
    it('usa o localStorage real quando ele está disponível (comportamento inalterado)', async () => {
        const falso = criarStorageFalso();
        definirLocalStorage({ value: falso });
        const { lerItem, gravarItem, removerItem } = await carregarModulo();

        expect(lerItem('darkMode')).toBeNull();
        gravarItem('darkMode', 'true');
        expect(falso.dados.get('darkMode')).toBe('true');
        expect(lerItem('darkMode')).toBe('true');

        removerItem('darkMode');
        expect(falso.dados.has('darkMode')).toBe(false);
        expect(lerItem('darkMode')).toBeNull();
        // a chave de sondagem não pode ficar para trás
        expect(falso.dados.has('__poke_sim_teste__')).toBe(false);
    });

    it('não lança quando o acesso ao localStorage lança SecurityError (origem opaca)', async () => {
        definirLocalStorage({
            get() { throw new Error('SecurityError: localStorage is not available for opaque origins'); },
        });
        const { lerItem, gravarItem, removerItem } = await carregarModulo();

        expect(() => lerItem('darkMode')).not.toThrow();
        expect(lerItem('darkMode')).toBeNull();
        expect(() => gravarItem('darkMode', 'true')).not.toThrow();
        expect(() => removerItem('darkMode')).not.toThrow();
    });

    it('degrada para memória e mantém a sessão funcional sem storage real', async () => {
        definirLocalStorage({
            get() { throw new Error('SecurityError'); },
        });
        const { lerItem, gravarItem, removerItem } = await carregarModulo();

        gravarItem('darkMode', 'true');
        expect(lerItem('darkMode')).toBe('true');
        removerItem('darkMode');
        expect(lerItem('darkMode')).toBeNull();
    });

    it('degrada para memória quando o setItem lança (cota / modo privado)', async () => {
        const falso = criarStorageFalso();
        falso.setItem = () => { throw new Error('QuotaExceededError'); };
        definirLocalStorage({ value: falso });
        const { lerItem, gravarItem } = await carregarModulo();

        expect(() => gravarItem('chave', 'valor')).not.toThrow();
        expect(lerItem('chave')).toBe('valor');
    });

    it('funciona mesmo sem localStorage nenhum no ambiente', async () => {
        delete (globalThis as any).localStorage;
        const { lerItem, gravarItem, removerItem } = await carregarModulo();

        expect(lerItem('qualquer')).toBeNull();
        expect(() => gravarItem('qualquer', '1')).not.toThrow();
        expect(() => removerItem('qualquer')).not.toThrow();
    });
});
