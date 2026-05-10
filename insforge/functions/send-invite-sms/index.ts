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

    console.log(`[SMS] Processing invite for ${phone}. Code: ${inviteCode}`);

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Missing phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Basic phone sanitization for Twilio (E.164)
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    const finalPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;
    phone = finalPhone;

    // Twilio Configuration
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || Deno.env.get('TWILIO_PHONE_NUMBER');
    // NOTE: We prioritize Twilio Messages over Twilio Verify for custom invite codes
    const twilioVerifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    const appLink = 'https://jeeraan.app/join'; 
    
    const messageBody = `Hi ${residentName || 'Neighbor'}, this is your app Admin ${adminName || 'Bashir'} from ${neighborhoodName || 'LVW Neighborhood'}.
You’re invited to join our neighborhood on Jeeraan — a private space for updates, discussions, and community decisions.

Code: ${inviteCode} (valid for a limited time)
Join: ${appLink}`;

    if (twilioAccountSid && twilioAuthToken) {
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
      
      // If we have an inviteCode, we MUST use Twilio Messages to send it.
      // Twilio Verify generates its own codes, so it's not suitable here.
      if (twilioFromNumber) {
        console.log(`[TWILIO MESSAGES] Attempting to send SMS to: ${phone} from ${twilioFromNumber}`);
        const messagesUrl = `https://api.twilio.org/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('From', twilioFromNumber);
        params.append('Body', messageBody);

        const twilioResponse = await fetch(messagesUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        const twilioData = await twilioResponse.json();
        console.log(`[TWILIO RESPONSE] HTTP ${twilioResponse.status}:`, JSON.stringify(twilioData));

        if (!twilioResponse.ok) {
          throw new Error(twilioData.message || `Twilio API returned ${twilioResponse.status}`);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Invite sent successfully via Twilio Messages',
          sid: twilioData.sid 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (twilioVerifySid) {
        // Fallback to Twilio Verify if no phone number is provided but Verify SID exists
        // Note: This will NOT send the inviteCode provided in the body
        console.log(`[TWILIO VERIFY] Attempting to start verification for: ${phone}`);
        const verifyUrl = `https://verify.twilio.com/v2/Services/${twilioVerifySid}/Verifications`;
        
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('Channel', 'sms');

        const twilioResponse = await fetch(verifyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        const twilioData = await twilioResponse.json();
        console.log(`[TWILIO RESPONSE] HTTP ${twilioResponse.status}:`, JSON.stringify(twilioData));

        if (!twilioResponse.ok) {
          throw new Error(twilioData.message || `Twilio API returned ${twilioResponse.status}`);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Verification started via Twilio Verify (Warning: Custom code not sent)',
          sid: twilioData.sid 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error('Twilio configuration incomplete (missing TWILIO_FROM_NUMBER or TWILIO_VERIFY_SERVICE_SID)');
      }
    } else {
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
