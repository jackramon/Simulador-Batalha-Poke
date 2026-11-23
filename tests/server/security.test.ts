import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { createRateLimit, isLoopbackAddress, requireLoopback } from '../../server/security';

function createRequest(remoteAddress: string | undefined, headers: Record<string, string> = {}) {
  return {
    socket: { remoteAddress },
    headers,
  } as unknown as Request;
}

function createResponse() {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string | number) {
      this.headers[name] = String(value);
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };

  return response as unknown as Response & typeof response;
}

describe('proteção de acesso ao proxy de LLM', () => {
  it('permite chamadas originadas do loopback IPv4 e IPv6', () => {
    for (const address of ['127.0.0.1', '127.8.9.10', '::1', '::ffff:127.0.0.1']) {
      const next = vi.fn();

      requireLoopback(createRequest(address), createResponse(), next as unknown as NextFunction);

      expect(next).toHaveBeenCalledOnce();
    }
  });

  it('bloqueia IP remoto mesmo com X-Forwarded-For falsificado', () => {
    const next = vi.fn();
    const response = createResponse();
    const request = createRequest('203.0.113.25', {
      'x-forwarded-for': '127.0.0.1',
      'x-real-ip': '127.0.0.1',
    });

    requireLoopback(request, response, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Acesso remoto ao proxy de LLM bloqueado.' });
  });

  it('nega endereço ausente ou inválido', () => {
    expect(isLoopbackAddress(undefined)).toBe(false);
    expect(isLoopbackAddress('192.168.1.20')).toBe(false);
  });
});

describe('rate limit das rotas de LLM e modelos', () => {
  it('responde 429 com Retry-After e libera após a janela', () => {
    let now = 1_000;
    const limiter = createRateLimit({ max: 1, windowMs: 60_000, now: () => now });
    const firstResponse = createResponse();
    const firstNext = vi.fn();

    limiter(createRequest('127.0.0.1'), firstResponse, firstNext as unknown as NextFunction);
    expect(firstNext).toHaveBeenCalledOnce();

    const blockedResponse = createResponse();
    const blockedNext = vi.fn();
    limiter(createRequest('127.0.0.1'), blockedResponse, blockedNext as unknown as NextFunction);

    expect(blockedNext).not.toHaveBeenCalled();
    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.headers['Retry-After']).toBe('60');
    expect(blockedResponse.body).toEqual({
      error: 'Limite de requisições de LLM excedido. Tente novamente mais tarde.',
    });

    now += 60_000;
    const renewedResponse = createResponse();
    const renewedNext = vi.fn();
    limiter(createRequest('127.0.0.1'), renewedResponse, renewedNext as unknown as NextFunction);

    expect(renewedNext).toHaveBeenCalledOnce();
  });
});
