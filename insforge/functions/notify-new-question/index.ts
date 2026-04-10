import { createClient } from 'npm:@insforge/sdk';

export default async function(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { questionId, neighborhoodId, memberName, questionSnippet } = body;

    if (!questionId || !neighborhoodId) {
      return new Response(JSON.stringify({ error: 'Missing questionId or neighborhoodId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const messageBody = `A new question has been submitted by ${memberName || 'a member'}: "${questionSnippet || '...'}" (ID: ${questionId}). Log in to the Admin Dashboard to respond.`;
    
    // In a real app, we'd send push notifications or SMS to all admins of this neighborhood.
    // For MVP, we'll just mock it.
    console.log(`[NOTIFY ADMIN] Neighborhood: ${neighborhoodId} | Body: ${messageBody}`);

    return new Response(JSON.stringify({ success: true, message: 'Admin notification sent (Mock)' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
