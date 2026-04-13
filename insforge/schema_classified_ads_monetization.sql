-- Classified Ads Monetization Schema

-- Settings for each neighborhood
CREATE TABLE IF NOT EXISTS public.classified_ads_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    is_monetization_enabled BOOLEAN DEFAULT FALSE,
    
    -- Listing limits per role
    max_ads_resident INTEGER DEFAULT 5,
    max_ads_moderator INTEGER DEFAULT 10,
    max_ads_admin INTEGER DEFAULT 20,
    
    -- Expiration settings
    ad_expiry_days INTEGER DEFAULT 30,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(neighborhood_id)
);

-- Update classified_ads with monetization and status fields
ALTER TABLE public.classified_ads 
    ADD COLUMN IF NOT EXISTS price_numeric NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fee_paid NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Payment logs for classified ads
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

-- Enable RLS
ALTER TABLE public.classified_ads_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classified_ads_payments ENABLE ROW LEVEL SECURITY;

-- Settings Policies
CREATE POLICY "Members can read neighborhood classified settings" ON public.classified_ads_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = classified_ads_settings.neighborhood_id
        ) OR public.is_super_admin()
    );

CREATE POLICY "Admins can manage classified settings" ON public.classified_ads_settings
    FOR ALL USING (
        public.is_admin_of(neighborhood_id) OR public.is_super_admin()
    );

-- Payment Policies
CREATE POLICY "Users can read their own payments" ON public.classified_ads_payments
    FOR SELECT USING (
        user_id = auth.uid() OR public.is_super_admin()
    );

CREATE POLICY "Admins can read payments for their neighborhood" ON public.classified_ads_payments
    FOR SELECT USING (
        public.is_admin_of(neighborhood_id) OR public.is_super_admin()
    );

-- Trigger for updated_at
CREATE TRIGGER on_classified_ads_settings_updated
    BEFORE UPDATE ON public.classified_ads_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
