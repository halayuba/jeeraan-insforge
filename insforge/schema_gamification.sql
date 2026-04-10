-- Gamification Settings Table
CREATE TABLE IF NOT EXISTS public.gamification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Points configuration
    points_announcement INTEGER DEFAULT 3,
    points_invite_accepted INTEGER DEFAULT 5,
    points_work_order_feedback INTEGER DEFAULT 2,
    points_forum_topic INTEGER DEFAULT 2,
    points_classified_ad INTEGER DEFAULT 2,
    points_grievance_submission INTEGER DEFAULT 3,
    points_event_qna_reply INTEGER DEFAULT 0,
    
    -- Level thresholds
    level_1_threshold INTEGER DEFAULT 0,
    level_2_threshold INTEGER DEFAULT 25,
    level_3_threshold INTEGER DEFAULT 50,
    max_levels INTEGER DEFAULT 3,
    
    -- Promotion threshold
    moderator_threshold INTEGER DEFAULT 25,
    
    -- Abuse prevention
    daily_points_cap INTEGER DEFAULT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(neighborhood_id)
);

-- Extend user_profiles with gamification fields
ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS eligible_for_moderator BOOLEAN DEFAULT FALSE;

-- Points Log Table
CREATE TABLE IF NOT EXISTS public.points_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    points_awarded INTEGER NOT NULL,
    entity_id UUID, -- ID of the related object (announcement, grievance, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;

-- Gamification Settings Policies
CREATE POLICY "Members can read their neighborhood gamification settings" ON public.gamification_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = gamification_settings.neighborhood_id
        ) OR public.is_super_admin()
    );

CREATE POLICY "Admins can manage gamification settings" ON public.gamification_settings
    FOR ALL USING (
        public.is_admin_of(neighborhood_id) OR public.is_super_admin()
    );

-- Points Log Policies
CREATE POLICY "Users can read their own points log" ON public.points_log
    FOR SELECT USING (
        user_id = auth.uid() OR public.is_super_admin()
    );

CREATE POLICY "Admins can read points log for their neighborhood" ON public.points_log
    FOR SELECT USING (
        public.is_admin_of(neighborhood_id) OR public.is_super_admin()
    );

-- Updated at trigger for gamification_settings
CREATE TRIGGER on_gamification_settings_updated
    BEFORE UPDATE ON public.gamification_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
