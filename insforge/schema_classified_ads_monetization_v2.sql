-- Consolidated Classified Ads Monetization Schema

-- 1. Create neighborhood_settings if not exists (general settings table)
CREATE TABLE IF NOT EXISTS public.neighborhood_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    classifieds_monetization_enabled BOOLEAN DEFAULT FALSE,
    
    -- Listing limits (defaults from spec)
    max_ads_resident INTEGER DEFAULT 5,
    max_ads_moderator INTEGER DEFAULT 10,
    max_ads_admin INTEGER DEFAULT 20,
    
    -- Expiry
    ad_expiry_days INTEGER DEFAULT 30,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(neighborhood_id)
);

-- 2. Update classified_ads with monetization and lifecycle fields
ALTER TABLE public.classified_ads 
    ADD COLUMN IF NOT EXISTS price_numeric NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fee_paid NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active', -- active, inactive, sold, pending_payment, expired
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');

-- 3. Create classified_ads_payments for Stripe tracking
CREATE TABLE IF NOT EXISTS public.classified_ads_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES public.classified_ads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    stripe_session_id TEXT,
    payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.neighborhood_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classified_ads_payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for neighborhood_settings
CREATE POLICY "Members can read neighborhood settings" ON public.neighborhood_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = neighborhood_settings.neighborhood_id
        ) OR public.is_super_admin()
    );

CREATE POLICY "Admins can manage neighborhood settings" ON public.neighborhood_settings
    FOR ALL USING (
        public.is_admin_of(neighborhood_id) OR public.is_super_admin()
    );

-- 6. RLS Policies for classified_ads_payments
CREATE POLICY "Users can read their own ad payments" ON public.classified_ads_payments
    FOR SELECT USING (
        user_id = auth.uid() OR public.is_super_admin()
    );

CREATE POLICY "Admins can read payments for their neighborhood" ON public.classified_ads_payments
    FOR SELECT USING (
        public.is_admin_of(neighborhood_id) OR public.is_super_admin()
    );

-- 7. Update classified_ads policies if needed (usually already allows read/insert)
-- Ensure users can only update their own ads
-- Ensure moderators/admins can manage ads

-- 8. Updated at trigger
DROP TRIGGER IF EXISTS on_neighborhood_settings_updated ON public.neighborhood_settings;
CREATE TRIGGER on_neighborhood_settings_updated
    BEFORE UPDATE ON public.neighborhood_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
