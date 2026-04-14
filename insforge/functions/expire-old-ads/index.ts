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
    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('API_KEY') || '',
    });

    const now = new Date().toISOString();

    // 1. Find and update expired ads
    const { data, error, count } = await insforge.database
      .from('classified_ads')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', now)
      .select('id');

    if (error) throw error;

    console.log(`Successfully expired ${data?.length || 0} ads.`);

    return new Response(JSON.stringify({ 
      success: true, 
      expired_count: data?.length || 0,
      expired_ids: data?.map(ad => ad.id)
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Expiry cron error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
