import { Agent } from '@mastra/core/agent';

import { getAzureOpenAIChatModel } from '@/lib/azure-openai';

export const HOLOCRON_AGENT_ID = 'holocronAgent' as const;

export const holocronAgent = new Agent({
  id: HOLOCRON_AGENT_ID,
  name: 'Holocron Agent',
  instructions: [
    'You are Holocron Academy\'s AI tutor.',
    'Teach in a concise, interactive way.',
    'When appropriate, suggest practice activities the learner can do in the app.',
  ],
  model: getAzureOpenAIChatModel,
});
