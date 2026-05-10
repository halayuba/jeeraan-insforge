-- Grievances (Community Issue Reporting & Tracking) Schema

-- 1. Create grievances table
CREATE TABLE IF NOT EXISTS public.grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Resolved'
    views_count INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create grievance_comments table
CREATE TABLE IF NOT EXISTS public.grievance_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_comments ENABLE ROW LEVEL SECURITY;

-- 4. Grievances RLS Policies
DROP POLICY IF EXISTS "Members can read grievances in their neighborhood" ON public.grievances;
CREATE POLICY "Members can read grievances in their neighborhood" ON public.grievances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = grievances.neighborhood_id
        ) OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Authenticated members can insert grievances" ON public.grievances;
CREATE POLICY "Authenticated members can insert grievances" ON public.grievances
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = grievances.neighborhood_id
        )
    );

DROP POLICY IF EXISTS "Owners or admins can update grievances" ON public.grievances;
CREATE POLICY "Owners or admins can update grievances" ON public.grievances
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR public.is_admin_of(neighborhood_id)
        OR public.is_super_admin()
    );

-- 5. Grievance Comments RLS Policies
DROP POLICY IF EXISTS "Members can read comments for grievances in their neighborhood" ON public.grievance_comments;
CREATE POLICY "Members can read comments for grievances in their neighborhood" ON public.grievance_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.grievances g
            JOIN public.user_neighborhoods un ON g.neighborhood_id = un.neighborhood_id
            WHERE g.id = grievance_comments.grievance_id AND un.user_id = auth.uid()
        ) OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Authenticated members can insert comments" ON public.grievance_comments;
CREATE POLICY "Authenticated members can insert comments" ON public.grievance_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.grievances g
            JOIN public.user_neighborhoods un ON g.neighborhood_id = un.neighborhood_id
            WHERE g.id = grievance_comments.grievance_id AND un.user_id = auth.uid()
        )
    );

-- 6. Updated at triggers
DROP TRIGGER IF EXISTS on_grievances_updated ON public.grievances;
CREATE TRIGGER on_grievances_updated
    BEFORE UPDATE ON public.grievances
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_grievance_comments_updated ON public.grievance_comments;
CREATE TRIGGER on_grievance_comments_updated
    BEFORE UPDATE ON public.grievance_comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
