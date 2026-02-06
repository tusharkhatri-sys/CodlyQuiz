-- Fix avatar_id columns to use TEXT instead of INTEGER
-- The frontend uses string IDs like 'fox', 'lion', 'panda' etc.

-- Change game_players.avatar_id to TEXT
ALTER TABLE game_players 
  ALTER COLUMN avatar_id TYPE TEXT USING avatar_id::TEXT;

-- Change profiles.selected_avatar to TEXT (if it's integer)
DO $$ 
BEGIN
  -- Check if column exists and alter if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'selected_avatar'
    AND data_type != 'text'
  ) THEN
    ALTER TABLE profiles 
      ALTER COLUMN selected_avatar TYPE TEXT USING selected_avatar::TEXT;
  END IF;
END $$;

-- Change user_avatars.avatar_id to TEXT (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_avatars' 
    AND column_name = 'avatar_id'
    AND data_type != 'text'
  ) THEN
    ALTER TABLE user_avatars 
      ALTER COLUMN avatar_id TYPE TEXT USING avatar_id::TEXT;
  END IF;
END $$;
