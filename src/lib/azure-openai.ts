import { AzureOpenAIGateway } from '@mastra/core/llm';
import type { MastraModelConfig } from '@mastra/core/llm';
import { createHash } from 'crypto';

type AzureOpenAIEnv = {
  apiKey: string;
  endpoint: string;
  apiVersion: string;
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

  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  if (!apiVersion) {
    throw new Error('Server misconfiguration: AZURE_OPENAI_API_VERSION is not set.');
  }

  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!deployment) {
    throw new Error('Server misconfiguration: AZURE_OPENAI_DEPLOYMENT is not set.');
  }

  const resourceName = extractAzureResourceName(endpoint);

  return { apiKey, endpoint, apiVersion, deployment, resourceName };
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

let cachedGateway: { cacheKey: string; gateway: AzureOpenAIGateway } | null = null;
let cachedModel: { cacheKey: string; model: MastraModelConfig } | null = null;

function getApiKeyHash(apiKey: string): string {
  // Use a short, non-reversible hash of the API key in cache keys to avoid keeping
  // raw secrets in identifiers while still invalidating cache entries on key rotation.
  return createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
}

type AzureCacheKeyInput = Pick<AzureOpenAIEnv, 'apiKey' | 'apiVersion' | 'deployment' | 'resourceName'>;

function getEnvCacheKey({ apiKey, apiVersion, deployment, resourceName }: AzureCacheKeyInput): string {
  return `${resourceName}::${apiVersion}::${deployment}::${getApiKeyHash(apiKey)}`;
}

function getAzureOpenAIGatewayFromEnv({ apiKey, apiVersion, deployment, resourceName }: AzureOpenAIEnv): AzureOpenAIGateway {
  const cacheKey = getEnvCacheKey({ apiKey, apiVersion, deployment, resourceName });

  if (cachedGateway?.cacheKey === cacheKey) {
    return cachedGateway.gateway;
  }

  const gateway = new AzureOpenAIGateway({
    apiKey,
    resourceName,
    apiVersion,
    deployments: [deployment],
  });

  cachedGateway = { cacheKey, gateway };
  return gateway;
}

export function assertAzureOpenAIConfig(): void {
  // Validates Azure OpenAI env vars/endpoint shape and ensures the gateway is constructible.
  const env = getAzureOpenAIEnv();
  getAzureOpenAIGatewayFromEnv(env);
}

export function getAzureOpenAIGateway(): AzureOpenAIGateway {
  return getAzureOpenAIGatewayFromEnv(getAzureOpenAIEnv());
}

export async function resolveAzureOpenAIChatModel(): Promise<MastraModelConfig> {
  const env = getAzureOpenAIEnv();
  const cacheKey = getEnvCacheKey(env);

  if (cachedModel?.cacheKey === cacheKey) {
    return cachedModel.model;
  }

  const gateway = getAzureOpenAIGatewayFromEnv(env);
  const model = await gateway.resolveLanguageModel({
    apiKey: env.apiKey,
    providerId: gateway.id,
    modelId: env.deployment,
  });
  cachedModel = { cacheKey, model };
  return model;
}
