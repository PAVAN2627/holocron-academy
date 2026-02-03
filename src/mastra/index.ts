import { Mastra } from '@mastra/core';

import { holocronAgent } from './agents/holocron-agent';

export const mastra = new Mastra({
  agents: { holocronAgent },
});
