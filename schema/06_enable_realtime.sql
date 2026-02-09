-- Enable Realtime for Game Tables
-- Run this in Supabase SQL Editor to ensure clients receive updates

-- 1. Enable replication for tables
ALTER TABLE game_sessions REPLICA IDENTITY FULL;
ALTER TABLE game_players REPLICA IDENTITY FULL;
ALTER TABLE player_answers REPLICA IDENTITY FULL;

-- 2. Reset and Re-create Realtime Publication
-- This ensures a clean state for the publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- 3. Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_answers;

-- Verification
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
