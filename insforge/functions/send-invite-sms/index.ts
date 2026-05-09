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
      let { phone, inviteCode, neighborhoodName, adminName, residentName } = body;

      if (!phone) {
        return new Response(JSON.stringify({ error: 'Missing phone number' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Basic phone sanitization for Twilio (E.164)
      // Strip non-numeric except leading +
      const cleanedPhone = phone.replace(/[^\d+]/g, '');
      const finalPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;
      console.log(`[SANITY CHECK] Original: ${phone} | Cleaned: ${finalPhone}`);
      phone = finalPhone;

      // Twilio Configuration (Should be set as Secrets in InsForge project)
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || Deno.env.get('TWILIO_PHONE_NUMBER');
    const twilioVerifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    // Default join link - should ideally be a deep link or web landing page
    const appLink = 'https://jeeraan.app/join'; 
    
    const messageBody = `Hi ${residentName || 'Neighbor'}, this is your app Admin ${adminName || 'Bashir'} from ${neighborhoodName || 'LVW Neighborhood'}.
You’re invited to join our neighborhood on Jeeraan — a private space for updates, discussions, and community decisions.

Code: ${inviteCode} (valid for a limited time)
Join: ${appLink}`;

    if (twilioAccountSid && twilioAuthToken && (twilioVerifySid || twilioFromNumber)) {
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
      let twilioResponse;
      let twilioData;

      if (twilioVerifySid) {
        console.log(`[TWILIO VERIFY] Attempting to start verification for: ${phone}`);
        const verifyUrl = `https://verify.twilio.com/v2/Services/${twilioVerifySid}/Verifications`;
        
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('Channel', 'sms');

        twilioResponse = await fetch(verifyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
      } else {
        console.log(`[TWILIO MESSAGES] Attempting to send SMS to: ${phone}`);
        const messagesUrl = `https://api.twilio.org/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('From', twilioFromNumber!);
        params.append('Body', messageBody);

        twilioResponse = await fetch(messagesUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
      }

      console.log(`[TWILIO RESPONSE STATUS] HTTP ${twilioResponse.status}`);
      twilioData = await twilioResponse.json();

      if (!twilioResponse.ok) {
        console.error('[TWILIO ERROR RESPONSE]', JSON.stringify(twilioData, null, 2));
        throw new Error(twilioData.message || `Twilio API returned ${twilioResponse.status}: ${JSON.stringify(twilioData)}`);
      }

      console.log(`[TWILIO SUCCESS] SID: ${twilioData.sid} | Status: ${twilioData.status}`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: twilioVerifySid ? 'Verification started via Twilio Verify' : 'Invite sent successfully via Twilio Messages',
        sid: twilioData.sid 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Fallback for development/missing config
      console.warn('[MISSING TWILIO CONFIG] SMS not sent. Logging to console instead.');
      console.log(`[MOCK SMS] To: ${phone} | Body: ${messageBody}`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Invite logged to console (Twilio config missing)',
        mock: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
