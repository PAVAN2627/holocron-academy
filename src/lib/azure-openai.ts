import { createAzure } from '@ai-sdk/azure';
import type { MastraModelConfig } from '@mastra/core/llm';
import { createHash } from 'crypto';

// Single-deployment Azure OpenAI config used by the @ai-sdk/azure provider.
// If you need multiple deployments, introduce a mapping layer instead of expanding this type.
type AzureOpenAIEnv = {
  apiKey: string;
  endpoint: string;
  deployment: string;
  resourceName: string;
};

function getAzureOpenAIEnv(): AzureOpenAIEnv {
  const apiKey = process.env.AZURE_OPENAI_KEY ?? process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Server misconfiguration: AZURE_OPENAI_KEY (preferred) or AZURE_OPENAI_API_KEY must be set.');
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (!endpoint) {
    throw new Error('Server misconfiguration: AZURE_OPENAI_ENDPOINT is not set.');
  }

  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!deployment) {
    throw new Error('Server misconfiguration: AZURE_OPENAI_DEPLOYMENT is not set.');
  }

  const resourceName = extractAzureResourceName(endpoint);

  return { apiKey, endpoint, deployment, resourceName };
}

function extractAzureResourceName(endpoint: string): string {
  let url: URL;
  try {
    url = new URL(endpoint.trim());
  } catch {
    throw new Error('Server misconfiguration: AZURE_OPENAI_ENDPOINT must be a valid URL.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Server misconfiguration: AZURE_OPENAI_ENDPOINT must use https.');
  }

  const hostname = url.hostname.toLowerCase();
  const match = hostname.match(/^([^.]+)\.openai\.azure\./);
  const resourceName = match?.[1];
  if (!resourceName) {
    throw new Error(
      "Server misconfiguration: AZURE_OPENAI_ENDPOINT must point to an Azure OpenAI resource (e.g. 'https://<resource>.openai.azure.com')."
    );
  }

  return resourceName;
}


function getApiKeyHash(apiKey: string): string {
  // Use a short, non-reversible hash of the API key in cache keys to avoid keeping
  // raw secrets in identifiers while still invalidating cache entries on key rotation.
  return createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
}

type AzureCacheKeyInput = Pick<AzureOpenAIEnv, 'apiKey' | 'deployment' | 'resourceName'>;

function getEnvCacheKey({ apiKey, deployment, resourceName }: AzureCacheKeyInput): string {
  return `${resourceName}::${deployment}::${getApiKeyHash(apiKey)}`;
}

let cachedModel: { cacheKey: string; model: MastraModelConfig } | null = null;

export function assertAzureOpenAIConfig(): void {
  // Validates Azure OpenAI env vars/endpoint shape.
  getAzureOpenAIEnv();
}

export async function resolveAzureOpenAIChatModel(): Promise<MastraModelConfig> {
  const env = getAzureOpenAIEnv();
  const cacheKey = getEnvCacheKey(env);

  if (cachedModel?.cacheKey === cacheKey) {
    return cachedModel.model;
  }

  const model = createAzure({
    apiKey: env.apiKey,
    resourceName: env.resourceName,
  }).chat(env.deployment);

  // MastraModelConfig accepts AI SDK language models; @ai-sdk/azure returns one here.

  cachedModel = { cacheKey, model };
  return model;
}
