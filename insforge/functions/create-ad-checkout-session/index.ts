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
    const { userId, neighborhoodId, price, adTitle } = body;

    if (!userId || !neighborhoodId || price === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('API_KEY') || '',
    });

    // 1. Check if monetization is enabled
    const { data: settings, error: settingsError } = await insforge.database
      .from('neighborhood_settings')
      .select('*')
      .eq('neighborhood_id', neighborhoodId)
      .maybeSingle();

    if (settingsError) throw settingsError;
    const isMonetizationEnabled = settings?.classifieds_monetization_enabled ?? false;

    // 2. Check user role and limits
    const { data: userNeighborhood, error: roleError } = await insforge.database
      .from('user_neighborhoods')
      .select('role')
      .eq('user_id', userId)
      .eq('neighborhood_id', neighborhoodId)
      .maybeSingle();

    if (roleError || !userNeighborhood) throw new Error('User not found in neighborhood');

    const role = userNeighborhood.role;
    let limit = 5;
    if (role === 'admin') limit = settings?.max_ads_admin ?? 20;
    else if (role === 'moderator') limit = settings?.max_ads_moderator ?? 10;
    else limit = settings?.max_ads_resident ?? 5;

    const { count, error: countError } = await insforge.database
      .from('classified_ads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('neighborhood_id', neighborhoodId)
      .eq('status', 'active');

    if (countError) throw countError;
    if ((count || 0) >= limit) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `You have reached your limit of ${limit} active ads.` 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Calculate Fee
    let fee = 0;
    if (isMonetizationEnabled) {
      const p = Number(price);
      if (p <= 100) fee = 0;
      else if (p <= 200) fee = 5;
      else if (p <= 300) fee = 10;
      else if (p <= 400) fee = 15;
      else if (p <= 500) fee = 20;
      else fee = Number((p * 0.05).toFixed(2));
    }

    if (fee === 0) {
      return new Response(JSON.stringify({
        success: true,
        fee: 0,
        requires_payment: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Create Stripe Payment Intent via fetch
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    const params = new URLSearchParams();
    params.append('amount', Math.round(fee * 100).toString());
    params.append('currency', 'usd');
    params.append('metadata[userId]', userId);
    params.append('metadata[neighborhoodId]', neighborhoodId);
    params.append('metadata[adTitle]', adTitle || 'Classified Ad');
    params.append('automatic_payment_methods[enabled]', 'true');

    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error('Stripe error:', stripeData);
      throw new Error(stripeData.error?.message || 'Stripe payment intent creation failed');
    }

    return new Response(JSON.stringify({
      success: true,
      fee,
      requires_payment: true,
      paymentIntentClientSecret: stripeData.client_secret,
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY')
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
