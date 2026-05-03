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
    } as any);

    const today = new Date().toISOString().split('T')[0];

    const { data: questions, error: fetchError } = await insforge.database
      .from('whiteboard_questions')
      .select('id')
      .eq('target_date', today);

    if (fetchError || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ message: "No questions found for today" }), { status: 200, headers: corsHeaders });
    }

    let bestId = questions[0].id;
    let maxVotes = -1;

    for (const q of questions) {
      const { count } = await insforge.database
        .from('whiteboard_votes')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', q.id);
        
      const currentVotes = count || 0;
      if (currentVotes > maxVotes) {
        maxVotes = currentVotes;
        bestId = q.id;
      }
    }

    const { error: updateError } = await insforge.database
      .from('whiteboard_questions')
      .update({ is_published: true })
      .eq('id', bestId);

    if (updateError) throw updateError;

    // Optional: award points logic can be added here or via trigger
    // Since we're keeping it simple for now, we just publish.

    return new Response(JSON.stringify({ success: true, published_id: bestId, votes: maxVotes }), {
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
