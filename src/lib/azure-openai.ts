import { createAzure } from '@ai-sdk/azure';
import type { MastraModelConfig } from '@mastra/core/llm';

type AzureOpenAIEnv = {
  apiKey: string;
  endpoint: string;
  deployment: string;
};

function getAzureOpenAIEnv(): AzureOpenAIEnv {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Server misconfiguration: AZURE_OPENAI_API_KEY is not set.');
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (!endpoint) {
    throw new Error('Server misconfiguration: AZURE_OPENAI_ENDPOINT is not set.');
  }

  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!deployment) {
    throw new Error('Server misconfiguration: AZURE_OPENAI_DEPLOYMENT is not set.');
  }

  return { apiKey, endpoint, deployment };
}

function normalizeAzureBaseURL(endpoint: string): string {
  let url: URL;
  try {
    url = new URL(endpoint.trim());
  } catch {
    throw new Error('Server misconfiguration: AZURE_OPENAI_ENDPOINT must be a valid URL.');
  }

  const path = url.pathname.replace(/\/+$/, '');

  if (path === '' || path === '/') {
    url.pathname = '/openai';
  } else if (path === '/openai' || path === '/openai/v1') {
    url.pathname = '/openai';
  } else {
    throw new Error(
      "Server misconfiguration: AZURE_OPENAI_ENDPOINT must be the Azure resource URL (e.g. 'https://<resource>.openai.azure.com') or include only '/openai' or '/openai/v1'.",
    );
  }

  return url.toString().replace(/\/+$/, '');
}

let cachedModel: { cacheKey: string; model: MastraModelConfig } | null = null;

export function assertAzureOpenAIConfig(): void {
  const { endpoint } = getAzureOpenAIEnv();
  normalizeAzureBaseURL(endpoint);
}

export function getAzureOpenAIChatModel(): MastraModelConfig {
  const { apiKey, endpoint, deployment } = getAzureOpenAIEnv();
  const cacheKey = `${endpoint}::${deployment}::${apiKey}`;

  if (cachedModel?.cacheKey === cacheKey) {
    return cachedModel.model;
  }

  const azure = createAzure({
    apiKey,
    baseURL: normalizeAzureBaseURL(endpoint),
  });

  const model = azure(deployment);
  cachedModel = { cacheKey, model };
  return model;
}
