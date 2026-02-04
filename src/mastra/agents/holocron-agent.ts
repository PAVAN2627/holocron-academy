import { Agent } from '@mastra/core/agent';
import { createAzure } from '@ai-sdk/azure';
import type { MastraModelConfig } from '@mastra/core/llm';

export const HOLOCRON_AGENT_ID = 'holocronAgent' as const;

let cachedModel: MastraModelConfig | null = null;

function normalizeAzureBaseURL(endpoint: string): string {
  // Supports both canonical Azure endpoints (e.g. `https://<resource>.openai.azure.com`) and
  // already-normalized values (e.g. `https://<resource>.openai.azure.com/openai` or
  // `https://<resource>.openai.azure.com/openai/v1`).
  let baseURL = endpoint.trim().replace(/\/+$/, '');

  if (baseURL.endsWith('/openai/v1')) {
    baseURL = baseURL.slice(0, -'/v1'.length);
  }

  if (!baseURL.endsWith('/openai')) {
    baseURL = `${baseURL}/openai`;
  }

  return baseURL;
}

function getAzureModel() {
  if (cachedModel) {
    return cachedModel;
  }

  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!apiKey || !endpoint || !deployment) {
    throw new Error('Azure OpenAI is not configured. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT.');
  }

  const azure = createAzure({
    apiKey,
    baseURL: normalizeAzureBaseURL(endpoint),
  });

  cachedModel = azure(deployment);
  return cachedModel;
}

export const holocronAgent = new Agent({
  id: HOLOCRON_AGENT_ID,
  name: 'Holocron Agent',
  instructions: [
    'You are Holocron Academy\'s AI tutor.',
    'Teach in a concise, interactive way.',
    'When appropriate, suggest practice activities the learner can do in the app.',
  ],
  model: getAzureModel,
});
