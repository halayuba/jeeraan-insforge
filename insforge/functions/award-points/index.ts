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
    const { userId, actionType, neighborhoodId, entityId } = body;

    if (!userId || !actionType || !neighborhoodId) {
      return new Response(JSON.stringify({ error: 'Missing userId, actionType, or neighborhoodId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Using anonKey + edgeFunctionToken with API_KEY for admin bypass if possible, 
    // or relying on the platform to handle the apiKey property if it exists in newer SDK versions.
    // Given the type error, we'll try to cast to 'any' to bypass strict TS check for the property name if we suspect it exists at runtime.
    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('API_KEY') || '',
    } as any);

    const { data: settings, error: settingsError } = await insforge.database
      .from('gamification_settings')
      .select('*')
      .eq('neighborhood_id', neighborhoodId)
      .maybeSingle();

    if (settingsError || !settings || !settings.is_active) {
      return new Response(JSON.stringify({ success: false, message: 'Gamification is disabled or not configured.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (entityId && ['work_order_feedback', 'grievance_submission', 'forum_topic', 'classified_ad', 'announcement'].includes(actionType)) {
      const { data: existingLog } = await insforge.database
        .from('points_log')
        .select('id')
        .eq('user_id', userId)
        .eq('action_type', actionType)
        .eq('entity_id', entityId)
        .maybeSingle();
      
      if (existingLog) {
        return new Response(JSON.stringify({ success: false, message: 'Action already rewarded.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    let pointsToAdd = 0;
    switch (actionType) {
      case 'announcement': pointsToAdd = settings.points_announcement; break;
      case 'invite_accepted': pointsToAdd = settings.points_invite_accepted; break;
      case 'work_order_feedback': pointsToAdd = settings.points_work_order_feedback; break;
      case 'forum_topic': pointsToAdd = settings.points_forum_topic; break;
      case 'classified_ad': pointsToAdd = settings.points_classified_ad; break;
      case 'grievance_submission': pointsToAdd = settings.points_grievance_submission; break;
      case 'event_qna_reply': pointsToAdd = settings.points_event_qna_reply; break;
      default: pointsToAdd = 0;
    }

    if (pointsToAdd <= 0) {
      return new Response(JSON.stringify({ success: true, message: 'Zero points awarded for this action.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: userProfile, error: profileError } = await insforge.database
      .from('user_profiles')
      .select('points, level, eligible_for_moderator')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !userProfile) {
      throw new Error('User profile not found.');
    }

    const newPointsTotal = (userProfile.points || 0) + pointsToAdd;
    
    let newLevel = 1;
    if (newPointsTotal >= settings.level_3_threshold) {
      newLevel = 3;
    } else if (newPointsTotal >= settings.level_2_threshold) {
      newLevel = 2;
    } else if (newPointsTotal >= settings.level_1_threshold) {
      newLevel = 1;
    }
    
    if (newLevel > settings.max_levels) {
        newLevel = settings.max_levels;
    }

    const isEligibleForModerator = newPointsTotal >= settings.moderator_threshold;

    const { error: updateError } = await insforge.database
      .from('user_profiles')
      .update({
        points: newPointsTotal,
        level: newLevel,
        eligible_for_moderator: isEligibleForModerator,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    const { error: logInsertError } = await insforge.database
      .from('points_log')
      .insert({
        user_id: userId,
        neighborhood_id: neighborhoodId,
        action_type: actionType,
        points_awarded: pointsToAdd,
        entity_id: entityId
      });

    if (logInsertError) throw logInsertError;

    return new Response(JSON.stringify({
      success: true,
      points_added: pointsToAdd,
      new_total_points: newPointsTotal,
      new_level: newLevel,
      level_up: newLevel > userProfile.level,
      eligible_for_moderator: isEligibleForModerator && !userProfile.eligible_for_moderator
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
