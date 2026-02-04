import { AgentSource } from "../types/agent";

export function parseStreaming(content: string) {
    const sourcesMatch = content.match(/<sources>([\s\S]*)<\/sources>/);
    const sources: AgentSource[] = sourcesMatch
      ? JSON.parse(sourcesMatch[1])
      : [];
  
    const answer = content.replace(/<sources>[\s\S]*<\/sources>/, '').trim();
  
    return { sources, answer };
}

export function parseStreamingJson(content: string) {
    try {
        return JSON.parse(content);
    } catch (e) {
        return {};
    }
}
