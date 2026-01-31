import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for the DevBuddy agent.
 * This endpoint proxies requests from the frontend to the Algolia agent.
 * It ensures that Algolia credentials are kept secret and are not exposed to the browser.
 */
export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // These environment variables are required for the agent to work.
  const algoliaAppId = process.env.ALGOLIA_APP_ID;
  const algoliaApiKey = process.env.ALGOLIA_API_KEY;
  const algoliaAgentUrlEnv = process.env.ALGOLIA_AGENT_URL?.trim();

  if (!algoliaAppId || !algoliaApiKey) {
    console.error('Missing Algolia environment variables (APP_ID or API_KEY)');
    return NextResponse.json(
      { error: 'Server configuration error. Unable to process requests.' },
      { status: 500 }
    );
  }

  // Prefer an explicit ALGOLIA_AGENT_URL (recommended). If not set, fall back
  // to a sensible default that matches the expected Algolia agent-hosting pattern.
  let algoliaAgentUrl = algoliaAgentUrlEnv || `https://${algoliaAppId}.algolia.net/agent-studio/1/agents/chat`;

  // If the configured URL does not point to the completions endpoint, append it.
  if (!/\/completions/i.test(algoliaAgentUrl)) {
    // Use ai-sdk-4 compatibility by default when constructing the completions URL
    // since the `messages: [{ role: 'user', content: ... }]` shape maps to ai-sdk-4
    algoliaAgentUrl = algoliaAgentUrl.replace(/\/+$/,'') + '/completions?compatibilityMode=ai-sdk-4';
  }

  // Normalize URL and compatibility mode (force ai-sdk-4 for our message shape)
  try {
    const parsed = new URL(algoliaAgentUrl);
    const currentMode = parsed.searchParams.get('compatibilityMode');
    if (!currentMode) {
      parsed.searchParams.set('compatibilityMode', 'ai-sdk-4');
    } else if (currentMode.toLowerCase() === 'ai-sdk-5') {
      // If an env or URL explicitly uses ai-sdk-5, override to ai-sdk-4 to match our payload
      parsed.searchParams.set('compatibilityMode', 'ai-sdk-4');
    }
    algoliaAgentUrl = parsed.toString();
  } catch (err) {
    console.error('Invalid ALGOLIA_AGENT_URL:', algoliaAgentUrl, err);
    return NextResponse.json(
      { error: 'Invalid ALGOLIA_AGENT_URL environment variable.' },
      { status: 500 }
    );
  }

  try {
    // Add a timeout using AbortController to avoid hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s

    // Use the messages shape expected by the agent.
    const requestBody = { messages: [{ role: 'user', content: message }] };

    // Log the constructed URL and request body for debugging compatibility issues
    console.log('Proxying to Algolia Agent URL:', algoliaAgentUrl);
    console.log('Request body sample:', JSON.stringify(requestBody).slice(0, 200));

    const response = await fetch(algoliaAgentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': algoliaAppId,
        'X-Algolia-API-Key': algoliaApiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Algolia agent request failed:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Algolia authentication error. Check your ALGOLIA_API_KEY and ALGOLIA_APP_ID.' },
          { status: 401 }
        );
      }

      if (response.status === 422) {
        // Return upstream validation details to the client for debugging
        return NextResponse.json(
          { error: 'Agent rejected the input (422). See details.', detail: errorText },
          { status: 422 }
        );
      }

      if (errorText.includes('failed to resolve') || errorText.toLowerCase().includes('dns')) {
        return NextResponse.json(
          { error: `DNS resolution failed. Please verify your ALGOLIA_AGENT_URL or ALGOLIA_APP_ID.` },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: `Failed to get response from the agent. Status: ${response.status}`, detail: errorText },
        { status: response.status }
      );
    }

    // If the agent returns an SSE stream (text/event-stream), assemble the chunks
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/event-stream')) {
      const streamText = await response.text();

      // Assemble chunked lines like `0:"..."` into a full response string
      const lines = streamText.split(/\r?\n/);
      let assembled = '';
      for (const line of lines) {
        // match lines that start with a numeric prefix like `0:"..."` and extract inside quotes
        const m = line.match(/^\d+:(?:"([\s\S]*)"|(.*))/);
        if (m) {
          const chunk = m[1] ?? m[2] ?? '';
          // unescape common sequences
          assembled += chunk.replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }
      }

      // Trim trailing/leading whitespace
      assembled = assembled.trim();

      // Return in our frontend-friendly shape
      const mapped = {
        answer: { text: assembled },
        sources: [],
        raw_stream: streamText,
      };
      return NextResponse.json(mapped);
    }

    const data = await response.json();

    // Best-effort mapping of common completion shapes to our expected frontend shape
    if (!data || (!data.answer && !data.sources)) {
      // Common OpenAI-like shape
      const choiceText = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? data?.output?.[0]?.content?.[0]?.text;
      const sources = data?.sources ?? data?.results?.[0]?.sources ?? [];
      if (choiceText) {
        const mapped = {
          answer: { text: String(choiceText) },
          sources: Array.isArray(sources) ? sources : [],
          raw: data,
        };
        return NextResponse.json(mapped);
      }

      // If nothing map-able, return the raw data with a 502 status and provide diagnostics
      console.error('Unexpected agent response shape:', data);
      return NextResponse.json(
        { error: 'Received an invalid or unexpected response from the Algolia agent.', raw: data },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calling the Algolia agent:', error);

    // Handle timeout abort
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request to Algolia agent timed out.' },
        { status: 504 }
      );
    }

    // DNS ENOTFOUND
    if (error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: `DNS lookup failed for ${algoliaAgentUrl}. Please verify ALGOLIA_AGENT_URL and ALGOLIA_APP_ID.` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while contacting the agent.' },
      { status: 500 }
    );
  }
}
