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
      .eq('phone', phone)
      .single();

    if (existingProfile) {
      const { data: existingMembership, error: membershipError } = await insforge.database
        .from('user_neighborhoods')
        .select('neighborhood_id')
        .eq('user_id', existingProfile.user_id)
        .limit(1)
        .single();

      if (existingMembership) {
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
    const { data: invite, error: inviteError } = await insforge.database
      .from('invites')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('phone', phone)
      .single();

    if (inviteError || !invite) {
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
