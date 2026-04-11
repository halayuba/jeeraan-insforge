-- Create global_role enum
DO $$ BEGIN
    CREATE TYPE public.global_role AS ENUM ('super_admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    global_role public.global_role NOT NULL DEFAULT 'user',
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    email TEXT,
    birthday DATE,
    language TEXT,
    work_title TEXT,
    gender TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    deletion_requested BOOLEAN DEFAULT false,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    eligible_for_moderator BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    anonymous_id TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Neighborhood members can see each other's profiles" ON public.user_profiles;

-- RLS Policies
CREATE POLICY "Users can read their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all profiles" ON public.user_profiles
    FOR SELECT USING (
        (SELECT global_role FROM public.user_profiles WHERE user_id = auth.uid()) = 'super_admin'
    );

CREATE POLICY "Neighborhood members can see each other's profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_neighborhoods un1
            JOIN public.user_neighborhoods un2 ON un1.neighborhood_id = un2.neighborhood_id
            WHERE un1.user_id = auth.uid() AND un2.user_id = user_profiles.user_id
        )
    );

-- Helper to generate random string for anonymous_id
CREATE OR REPLACE FUNCTION public.generate_anonymous_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..4 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    result := result || floor(random() * 10)::text || floor(random() * 10)::text;
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Trigger to auto-create profile on signup and generate anonymous_id
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, global_role, anonymous_id)
    VALUES (NEW.id, 'user', public.generate_anonymous_id());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_profiles_updated ON public.user_profiles;
CREATE TRIGGER on_user_profiles_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
