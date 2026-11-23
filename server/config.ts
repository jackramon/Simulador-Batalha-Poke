import { parsePaidModelAllowlist } from './modelPolicy';

export interface ServerConfig {
  host: string;
  port: number;
  rateLimit: {
    max: number;
    windowMs: number;
  };
  requestTimeoutMs: number;
  paidModelAllowlist: string[];
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    // O proxy só é exposto na rede quando LLM_PROXY_HOST é definido explicitamente.
    host: env.LLM_PROXY_HOST?.trim() || '127.0.0.1',
    port: positiveInteger(env.PORT, 3000),
    rateLimit: {
      max: positiveInteger(env.LLM_RATE_LIMIT_MAX, 60),
      windowMs: positiveInteger(env.LLM_RATE_LIMIT_WINDOW_MS, 60_000),
    },
    requestTimeoutMs: positiveInteger(env.LLM_REQUEST_TIMEOUT_MS, 30_000),
    paidModelAllowlist: parsePaidModelAllowlist(env.LLM_ALLOWED_PAID_MODELS),
  };
}
