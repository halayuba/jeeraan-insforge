CREATE TABLE IF NOT EXISTS neighborhoods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  admin_contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_neighborhoods" ON neighborhoods FOR SELECT USING (true);
CREATE POLICY "admin_all_neighborhoods" ON neighborhoods FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_neighborhoods WHERE neighborhood_id = neighborhoods.id AND role = 'super_admin'));

CREATE TABLE IF NOT EXISTS user_neighborhoods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_neighborhoods_user_id_key UNIQUE(user_id)
);

ALTER TABLE user_neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_link" ON user_neighborhoods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "neighborhood_read_link" ON user_neighborhoods FOR SELECT USING (
  neighborhood_id IN (SELECT neighborhood_id FROM user_neighborhoods WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_requests" ON join_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_all_requests" ON join_requests FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_neighborhoods WHERE neighborhood_id = join_requests.neighborhood_id AND role IN ('admin', 'super_admin'))
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_invites" ON invites FOR SELECT USING (true);
CREATE POLICY "public_update_invites" ON invites FOR UPDATE USING (true);
CREATE POLICY "admin_insert_invites" ON invites FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_neighborhoods WHERE neighborhood_id = invites.neighborhood_id AND role IN ('admin', 'super_admin', 'inviter'))
);
CREATE POLICY "admin_read_invites" ON invites FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM user_neighborhoods WHERE neighborhood_id = invites.neighborhood_id AND role IN ('admin', 'super_admin', 'inviter'))
);

INSERT INTO neighborhoods (id, name, address, city, state, zip_code) 
SELECT '5ee00f2e-0d19-4a94-82a0-4ffeb091d3cc', 'Oak Valley Estates', '123 Oak St', 'Oakville', 'CA', '90210'
WHERE NOT EXISTS (SELECT 1 FROM neighborhoods WHERE id = '5ee00f2e-0d19-4a94-82a0-4ffeb091d3cc');
