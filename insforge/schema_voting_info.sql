-- Schema for Election, Board Positions, Polls and Candidates

-- Create neighborhood_election_info table
CREATE TABLE IF NOT EXISTS public.neighborhood_election_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    voting_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(neighborhood_id) -- Only one active election info per neighborhood for now
);

-- Create board_positions table
CREATE TABLE IF NOT EXISTS public.board_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'general',
    end_time TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    bio TEXT,
    assets TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    device_fingerprint TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.neighborhood_election_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for neighborhood_election_info
CREATE POLICY "Members can read election info" ON public.neighborhood_election_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = neighborhood_election_info.neighborhood_id
        ) OR is_super_admin()
    );

CREATE POLICY "Super admins can manage election info" ON public.neighborhood_election_info
    FOR ALL USING (is_super_admin());

-- RLS Policies for board_positions
CREATE POLICY "Members can read board positions" ON public.board_positions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = board_positions.neighborhood_id
        ) OR is_super_admin()
    );

CREATE POLICY "Super admins can manage board positions" ON public.board_positions
    FOR ALL USING (is_super_admin());

-- RLS Policies for polls
CREATE POLICY "Members can read their neighborhood polls" ON public.polls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = polls.neighborhood_id
        ) OR is_super_admin()
    );

CREATE POLICY "Admins can create polls" ON public.polls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = polls.neighborhood_id AND role = 'admin'
        ) OR is_super_admin()
    );

CREATE POLICY "Owners can update their polls" ON public.polls
    FOR UPDATE USING (auth.uid() = created_by OR is_super_admin());

-- RLS Policies for candidates
CREATE POLICY "Public can read candidates" ON public.candidates
    FOR SELECT USING (true);

CREATE POLICY "Users can apply as candidates" ON public.candidates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates can update their profiles" ON public.candidates
    FOR UPDATE USING (auth.uid() = user_id OR is_super_admin());

-- RLS Policies for poll_votes
CREATE POLICY "Public can read votes" ON public.poll_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote once" ON public.poll_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER on_neighborhood_election_info_updated
    BEFORE UPDATE ON public.neighborhood_election_info
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_board_positions_updated
    BEFORE UPDATE ON public.board_positions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_polls_updated
    BEFORE UPDATE ON public.polls
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
