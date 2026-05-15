// Mock — tests don't exercise the model, only the tool plumbing.
export class CactusLM {
  constructor(public params: unknown) {}
  async download(): Promise<void> {}
  async init(): Promise<void> {}
  async complete(): Promise<unknown> {
    throw new Error('CactusLM.complete called in test — mock it explicitly');
  }
}

export type CactusLMTool = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
};

export type CactusLMMessage = {
  role: 'system' | 'user' | 'assistant';
  content?: string;
  images?: string[];
};

export type CactusLMCompleteResult = {
  success: boolean;
  response: string;
  functionCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  cloudHandoff?: boolean;
  confidence?: number;
  timeToFirstTokenMs: number;
  totalTimeMs: number;
  prefillTokens: number;
  prefillTps: number;
  decodeTokens: number;
  decodeTps: number;
  totalTokens: number;
  ramUsageMb?: number;
};
