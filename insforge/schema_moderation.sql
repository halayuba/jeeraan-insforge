-- Schema for Content Moderation and Upload Tracking

-- Helper functions (if not already defined)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid() AND global_role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_of(nid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_neighborhoods
        WHERE user_id = auth.uid() AND neighborhood_id = nid AND role IN ('admin', 'moderator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Image Moderation Queue
CREATE TABLE IF NOT EXISTS public.image_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    service_type TEXT NOT NULL, -- 'profile_picture', 'classified_ad', 'announcement', 'grievance', 'message_attachment'
    entity_id UUID, -- ID of the related object (ad_id, announcement_id, etc.)
    image_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderated_by UUID REFERENCES public.user_profiles(user_id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Upload Tracking (for daily rate limiting)
CREATE TABLE IF NOT EXISTS public.user_upload_tracking (
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    usage_date DATE DEFAULT CURRENT_DATE,
    upload_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, service_type, usage_date)
);

-- Enable RLS
ALTER TABLE public.image_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_upload_tracking ENABLE ROW LEVEL SECURITY;

-- ... (policies remain same, just update table name in policies if needed) ...

-- Function to check and update upload tracking
CREATE OR REPLACE FUNCTION public.check_upload_limit(u_id UUID, s_type TEXT, max_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT upload_count INTO current_count
    FROM public.user_upload_tracking
    WHERE user_id = u_id AND service_type = s_type AND usage_date = CURRENT_DATE;

    IF current_count IS NULL THEN
        INSERT INTO public.user_upload_tracking (user_id, service_type, usage_date, upload_count)
        VALUES (u_id, s_type, CURRENT_DATE, 1);
        RETURN TRUE;
    ELSIF current_count < max_limit THEN
        UPDATE public.user_upload_tracking
        SET upload_count = upload_count + 1
        WHERE user_id = u_id AND service_type = s_type AND usage_date = CURRENT_DATE;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
