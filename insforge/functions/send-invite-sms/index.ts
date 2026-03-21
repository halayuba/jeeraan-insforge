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
    const { phone, inviteCode, neighborhoodName } = body;

    if (!phone || !inviteCode) {
      return new Response(JSON.stringify({ error: 'Missing phone or inviteCode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // We can verify the admin token here using Supabase auth if needed, but assuming standard edge function auth handles it.
    // Or we just verify that the request has a valid authorization header.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    /*
    // Attempt to use Twilio if configured
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

    const messageBody = `You have been invited to join ${neighborhoodName || 'the neighborhood'} on Jeeraan! Your invite code is: ${inviteCode}. It expires in 24 hours.`;

    if (twilioSid && twilioToken && twilioFrom) {
      // Send real SMS
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const formData = new URLSearchParams();
      formData.append('To', phone);
      formData.append('From', twilioFrom);
      formData.append('Body', messageBody);

      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!twilioRes.ok) {
        const err = await twilioRes.text();
        console.error('Twilio error:', err);
        return new Response(JSON.stringify({ error: 'Failed to send SMS via provider' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Mock SMS for development
      console.log(`[MOCK SMS] To: ${phone} | Body: ${messageBody}`);
    }
    */
    const messageBody = `You have been invited to join ${neighborhoodName || 'the neighborhood'} on Jeeraan! Your invite code is: ${inviteCode}. It expires in 24 hours.`;
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
