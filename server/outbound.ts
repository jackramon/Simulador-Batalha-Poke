import type { GenerateContentConfig } from '@google/genai';

export const CATALOG_TIMEOUT_MS = 5_000;

export class OutboundTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`A chamada externa excedeu o tempo limite de ${timeoutMs} ms.`);
    this.name = 'OutboundTimeoutError';
  }
}

export interface TimeoutController {
  signal: AbortSignal;
  clear(): void;
  didTimeout(): boolean;
}

export function createTimeoutController(
  timeoutMs: number,
  parentSignal?: AbortSignal,
): TimeoutController {
  const controller = new AbortController();
  let timedOut = false;

  if (parentSignal?.aborted) {
    controller.abort(parentSignal.reason);
  }

  const onParentAbort = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener('abort', onParentAbort, { once: true });

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new OutboundTimeoutError(timeoutMs));
  }, timeoutMs);
  timer.unref();

  const clear = () => {
    clearTimeout(timer);
    parentSignal?.removeEventListener('abort', onParentAbort);
  };

  return {
    signal: controller.signal,
    clear,
    didTimeout: () => timedOut,
  };
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 30_000,
): Promise<Response> {
  const timeout = createTimeoutController(timeoutMs, init.signal ?? undefined);

  try {
    return await fetch(input, { ...init, signal: timeout.signal });
  } catch (error) {
    if (timeout.didTimeout()) {
      throw timeout.signal.reason;
    }
    throw error;
  } finally {
    timeout.clear();
  }
}

export function createGeminiGenerateConfig(
  timeoutMs: number,
  signal: AbortSignal,
): GenerateContentConfig {
  // Opções verificadas no SDK @google/genai: o httpOptions.timeout aborta a
  // requisição real e o abortSignal permite cancelamento pelo chamador.
  return {
    responseMimeType: 'application/json',
    temperature: 0.2,
    abortSignal: signal,
    httpOptions: { timeout: timeoutMs },
  };
}
