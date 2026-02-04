/**
 * DevBuddy Backend API Route (Edge Runtime)
 * 
 * Proxies requests to Algolia Agent Studio REST API and forwards streaming responses
 * back to the frontend client for real-time message updates.
 * 
 * Environment Variables Required:
 * - ALGOLIA_AGENT_URL: The Agent Studio REST endpoint
 *   Example: https://agent.algolia.com/v1/instances/{instance-id}/responses
 * - ALGOLIA_API_KEY: API Key with access to Agent Studio
 * - ALGOLIA_APP_ID: Algolia application ID
 * 
 * Frontend expects SSE (Server-Sent Events) formatted responses with JSON payloads:
 * Format:
 *   data: {"type":"text-delta","delta":"Hello "}
 *   data: {"type":"text-delta","delta":"world"}
 *   data: [DONE]
 * 
 * The frontend streaming parser in hooks/useChat.tsx handles:
 * - text-delta: Appends text character-by-character for typing effect
 * - Other Algolia Agent Studio event types
 * - Fallback JSON parsing for non-streaming responses
 */

export const runtime = 'edge';

const ALGOLIA_AGENT_URL = process.env.ALGOLIA_AGENT_URL!;
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY!;
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID!;

/**
 * Format data as Server-Sent Events (SSE)
 * 
 * SSE format: "data: <json>\n\n"
 * Used to stream responses to the client incrementally
 */
function formatAsSSE(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * POST /api/devbuddy
 * 
 * Request body: { messages: Message[] }
 * 
 * Message structure:
 * {
 *   role: 'user' | 'assistant',
 *   parts: [ { type: 'text' | 'code', text: string } ]
 * }
 * 
 * Response: Server-Sent Events (SSE) stream with text-delta and source references
 */
export async function POST(req: Request) {
  try {
    // Parse incoming messages from frontend
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    /**
     * Forward to Algolia Agent Studio
     * 
     * The Agent Studio API expects:
     * - POST request with messages history
     * - Authentication via X-Algolia-API-Key and X-Algolia-Application-Id headers
     * - Optional 'stream: true' to enable streaming responses
     */
    const agentResponse = await fetch(ALGOLIA_AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Algolia Agent Studio authentication
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        // Accept event-stream for streaming support
        Accept: 'text/event-stream, application/json',
      },
      // Forward the conversation history
      // The Agent Studio will use context from all messages
      body: JSON.stringify({
        messages,
        stream: true, // Enable streaming for real-time responses
      }),
    });

    // Error handling: if Algolia API returns error, forward it
    if (!agentResponse.ok) {
      const text = await agentResponse.text();
      return new Response(
        JSON.stringify({ error: `Algolia API error: ${text}` }),
        { status: agentResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    /**
     * Check response content type to determine if streaming
     * 
     * If streaming (text/event-stream or chunked):
     *   - Forward the body directly to preserve streaming
     * If JSON:
     *   - Parse and convert to SSE format for consistent client parsing
     */
    const contentType = agentResponse.headers.get('content-type') || '';
    const isStreaming =
      contentType.includes('text/event-stream') ||
      contentType.includes('stream') ||
      contentType.includes('octet-stream');

    // If it's a streaming response, pipe it directly to the client
    if (agentResponse.body && isStreaming) {
      return new Response(agentResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    // Otherwise parse JSON and convert to SSE format
    try {
      const json = await agentResponse.json();

      // Extract the answer from various possible response structures
      let answer = '';
      if (typeof json === 'string') {
        answer = json;
      } else if (json.answer) {
        answer = json.answer;
      } else if (json.message) {
        answer = json.message;
      } else if (json.content) {
        answer = json.content;
      } else if (json.text) {
        answer = json.text;
      } else {
        answer = JSON.stringify(json);
      }

      /**
       * Convert JSON response to SSE format
       * 
       * Send the answer in chunks to simulate streaming:
       * 1. text-delta events for character-by-character typing
       * 2. [DONE] to signal completion
       * 
       * The frontend parser will reconstruct the full message
       */
      const body = new ReadableStream({
        start(controller) {
          // Send answer as text-delta events (more compatible with Algolia Agent Studio format)
          // Split into reasonable chunks for smoother streaming
          const chunkSize = 50; // characters per chunk
          for (let i = 0; i < answer.length; i += chunkSize) {
            const chunk = answer.substring(i, i + chunkSize);
            controller.enqueue(
              new TextEncoder().encode(
                formatAsSSE({ type: 'text-delta', delta: chunk })
              )
            );
          }

          // Send completion marker
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    } catch (parseError) {
      // Fallback: if JSON parsing fails, send response as text
      const txt = await agentResponse.text();
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              formatAsSSE({ type: 'text-delta', delta: txt })
            )
          );
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }
  } catch (error: any) {
    console.error('DevBuddy API Error:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown server error',
        details: 'Check that ALGOLIA_AGENT_URL, ALGOLIA_API_KEY, and ALGOLIA_APP_ID environment variables are configured.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
