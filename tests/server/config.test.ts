import { describe, expect, it } from 'vitest';
import { readServerConfig } from '../../server/config';

describe('configuração do servidor', () => {
  it('escuta somente no loopback por padrão', () => {
    const config = readServerConfig({});

    expect(config.host).toBe('127.0.0.1');
    expect(config.rateLimit).toEqual({ max: 60, windowMs: 60_000 });
    expect(config.requestTimeoutMs).toBe(30_000);
  });

  it('permite exposição explícita e ajustes de teste', () => {
    const config = readServerConfig({
      LLM_PROXY_HOST: '0.0.0.0',
      LLM_RATE_LIMIT_MAX: '2',
      LLM_RATE_LIMIT_WINDOW_MS: '250',
      LLM_REQUEST_TIMEOUT_MS: '99',
      LLM_ALLOWED_PAID_MODELS: 'openrouter:openai/gpt-4o',
    });

    expect(config.host).toBe('0.0.0.0');
    expect(config.rateLimit).toEqual({ max: 2, windowMs: 250 });
    expect(config.requestTimeoutMs).toBe(99);
    expect(config.paidModelAllowlist).toEqual(['openrouter:openai/gpt-4o']);
  });

  it('ignora valores inválidos sem perder os padrões seguros', () => {
    const config = readServerConfig({
      LLM_PROXY_HOST: '   ',
      LLM_RATE_LIMIT_MAX: '0',
      LLM_RATE_LIMIT_WINDOW_MS: 'texto',
      LLM_REQUEST_TIMEOUT_MS: '-5',
    });

    expect(config.host).toBe('127.0.0.1');
    expect(config.rateLimit).toEqual({ max: 60, windowMs: 60_000 });
    expect(config.requestTimeoutMs).toBe(30_000);
  });
});
