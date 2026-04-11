-- Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Advertisements Table
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    website_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Classified Ads Table
CREATE TABLE IF NOT EXISTS public.classified_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price TEXT NOT NULL,
    description TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classified_ads ENABLE ROW LEVEL SECURITY;

-- Questions Policies
CREATE POLICY "Members can read public questions or their own" ON public.questions
    FOR SELECT USING (
        is_public = true 
        OR member_id = auth.uid() 
        OR public.is_admin_of(neighborhood_id)
        OR public.is_super_admin()
    );

CREATE POLICY "Members can insert their own questions" ON public.questions
    FOR INSERT WITH CHECK (
        auth.uid() = member_id
        AND EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = questions.neighborhood_id
        )
    );

CREATE POLICY "Admins can update questions" ON public.questions
    FOR UPDATE USING (
        public.is_admin_of(neighborhood_id)
        OR public.is_super_admin()
    );

CREATE POLICY "Admins can delete questions" ON public.questions
    FOR DELETE USING (
        public.is_admin_of(neighborhood_id)
        OR public.is_super_admin()
    );

-- Advertisements Policies
CREATE POLICY "Members can read advertisements for their neighborhood" ON public.advertisements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = advertisements.neighborhood_id
        ) OR public.is_super_admin()
    );

CREATE POLICY "Super admins can manage advertisements" ON public.advertisements
    FOR ALL USING (
        public.is_super_admin()
    );

-- Classified Ads Policies
CREATE POLICY "Members can read neighborhood classified ads" ON public.classified_ads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = classified_ads.neighborhood_id
        ) OR public.is_super_admin()
    );

CREATE POLICY "Authenticated members can insert classified ads" ON public.classified_ads
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = classified_ads.neighborhood_id
        )
    );

CREATE POLICY "Owners can update their classified ads" ON public.classified_ads
    FOR UPDATE USING (
        auth.uid() = user_id OR public.is_super_admin()
    );

CREATE POLICY "Owners can delete their classified ads" ON public.classified_ads
    FOR DELETE USING (
        auth.uid() = user_id OR public.is_super_admin()
    );

-- Updated at trigger for questions
CREATE TRIGGER on_questions_updated
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
