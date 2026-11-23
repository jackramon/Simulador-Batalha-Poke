import { describe, expect, it } from 'vitest';
import {
  createLlmModelPolicy,
  isOpenRouterModelFree,
  parsePaidModelAllowlist,
} from '../../server/modelPolicy';

describe('política de modelos do proxy de LLM', () => {
  const policy = createLlmModelPolicy();

  it('preserva os modelos gratuitos e os fallbacks atuais', () => {
    for (const model of [
      'google/gemini-2.5-flash:free',
      'meta-llama/llama-3-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'microsoft/phi-3-medium-128k-instruct:free',
    ]) {
      expect(policy.isAllowed('openrouter', model)).toBe(true);
    }

    expect(policy.isAllowed('gemini', 'gemini-2.5-flash')).toBe(true);
    expect(policy.isAllowed('deepseek', 'deepseek-chat')).toBe(true);
  });

  it('bloqueia modelo pago fora da allowlist explícita', () => {
    expect(policy.isAllowed('openrouter', 'openai/gpt-4o')).toBe(false);
    expect(policy.isAllowed('gemini', 'gemini-2.5-ultra')).toBe(false);
    expect(policy.isAllowed('deepseek', 'deepseek-reasoner')).toBe(false);
  });

  it('aceita modelo pago adicionado pela configuração', () => {
    const expanded = createLlmModelPolicy(
      parsePaidModelAllowlist('openrouter:openai/gpt-4o, gemini:gemini-2.5-pro, inválido'),
    );

    expect(expanded.isAllowed('openrouter', 'openai/gpt-4o')).toBe(true);
    expect(expanded.isAllowed('gemini', 'gemini-2.5-pro')).toBe(true);
    expect(expanded.isAllowed('openrouter', 'anthropic/claude-3.5-sonnet')).toBe(false);
  });

  it('aplica o mesmo filtro às escolhas do cliente e aos fallbacks', () => {
    const candidates = [
      'google/gemini-2.5-flash:free',
      'openai/gpt-4o',
      'meta-llama/llama-3-8b-instruct:free',
    ];

    expect(policy.filterAllowed('openrouter', candidates)).toEqual([
      'google/gemini-2.5-flash:free',
      'meta-llama/llama-3-8b-instruct:free',
    ]);
    expect(policy.filterAllowed('openrouter', ['openai/gpt-4o'])).toEqual([]);
  });

  it('reconhece modelos gratuitos sem sufixo apenas após verificação no catálogo', () => {
    const dynamicPolicy = createLlmModelPolicy();
    const model = 'vendor/modelo-verificado';

    expect(dynamicPolicy.isAllowed('openrouter', model)).toBe(false);
    dynamicPolicy.registerOpenRouterFreeModels([model]);
    expect(dynamicPolicy.isAllowed('openrouter', model)).toBe(true);
  });

  it('não classifica como gratuito um modelo com saída paga', () => {
    expect(
      isOpenRouterModelFree({
        id: 'vendor/modelo-saida-paga',
        pricing: { prompt: '0', completion: '0.01' },
      }),
    ).toBe(false);
    expect(
      isOpenRouterModelFree({
        id: 'vendor/modelo-gratuito',
        pricing: { prompt: '0', completion: '0' },
      }),
    ).toBe(true);
    expect(isOpenRouterModelFree({ id: 'vendor/modelo:free' })).toBe(true);
  });
});
