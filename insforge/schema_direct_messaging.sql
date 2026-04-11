-- Helper functions if not exists
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

-- Add DM settings to neighborhoods if not exists
ALTER TABLE public.neighborhoods 
    ADD COLUMN IF NOT EXISTS is_dm_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS max_daily_messages INTEGER DEFAULT 10;

-- Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure participant order for uniqueness (participant_1_id < participant_2_id)
    CONSTRAINT participants_order CHECK (participant_1_id < participant_2_id),
    UNIQUE(participant_1_id, participant_2_id, neighborhood_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Daily Usage Table (for rate limiting)
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE,
    messages_sent_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
CREATE POLICY "Users can see their own conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid() IN (participant_1_id, participant_2_id)
        OR public.is_admin_of(neighborhood_id)
        OR public.is_super_admin()
    );

CREATE POLICY "Users can create conversations if they are members" ON public.conversations
    FOR INSERT WITH CHECK (
        (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
        AND EXISTS (
            SELECT 1 FROM public.user_neighborhoods
            WHERE user_id = auth.uid() AND neighborhood_id = conversations.neighborhood_id
        )
    );

-- Messages Policies
CREATE POLICY "Users can read messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND (auth.uid() IN (participant_1_id, participant_2_id) OR public.is_admin_of(neighborhood_id))
        )
        OR public.is_super_admin()
    );

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND (auth.uid() IN (participant_1_id, participant_2_id))
        )
        AND EXISTS (
            -- Respect neighborhood-level DM activation
            SELECT 1 FROM public.neighborhoods
            WHERE id = messages.neighborhood_id AND is_dm_enabled = TRUE
        )
        AND EXISTS (
            -- Ensure daily limit hasn't been reached (dynamic based on neighborhood setting)
            SELECT 1 FROM public.user_daily_usage udu
            JOIN public.neighborhoods n ON n.id = messages.neighborhood_id
            WHERE udu.user_id = auth.uid() 
            AND udu.usage_date = CURRENT_DATE 
            AND udu.messages_sent_count < n.max_daily_messages
            UNION ALL
            SELECT 1 FROM public.neighborhoods n
            WHERE n.id = messages.neighborhood_id
            AND NOT EXISTS (SELECT 1 FROM public.user_daily_usage WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE)
        )
    );

-- User Daily Usage Policies
CREATE POLICY "Users can read their own daily usage" ON public.user_daily_usage
    FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

-- Function to update last_message_at on conversation
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_message_at
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;

    -- Update daily usage count
    INSERT INTO public.user_daily_usage (user_id, usage_date, messages_sent_count)
    VALUES (NEW.sender_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET messages_sent_count = user_daily_usage.messages_sent_count + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();
