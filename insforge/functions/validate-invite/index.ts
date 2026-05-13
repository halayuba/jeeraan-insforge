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
    const { code, phone } = body;

    if (!code || !phone) {
      return new Response(JSON.stringify({ error: 'Missing code or phone' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Invite] Validating for phone: ${phone}, code: ${code}`);

    // Robust phone sanitization for Twilio (E.164)
    let sanitizedPhone = phone.replace(/[^\d+]/g, '');
    if (!sanitizedPhone.startsWith('+')) {
      // Default to US (+1) if it looks like a 10-digit number
      if (sanitizedPhone.length === 10) {
        sanitizedPhone = '+1' + sanitizedPhone;
      } else {
        sanitizedPhone = '+' + sanitizedPhone;
      }
    }
    console.log(`[Invite] Sanitized phone: ${sanitizedPhone}`);

    // Initialize SDK with admin key to allow background table access
    const insforgeUrl = Deno.env.get('INSFORGE_URL') || '';
    const insforgeKey = Deno.env.get('INSFORGE_SERVICE_KEY') || ''; // Assuming service key is available for Edge Functions

    const insforge = createClient({
      baseUrl: insforgeUrl,
      anonKey: insforgeKey,
    });

    // 1. Check if user already exists in ANY neighborhood with this phone number
    const { data: existingProfile, error: profileError } = await insforge.database
      .from('user_profiles')
      .select('user_id')
      .eq('phone', sanitizedPhone)
      .maybeSingle();

    if (existingProfile) {
      console.log(`[Invite] User with phone ${sanitizedPhone} already exists (user_id: ${existingProfile.user_id})`);
      const { data: existingMembership, error: membershipError } = await insforge.database
        .from('user_neighborhoods')
        .select('neighborhood_id')
        .eq('user_id', existingProfile.user_id)
        .limit(1)
        .maybeSingle();

      if (existingMembership) {
        console.warn(`[Invite] User already belongs to neighborhood: ${existingMembership.neighborhood_id}`);
        return new Response(JSON.stringify({ 
          error: 'User already belongs to a neighborhood.',
          code: 'ALREADY_MEMBER'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. Validate the invite code
    const twilioVerifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    let invite;
    let inviteError;

    if (twilioVerifySid && twilioAccountSid && twilioAuthToken) {
      console.log(`[TWILIO VERIFY] Checking code for: ${sanitizedPhone}`);
      const verifyUrl = `https://verify.twilio.com/v2/Services/${twilioVerifySid}/VerificationCheck`;
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
      
      const params = new URLSearchParams();
      params.append('To', sanitizedPhone);
      params.append('Code', code);

      const twilioResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const twilioData = await twilioResponse.json();

      if (!twilioResponse.ok || twilioData.status !== 'approved') {
        console.warn(`[TWILIO VERIFY] Failed: ${twilioData.status || twilioResponse.status}, message: ${twilioData.message}`);
        return new Response(JSON.stringify({ 
          error: 'Invalid or expired verification code.',
          twilioError: twilioData.message,
          twilioStatus: twilioResponse.status,
          twilioDataStatus: twilioData.status
        }), {
          status: 400, // Changed from 401 to 400 to avoid confusion with InsForge 401
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('[TWILIO VERIFY] Approved! Looking for invite record in DB...');
      // If code is valid, find the matching invite in the DB by phone
      const { data: dbInvite, error: dbError } = await insforge.database
        .from('invites')
        .select('*')
        .eq('phone', sanitizedPhone)
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      invite = dbInvite;
      inviteError = dbError;
    } else {
      console.log('[Invite] Twilio not configured, falling back to DB validation');
      // Fallback to database-only validation
      const { data: dbInvite, error: dbError } = await insforge.database
        .from('invites')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('phone', sanitizedPhone)
        .maybeSingle();
      
      invite = dbInvite;
      inviteError = dbError;
    }

    if (inviteError) {
      console.error('[Invite] DB Error:', inviteError);
    }

    if (!invite) {
      console.warn(`[Invite] No active invite found for phone: ${sanitizedPhone}`);
      return new Response(JSON.stringify({ error: 'Invalid or expired invite code.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (invite.used_at) {
      return new Response(JSON.stringify({ error: 'Invite code already used.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return new Response(JSON.stringify({ error: 'Invite code has expired.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Invite is valid!
    return new Response(JSON.stringify({ 
      success: true, 
      invite: {
        id: invite.id,
        code: invite.code,
        neighborhood_id: invite.neighborhood_id,
        phone: invite.phone
      }
    }), {
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
