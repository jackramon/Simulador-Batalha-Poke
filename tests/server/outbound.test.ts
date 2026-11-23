import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OutboundTimeoutError,
  createGeminiGenerateConfig,
  fetchWithTimeout,
} from '../../server/outbound';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('timeout e cancelamento das chamadas externas', () => {
  it('aborta a requisição no prazo sem espera real longa', async () => {
    vi.useFakeTimers();
    const fetchStub = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      });
    });
    vi.stubGlobal('fetch', fetchStub);

    const request = fetchWithTimeout('https://example.invalid', {}, 50);
    const rejection = expect(request).rejects.toBeInstanceOf(OutboundTimeoutError);

    await vi.advanceTimersByTimeAsync(50);
    await rejection;

    const signal = fetchStub.mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(true);
  });

  it('limpa o timer quando a chamada termina antes do prazo', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));

    const response = await fetchWithTimeout('https://example.invalid', {}, 10_000);

    expect(await response.text()).toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('configura o timeout e o cancelamento pela API real do SDK do Gemini', () => {
    const controller = new AbortController();
    const config = createGeminiGenerateConfig(1_500, controller.signal);

    expect(config.httpOptions?.timeout).toBe(1_500);
    expect(config.abortSignal).toBe(controller.signal);
    expect(config.responseMimeType).toBe('application/json');
  });
});
