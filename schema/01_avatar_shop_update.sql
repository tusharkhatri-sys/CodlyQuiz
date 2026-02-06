-- ============================================
-- Avatar Shop & Coins Update
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add Coins & Avatar columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100, -- Start with 100 coins
ADD COLUMN IF NOT EXISTS selected_avatar VARCHAR(50) DEFAULT 'fox';

-- 2. Create User Avatars table
CREATE TABLE IF NOT EXISTS user_avatars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  avatar_id VARCHAR(50) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, avatar_id)
);

ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own avatars" ON user_avatars;
CREATE POLICY "Users can view own avatars" 
ON user_avatars FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own avatars" ON user_avatars;
CREATE POLICY "Users can insert own avatars" 
ON user_avatars FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Function to Purchase Avatar (Transaction)
CREATE OR REPLACE FUNCTION purchase_avatar(avatar_id_param VARCHAR, price INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_coins INTEGER;
BEGIN
  -- Check if user has enough coins
  SELECT coins INTO current_coins FROM profiles WHERE id = auth.uid();
  
  IF current_coins >= price THEN
    -- Deduct coins
    UPDATE profiles SET coins = coins - price WHERE id = auth.uid();
    
    -- Add avatar to collection
    INSERT INTO user_avatars (user_id, avatar_id) VALUES (auth.uid(), avatar_id_param);
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to Add Coins (for rewards)
CREATE OR REPLACE FUNCTION add_coins(user_uuid UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE profiles 
  SET coins = coins + amount 
  WHERE id = user_uuid
  RETURNING coins INTO new_balance;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
