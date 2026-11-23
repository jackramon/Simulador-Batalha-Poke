import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function isLoopbackAddress(address: string | undefined): boolean {
  if (!address) {
    return false;
  }

  const normalized = address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : address;
  return normalized === '::1' || normalized.startsWith('127.');
}

export function requireLoopback(req: Request, res: Response, next: NextFunction): void {
  // Usa apenas o endereço do socket; cabeçalhos como X-Forwarded-For são falsificáveis.
  if (isLoopbackAddress(req.socket.remoteAddress)) {
    next();
    return;
  }

  res.status(403).json({ error: 'Acesso remoto ao proxy de LLM bloqueado.' });
}

export interface RateLimitOptions {
  max: number;
  windowMs: number;
  now?: () => number;
}

export function createRateLimit({
  max,
  windowMs,
  now = Date.now,
}: RateLimitOptions): RequestHandler {
  const clients = new Map<string, { count: number; resetAt: number }>();
  let nextCleanupAt = 0;

  return (req, res, next) => {
    const currentTime = now();
    if (currentTime >= nextCleanupAt) {
      for (const [address, client] of clients) {
        if (currentTime >= client.resetAt) {
          clients.delete(address);
        }
      }
      nextCleanupAt = currentTime + windowMs;
    }

    const key = req.socket.remoteAddress || 'desconhecido';
    const current = clients.get(key);

    if (!current || currentTime >= current.resetAt) {
      clients.set(key, { count: 1, resetAt: currentTime + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count <= max) {
      next();
      return;
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - currentTime) / 1_000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      error: 'Limite de requisições de LLM excedido. Tente novamente mais tarde.',
    });
  };
}
