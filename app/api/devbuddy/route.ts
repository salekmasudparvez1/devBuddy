
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

  if (!algoliaAppId || !algoliaApiKey) {
    console.error('Missing Algolia environment variables (APP_ID or API_KEY)');
    return NextResponse.json(
      { error: 'Server configuration error. Unable to process requests.' },
      { status: 500 }
    );
  }

  // Construct the URL dynamically to prevent DNS errors.
  // This simplified URL removes the region, which may be causing resolution issues.
  const algoliaAgentUrl = `https://${algoliaAppId}.agents.algolia.net/1/agents/chat`;

  try {
    // Forward the user's message to the Algolia agent.
    const response = await fetch(algoliaAgentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': algoliaAppId,
        'X-Algolia-API-Key': algoliaApiKey,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Algolia agent request failed:', errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Algolia authentication error. Check your ALGOLIA_API_KEY and ALGOLIA_APP_ID.' },
          { status: 401 }
        );
      }
      
      // The DNS error from the user log indicates a bad APP_ID. 
      // If the request fails, it's likely the App ID is incorrect.
      if (errorText.includes("failed to resolve")) {
          return NextResponse.json(
            { error: `DNS resolution failed. Please verify that your ALGOLIA_APP_ID is correct and the region is right for your app.`},
            { status: 502 } // Bad Gateway
          );
      }

      return NextResponse.json(
        { error: `Failed to get response from the agent. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // It's good practice to validate the shape of the response from the agent
    if (!data || !data.answer || !Array.isArray(data.sources)) {
      console.error('Unexpected agent response shape:', data);
      return NextResponse.json(
        { error: 'Received an invalid or unexpected response from the Algolia agent.' },
        { status: 502 } // Bad Gateway - indicates an issue with the upstream service response
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calling the Algolia agent:', error);
    
    // If the fetch itself fails due to DNS, catch it here
    if (error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === 'ENOTFOUND') {
        return NextResponse.json(
            { error: `DNS lookup failed for ${algoliaAgentUrl}. Please verify your ALGOLIA_APP_ID.`},
            { status: 502 }
        );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while contacting the agent.' },
      { status: 500 }
    );
  }
}
