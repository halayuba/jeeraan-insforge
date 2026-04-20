import { insforge } from './insforge';

export const FLOORPLAN_OPTIONS = [
  "Bolero: 2 Bedroom, 1 1/2 Townhouse",
  "Alamo: 2 Bedroom, 1 bath Ranch",
  "Catalina: 3 Bedroom, 1 3/4 Bath Townhouse",
  "Durango: 3 Bedroom, 1 3/4 Bath Duplex with Garage",
  "Any of the above",
];

export interface WaitlistRequest {
  id?: string;
  neighborhood_id: string;
  full_name: string;
  phone_number: string;
  email_address: string;
  floorplan_interest: string;
  created_at?: string;
}

/**
 * Submits a new waitlist request to the database.
 */
export async function submitWaitlistRequest(request: WaitlistRequest) {
  const { data, error } = await insforge.database
    .from('waitlist_requests')
    .insert([request])
    .select()
    .single();

  return { data, error };
}
