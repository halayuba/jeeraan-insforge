-- Spin Wheel Schema

-- Daily Spins Table to track 1-spin-per-day rule
CREATE TABLE IF NOT EXISTS public.daily_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    spin_date DATE DEFAULT CURRENT_DATE NOT NULL,
    result_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id, neighborhood_id, spin_date)
);

-- Enable RLS
ALTER TABLE public.daily_spins ENABLE ROW LEVEL SECURITY;

-- Daily Spins Policies
CREATE POLICY "Users can see their own spins" ON public.daily_spins
    FOR SELECT USING (
        user_id = auth.uid() OR public.is_super_admin()
    );

CREATE POLICY "Admins can see spins for their neighborhood" ON public.daily_spins
    FOR SELECT USING (
        public.is_admin_of(neighborhood_id) OR public.is_super_admin()
    );

-- Note: INSERT/UPDATE should be handled by an Edge Function with service_role 
-- or by a controlled API to prevent client-side manipulation of results.
