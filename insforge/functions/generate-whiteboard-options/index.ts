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

    // Get recently asked questions to avoid duplicates
    const { data: pastQuestions, error: pastError } = await insforge.database
      .from('whiteboard_questions')
      .select('question_text')
      .order('created_at', { ascending: false })
      .limit(30);
      
    if (pastError) {
      console.error('Error fetching past questions:', pastError);
    }

    const pastQuestionsText = pastQuestions?.map((q: any) => q.question_text).join('\n') || 'None';

    const prompt = `Generate 5 daily fun, exciting, social, science/history/geography related questions suitable for all ages (from kids to 80 year olds). 
Do not include any of these past questions:
${pastQuestionsText}

Return EXACTLY a JSON array of strings containing the 5 questions, with no markdown formatting and no extra text. Example:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    // Call InsForge AI
    const aiResponse = await insforge.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    });

    if (aiResponse.error) {
       throw new Error(`AI error: ${JSON.stringify(aiResponse.error)}`);
    }

    const aiMessage = aiResponse.data?.choices?.[0]?.message?.content;
    if (!aiMessage) {
       throw new Error("Failed to get response from AI");
    }

    let questionsArray: string[] = [];
    try {
      let cleanedMessage = aiMessage.trim();
      if (cleanedMessage.startsWith('```json')) {
        cleanedMessage = cleanedMessage.substring(7, cleanedMessage.length - 3).trim();
      }
      questionsArray = JSON.parse(cleanedMessage);
    } catch (e) {
      // fallback parsing
      questionsArray = aiMessage.split('\n').filter((l: string) => l.trim().length > 0 && /\w/.test(l)).map((l: string) => l.replace(/^\d+\.\s*/, '').replace(/^\[|\]$/g, '').replace(/["]/g, '').trim());
    }

    if (!Array.isArray(questionsArray) || questionsArray.length < 5) {
      throw new Error("AI did not return 5 questions. Returned: " + JSON.stringify(questionsArray));
    }

    const categories = ['Fun', 'Social', 'Science', 'History', 'Geography'];
    const today = new Date().toISOString().split('T')[0];

    const questionsToInsert = questionsArray.slice(0, 5).map((q, index) => ({
      question_text: q,
      category: categories[index % categories.length],
      target_date: today,
      is_published: false
    }));

    const { error: insertError } = await insforge.database
      .from('whiteboard_questions')
      .insert(questionsToInsert);

    if (insertError) throw insertError;

    // Optional: Purge previous day's answers
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const { data: yesterdayQ } = await insforge.database
       .from('whiteboard_questions')
       .select('id')
       .eq('target_date', yesterdayDate)
       .eq('is_published', true);

    if (yesterdayQ && yesterdayQ.length > 0) {
       await insforge.database
         .from('whiteboard_answers')
         .delete()
         .eq('question_id', yesterdayQ[0].id);
    }

    return new Response(JSON.stringify({
      success: true,
      inserted: questionsToInsert
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
