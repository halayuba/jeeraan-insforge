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
    const { userId, neighborhoodId } = body;

    if (!userId || !neighborhoodId) {
      return new Response(JSON.stringify({ error: 'Missing userId or neighborhoodId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('API_KEY') || '',
    } as any);

    // 1. Check user role eligibility (Residents only)
    const { data: userNeighborhood, error: roleError } = await insforge.database
      .from('user_neighborhoods')
      .select('role')
      .eq('user_id', userId)
      .eq('neighborhood_id', neighborhoodId)
      .maybeSingle();

    if (roleError || !userNeighborhood || userNeighborhood.role !== 'resident') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Only residents are eligible for the daily spin.' 
      }), {
        status: 200, // Return 200 to handle message in frontend gracefully
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Check if already spun today
    // Use UTC date to be consistent
    const today = new Date().toISOString().split('T')[0];
    const { data: existingSpin, error: spinCheckError } = await insforge.database
      .from('daily_spins')
      .select('id')
      .eq('user_id', userId)
      .eq('neighborhood_id', neighborhoodId)
      .eq('spin_date', today)
      .maybeSingle();

    if (spinCheckError) throw spinCheckError;
    if (existingSpin) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'You have already spun the wheel today.' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Determine reward based on probabilities
    // Try Again (0 pts): 30%, Small (+1 pt): 40%, Medium (+2 pts): 20%, Big (+3 pts): 10%
    const randomValue = Math.random() * 100;
    let resultPoints = 0;
    
    if (randomValue < 30) {
      resultPoints = 0;
    } else if (randomValue < 70) {
      resultPoints = 1;
    } else if (randomValue < 90) {
      resultPoints = 2;
    } else {
      resultPoints = 3;
    }

    // 4. Record the spin
    const { error: spinInsertError } = await insforge.database
      .from('daily_spins')
      .insert({
        user_id: userId,
        neighborhood_id: neighborhoodId,
        spin_date: today,
        result_points: resultPoints
      });

    if (spinInsertError) throw spinInsertError;

    // 5. If resultPoints > 0, update profile and log points
    let pointsAdded = 0;
    let newTotalPoints = 0;
    let newLevel = 1;
    let levelUp = false;

    const { data: userProfile, error: profileError } = await insforge.database
      .from('user_profiles')
      .select('points, level')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !userProfile) throw new Error('User profile not found.');

    if (resultPoints > 0) {
      const { data: settings } = await insforge.database
        .from('gamification_settings')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .maybeSingle();

      const level3Threshold = settings?.level_3_threshold ?? 50;
      const level2Threshold = settings?.level_2_threshold ?? 25;
      const maxLevels = settings?.max_levels ?? 3;

      newTotalPoints = (userProfile.points || 0) + resultPoints;
      
      if (newTotalPoints >= level3Threshold) {
        newLevel = 3;
      } else if (newTotalPoints >= level2Threshold) {
        newLevel = 2;
      } else {
        newLevel = 1;
      }
      
      if (newLevel > maxLevels) newLevel = maxLevels;
      levelUp = newLevel > userProfile.level;

      // Update Profile
      const { error: updateError } = await insforge.database
        .from('user_profiles')
        .update({
          points: newTotalPoints,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log points
      const { error: logError } = await insforge.database
        .from('points_log')
        .insert({
          user_id: userId,
          neighborhood_id: neighborhoodId,
          action_type: 'spin_wheel',
          points_awarded: resultPoints
        });

      if (logError) throw logError;
      
      pointsAdded = resultPoints;
    } else {
      newTotalPoints = userProfile.points || 0;
      newLevel = userProfile.level || 1;
    }

    return new Response(JSON.stringify({
      success: true,
      points_added: pointsAdded,
      result_points: resultPoints,
      new_total_points: newTotalPoints,
      new_level: newLevel,
      level_up: levelUp
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Spin Wheel error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
