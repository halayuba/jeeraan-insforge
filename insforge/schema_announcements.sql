-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure status column exists if table already existed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='status') THEN
        ALTER TABLE public.announcements ADD COLUMN status TEXT DEFAULT 'approved';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Members can read approved announcements" ON public.announcements;
DROP POLICY IF EXISTS "Members can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Public can read announcements" ON public.announcements;

-- RLS Policies
CREATE POLICY "Members can read approved announcements" ON public.announcements
    FOR SELECT USING (
        (status = 'approved' AND EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = announcements.neighborhood_id
        ))
        OR author_id = auth.uid()
        OR public.is_admin_of(neighborhood_id)
        OR public.is_super_admin()
    );

CREATE POLICY "Members can insert announcements" ON public.announcements
    FOR INSERT WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = announcements.neighborhood_id
        )
    );

CREATE POLICY "Admins can update announcements" ON public.announcements
    FOR UPDATE USING (
        public.is_admin_of(neighborhood_id)
        OR public.is_super_admin()
    );

CREATE POLICY "Admins can delete announcements" ON public.announcements
    FOR DELETE USING (
        public.is_admin_of(neighborhood_id)
        OR public.is_super_admin()
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_announcements_updated ON public.announcements;
CREATE TRIGGER on_announcements_updated
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
