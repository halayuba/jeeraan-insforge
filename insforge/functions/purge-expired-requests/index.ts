import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export default async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('API_KEY') || '',
    } as any);

    console.log("[PURGE] Starting daily purge of expired join requests...");

    // Find all approved requests
    const { data: approvedRequests, error: fetchError } = await insforge.database
      .from("join_requests")
      .select("id, name, phone, invite_code, neighborhood_id")
      .eq("status", "approved")
      .not("invite_code", "is", null);

    if (fetchError) throw fetchError;

    let purgedCount = 0;
    
    if (approvedRequests && approvedRequests.length > 0) {
      for (const request of approvedRequests) {
        // Check if the associated invite is expired and unused
        const { data: invite, error: inviteError } = await insforge.database
          .from("invites")
          .select("id, expires_at, used_at")
          .eq("code", request.invite_code)
          .eq("phone", request.phone)
          .eq("neighborhood_id", request.neighborhood_id)
          .maybeSingle();

        if (inviteError) {
          console.error(`[PURGE] Error checking invite for request ${request.id}:`, inviteError);
          continue;
        }

        if (invite && new Date(invite.expires_at) < new Date() && !invite.used_at) {
          console.log(`[PURGE] Purging expired request: ${request.name} (${request.phone}), Code: ${request.invite_code}`);
          
          const { error: deleteError } = await insforge.database
            .from("join_requests")
            .delete()
            .eq("id", request.id);

          if (deleteError) {
            console.error(`[PURGE] Failed to delete request ${request.id}:`, deleteError);
          } else {
            purgedCount++;
          }
        }
      }
    }

    console.log(`[PURGE] Daily purge completed. Total purged: ${purgedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        purgedCount,
        message: `Successfully purged ${purgedCount} expired requests.` 
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err: any) {
    console.error("[PURGE ERROR]", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
};
