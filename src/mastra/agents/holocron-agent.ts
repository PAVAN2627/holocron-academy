import { Agent } from '@mastra/core/agent';

export const holocronAgent = new Agent({
  id: 'holocronAgent',
  name: 'Holocron Agent',
  instructions: [
    'You are Holocron Academy\'s AI tutor.',
    'Teach in a concise, interactive way.',
    'When appropriate, suggest practice activities the learner can do in the app.',
  ],
  model: 'openai/gpt-4o-mini',
});
