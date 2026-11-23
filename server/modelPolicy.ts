export type LlmProvider = 'gemini' | 'openrouter' | 'deepseek';

const PROVIDERS = new Set<LlmProvider>(['gemini', 'openrouter', 'deepseek']);

// Modelos gratuitos mantidos para preservar os fallbacks e escolhas atuais.
const FREE_MODELS = new Set([
  'gemini:gemini-2.5-flash',
  'openrouter:google/gemini-2.5-flash:free',
  'openrouter:meta-llama/llama-3-8b-instruct:free',
  'openrouter:mistralai/mistral-7b-instruct:free',
  'openrouter:google/gemma-2-9b-it:free',
  'openrouter:qwen/qwen-2-7b-instruct:free',
  'openrouter:microsoft/phi-3-medium-128k-instruct:free',
]);

// Os únicos modelos pagos já oferecidos pelo aplicativo. Qualquer outro exige configuração.
const BASELINE_PAID_MODELS = new Set([
  'gemini:gemini-2.5-pro',
  'openrouter:deepseek/deepseek-chat',
  'deepseek:deepseek-chat',
]);

function modelKey(provider: LlmProvider, model: string): string {
  return `${provider}:${model}`;
}

export function parsePaidModelAllowlist(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const parsed: string[] = [];
  for (const entry of value.split(',')) {
    const separator = entry.indexOf(':');
    if (separator <= 0) {
      continue;
    }

    const provider = entry.slice(0, separator).trim().toLowerCase() as LlmProvider;
    const model = entry.slice(separator + 1).trim();
    if (!PROVIDERS.has(provider) || !model) {
      continue;
    }

    const key = modelKey(provider, model);
    if (!parsed.includes(key)) {
      parsed.push(key);
    }
  }

  return parsed;
}

export function isOpenRouterModelFree(model: {
  id: string;
  pricing?: { prompt?: string; completion?: string };
}): boolean {
  return (
    model.id.endsWith(':free') ||
    Boolean(
      model.pricing &&
        parseFloat(model.pricing.prompt ?? '') === 0 &&
        parseFloat(model.pricing.completion ?? '') === 0,
    )
  );
}

export interface LlmModelPolicy {
  readonly allowedPaidModels: ReadonlySet<string>;
  registerOpenRouterFreeModels(models: Iterable<string>): void;
  isAllowed(provider: LlmProvider, model: string): boolean;
  filterAllowed(provider: LlmProvider, models: readonly string[]): string[];
}

export function createLlmModelPolicy(extraPaidModels: Iterable<string> = []): LlmModelPolicy {
  const allowedPaidModels = new Set(BASELINE_PAID_MODELS);
  for (const entry of extraPaidModels) {
    const [provider, ...modelParts] = entry.trim().split(':');
    const model = modelParts.join(':').trim();
    if (PROVIDERS.has(provider as LlmProvider) && model) {
      allowedPaidModels.add(modelKey(provider as LlmProvider, model));
    }
  }

  // Modelos sem o sufixo :free só entram após o catálogo confirmar preço zero.
  const verifiedFreeOpenRouterModels = new Set<string>();

  const isAllowed = (provider: LlmProvider, model: string): boolean => {
    if (!PROVIDERS.has(provider) || !model) {
      return false;
    }

    const normalizedModel = model.trim();
    const key = modelKey(provider, normalizedModel);
    if (provider === 'openrouter' && normalizedModel.endsWith(':free')) {
      return true;
    }
    if (provider === 'openrouter' && verifiedFreeOpenRouterModels.has(normalizedModel)) {
      return true;
    }

    return FREE_MODELS.has(key) || allowedPaidModels.has(key);
  };

  return {
    allowedPaidModels,
    registerOpenRouterFreeModels(models) {
      for (const model of models) {
        if (model) {
          verifiedFreeOpenRouterModels.add(model);
        }
      }
    },
    isAllowed,
    filterAllowed(provider, models) {
      return models.filter((model) => isAllowed(provider, model));
    },
  };
}
