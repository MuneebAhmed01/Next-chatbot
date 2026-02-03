export const AVAILABLE_MODELS = [
  {
    id: 'stepfun/step-3.5-flash:free',
    name: 'Step 3.5 Flash',
    provider: 'StepFun',
    description: 'Fast and efficient free model'
  },
  {
    id: 'arcee-ai/trinity-large-preview:free',
    name: 'Trinity Large',
    provider: 'Arcee AI',
    description: 'Large preview model for complex tasks'
  },
  {
    id: 'upstage/solar-pro-3:free',
    name: 'Solar Pro 3',
    provider: 'Upstage',
    description: 'Professional grade solar model'
  },

  {
    id: 'allenai/molmo-2-8b:free',
    name: 'Molmo 2 8B',
    provider: 'AllenAI',
    description: 'Multimodal open language model'
  },
  {
    id: 'tngtech/tng-r1t-chimera:free',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    description: 'Hybrid reasoning model'
  },
  {
    id: 'tngtech/deepseek-r1t-chimera:free',
    name: 'DeepSeek R1T Chimera',
    provider: 'TNG Tech',
    description: 'Advanced hybrid reasoning model'
  },

  {
    id: 'nousresearch/hermes-3-llama-3.1-405b',
    name: 'Hermes 3 405B',
    provider: 'Nous Research',
    description: 'Large 405B parameter model'
  }
];

export const DEFAULT_MODEL = 'stepfun/step-3.5-flash:free';

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];
