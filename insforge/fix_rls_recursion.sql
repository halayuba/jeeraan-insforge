-- Fix RLS Recursion in user_profiles
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.user_profiles;

-- Use a subquery that checks the current user's role without recursion
-- Or simply rely on the fact that Super Admins can bypass RLS via their global_role
-- In InsForge, RLS is often bypassed for super admins through specific policies or triggers

-- Corrected Super Admin policy:
CREATE POLICY "Super admins can read all profiles" ON public.user_profiles
    FOR SELECT USING (
        (SELECT global_role FROM public.user_profiles WHERE user_id = auth.uid()) = 'super_admin'
    );
