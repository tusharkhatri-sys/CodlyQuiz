-- ============================================
-- Fix: Auto-create profile on user signup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. First, manually create your profile if it doesn't exist
INSERT INTO profiles (id, username, display_name, total_points, games_played, games_won, coins, selected_avatar)
SELECT 
    auth.uid(),
    COALESCE(
        (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = auth.uid()),
        'Player'
    ),
    COALESCE(
        (SELECT raw_user_meta_data->>'display_name' FROM auth.users WHERE id = auth.uid()),
        'Player'
    ),
    0, 0, 0, 100, 'fox'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid());

-- 2. Create trigger function for future signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, coins, selected_avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'Player'),
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'),
        100,
        'fox'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DONE! New users will automatically get a profile.
