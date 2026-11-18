/**
 * Acesso tolerante a falhas ao Web Storage (localStorage).
 *
 * Em origens opacas — iframe com `sandbox`, `file://` em alguns navegadores,
 * modo privado do Safari — o simples acesso a `localStorage` lança SecurityError.
 * Como o simulador roda tanto hospedado quanto embutido/aberto como arquivo local,
 * todo acesso precisa ser tolerante: se o armazenamento real estiver indisponível,
 * degradamos para um mapa em memória. A sessão continua funcionando normalmente,
 * apenas não persiste entre recarregamentos.
 *
 * Quando o armazenamento real está disponível, o comportamento é idêntico ao de
 * `localStorage.getItem/setItem/removeItem` (zero mudança de comportamento).
 */

const memoria = new Map<string, string>();

// undefined = ainda não sondado; null = indisponível; Storage = utilizável.
let armazenador: Storage | null | undefined;

function obterArmazenador(): Storage | null {
    if (armazenador !== undefined) return armazenador;
    try {
        const candidato = (globalThis as any).localStorage as Storage | undefined;
        if (!candidato) {
            armazenador = null;
            return armazenador;
        }
        // Sondagem: em origens opacas o getter pode lançar, e em modo privado
        // o objeto existe mas o setItem lança QuotaExceededError.
        const chaveTeste = '__poke_sim_teste__';
        candidato.setItem(chaveTeste, '1');
        candidato.removeItem(chaveTeste);
        armazenador = candidato;
    } catch {
        armazenador = null;
    }
    return armazenador;
}

/** Lê um valor. Retorna null se a chave não existir ou o storage estiver indisponível. */
export function lerItem(chave: string): string | null {
    const real = obterArmazenador();
    if (real) {
        try {
            return real.getItem(chave);
        } catch {
            // cai para a memória abaixo
        }
    }
    return memoria.has(chave) ? memoria.get(chave)! : null;
}

/** Grava um valor. Nunca lança: se o storage falhar, guarda em memória. */
export function gravarItem(chave: string, valor: string): void {
    const real = obterArmazenador();
    if (real) {
        try {
            real.setItem(chave, valor);
            return;
        } catch {
            // cai para a memória abaixo
        }
    }
    memoria.set(chave, valor);
}

/** Remove um valor. Nunca lança, mesmo com o storage indisponível. */
export function removerItem(chave: string): void {
    const real = obterArmazenador();
    if (real) {
        try {
            real.removeItem(chave);
        } catch {
            // nada a fazer: a remoção não pode derrubar a aplicação
        }
    }
    memoria.delete(chave);
}
