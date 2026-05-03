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
    const { postId } = await req.json();

    if (!postId) {
      return new Response(JSON.stringify({ error: 'Missing postId' }), { status: 400, headers: corsHeaders });
    }

    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('API_KEY') || '',
    } as any);

    // Fetch the post
    const { data: post, error: postError } = await insforge.database
      .from('gallery_posts')
      .select('image_url, description, status')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      throw new Error("Post not found");
    }

    if (post.status !== 'pending') {
      return new Response(JSON.stringify({ message: "Post is already validated", status: post.status }), {
        status: 200, headers: corsHeaders
      });
    }

    // Since `image_url` might be just a path in the bucket, we need the full URL
    // If it's already an HTTP URL, use it directly. Otherwise, get public URL.
    let imageUrl = post.image_url;
    if (!imageUrl.startsWith('http')) {
      const publicUrlResponse = insforge.storage.from('gallery').getPublicUrl(post.image_url);
      imageUrl = typeof publicUrlResponse === 'string' ? publicUrlResponse : (publicUrlResponse as any).data?.publicUrl || (publicUrlResponse as any).publicUrl;
    }

    const prompt = `Validate the following image against our app policy: 'Pictures are strictly forbidden for images of individuals and people. Pictures can be posted for objects, scenery, cars, animals, buildings, etc., as long as human faces are not showing. No selfies.'
Also, the user provided this description: "${post.description}".
Are there any visible faces or individual people in this image?
Return exactly a JSON object: {"is_valid": boolean, "reason": "string explaining why"}`;

    // Call InsForge AI
    const aiResponse = await insforge.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { 
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ]
    });

    if (aiResponse.error) {
       throw new Error(`AI error: ${JSON.stringify(aiResponse.error)}`);
    }

    const aiMessage = aiResponse.data?.choices?.[0]?.message?.content;
    if (!aiMessage) {
       throw new Error("Failed to get response from AI");
    }

    let validationResult = { is_valid: false, reason: "Failed to parse AI response" };
    try {
      let cleanedMessage = aiMessage.trim();
      if (cleanedMessage.startsWith('\`\`\`json')) {
        cleanedMessage = cleanedMessage.substring(7, cleanedMessage.length - 3).trim();
      } else if (cleanedMessage.startsWith('\`\`\`')) {
        cleanedMessage = cleanedMessage.substring(3, cleanedMessage.length - 3).trim();
      }
      validationResult = JSON.parse(cleanedMessage);
    } catch (e) {
       console.error("Failed to parse AI message:", aiMessage);
    }

    const newStatus = validationResult.is_valid ? 'approved' : 'rejected';

    const { error: updateError } = await insforge.database
      .from('gallery_posts')
      .update({ status: newStatus })
      .eq('id', postId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      success: true,
      status: newStatus,
      reason: validationResult.reason
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
