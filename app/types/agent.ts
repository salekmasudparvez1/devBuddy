/**
 * Agent Types
 * 
 * Defines types for Algolia Agent Studio API responses
 */

export interface AgentSource {
  path: string;
  type: string;
  link?: string;
}

export interface AgentResponse {
  answer: string;
  sources?: AgentSource[];
  references?: AgentSource[];
}

export interface StreamingChunk {
  type:
    | 'start'
    | 'start-step'
    | 'text-start'
    | 'text-delta'
    | 'text-end'
    | 'finish-step'
    | 'finish'
    | 'done';
  delta?: string;
  content?: string;
  answer?: string;
  message?: string;
  text?: string;
}

