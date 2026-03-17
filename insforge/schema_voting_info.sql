-- Schema for Election and Board Positions

-- Create neighborhood_election_info table
CREATE TABLE IF NOT EXISTS public.neighborhood_election_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL, -- Ties to neighborhoods table
    voting_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(neighborhood_id) -- Only one active election info per neighborhood for now
);

-- Create board_positions table
CREATE TABLE IF NOT EXISTS public.board_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.neighborhood_election_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for neighborhood_election_info
-- Everyone in the neighborhood can read
CREATE POLICY "Members can read election info" ON public.neighborhood_election_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = neighborhood_election_info.neighborhood_id
        ) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND global_role = 'super_admin'
        )
    );

-- Super admins can manage
CREATE POLICY "Super admins can manage election info" ON public.neighborhood_election_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND global_role = 'super_admin'
        )
    );

-- RLS Policies for board_positions
-- Everyone in the neighborhood can read
CREATE POLICY "Members can read board positions" ON public.board_positions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = board_positions.neighborhood_id
        ) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND global_role = 'super_admin'
        )
    );

-- Super admins can manage
CREATE POLICY "Super admins can manage board positions" ON public.board_positions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND global_role = 'super_admin'
        )
    );

-- Trigger for updated_at (assumes public.handle_updated_at exists from schema_user_profiles.sql)
CREATE TRIGGER on_neighborhood_election_info_updated
    BEFORE UPDATE ON public.neighborhood_election_info
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_board_positions_updated
    BEFORE UPDATE ON public.board_positions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
