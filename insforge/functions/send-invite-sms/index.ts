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
    const { phone, inviteCode, neighborhoodName, adminName, residentName } = body;

    if (!phone || !inviteCode) {
      return new Response(JSON.stringify({ error: 'Missing phone or inviteCode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const appLink = 'https://jeeraan.app/join'; // Placeholder for actual app join link
    const messageBody = `Hi ${residentName || 'Neighbor'}, this is your app Admin ${adminName || 'Bashir'} from ${neighborhoodName || 'LVW Neighborhood'}. You’re invited to join our neighborhood on Jeeraan — a private space for updates, discussions, and community decisions.\n\nCode: ${inviteCode} (valid for a limited time)\nJoin: ${appLink}`;

    // Mock SMS for development
    console.log(`[MOCK SMS] To: ${phone} | Body: ${messageBody}`);

    return new Response(JSON.stringify({ success: true, message: 'Invite sent (Mock)' }), {
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
