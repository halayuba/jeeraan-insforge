import { insforge } from './insforge';

export type RateLimitType = 
  | 'announcements' 
  | 'events' 
  | 'service_orders' 
  | 'classified_ads' 
  | 'grievances'
  | 'join_requests' // For invites
  | 'messages';

export async function checkDailyLimit(type: RateLimitType, userId: string): Promise<{ allowed: boolean; remaining?: number }> {
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const oneDayAgoIso = oneDayAgo.toISOString();

  let query = insforge.database.from(type).select('id', { count: 'exact', head: true });
  
  // Map internal table names to author column names if necessary
  const authorColumn = type === 'announcements' ? 'author_id' : (type === 'join_requests' ? 'created_by' : (type === 'messages' ? 'sender_id' : 'user_id'));
  
  query = query.eq(authorColumn, userId).gte('created_at', oneDayAgoIso);

  const { count, error } = await query;

  if (error) {
    console.error(`Error checking rate limit for ${type}:`, error);
    return { allowed: true }; // Fail open but log error
  }

  let limit = 1;
  if (type === 'join_requests') limit = 5;
  if (type === 'messages') limit = 10;
  
  const currentCount = count || 0;

  return {
    allowed: currentCount < limit,
    remaining: Math.max(0, limit - currentCount)
  };
}

export async function validateInvite(phone: string): Promise<{ allowed: boolean; message?: string }> {
  // 1. Check if already a member
  const { data: memberData, error: memberError } = await insforge.database
    .from('user_profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle();

  if (memberData) {
    return { allowed: false, message: 'This person is already a registered member.' };
  }

  // 2. Check if there is already a pending request or active invite for this phone
  const { data: requestData, error: requestError } = await insforge.database
    .from('join_requests')
    .select('id')
    .eq('phone', phone)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (requestData) {
    return { allowed: false, message: 'An invite request for this phone number is already being processed.' };
  }

  // 3. Check if there is an unused invite code for this phone
  const { data: inviteData, error: inviteError } = await insforge.database
    .from('invites')
    .select('id')
    .eq('phone', phone)
    .is('used_at', null)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  if (inviteData) {
    return { allowed: false, message: 'An active invite already exists for this phone number.' };
  }

  return { allowed: true };
}
