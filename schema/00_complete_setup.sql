-- ============================================
-- Quizzy Complete Database Schema (Fixed)
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (No auto-trigger)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. QUIZZES & QUESTIONS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_public BOOLEAN DEFAULT false,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_image TEXT,
  question_type VARCHAR(20) DEFAULT 'multiple_choice',
  time_limit INTEGER DEFAULT 20,
  points INTEGER DEFAULT 1000,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answer_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_text VARCHAR(500) NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quizzes viewable" ON quizzes FOR SELECT USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "Users can create quizzes" ON quizzes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own quizzes" ON quizzes FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own quizzes" ON quizzes FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Questions viewable" ON questions FOR SELECT USING (true);
CREATE POLICY "Questions manageable" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.creator_id = auth.uid())
);

CREATE POLICY "Answers viewable" ON answer_options FOR SELECT USING (true);
CREATE POLICY "Answers manageable" ON answer_options FOR ALL USING (
  EXISTS (SELECT 1 FROM questions JOIN quizzes ON quizzes.id = questions.quiz_id WHERE questions.id = answer_options.question_id AND quizzes.creator_id = auth.uid())
);

-- ============================================
-- 3. GAME SESSIONS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_pin VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  current_question_index INTEGER DEFAULT 0,
  question_started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS game_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  nickname VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_id UUID REFERENCES game_players(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_index INTEGER,
  is_correct BOOLEAN DEFAULT false,
  time_taken_ms INTEGER,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions viewable" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Users can create sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update sessions" ON game_sessions FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete sessions" ON game_sessions FOR DELETE USING (auth.uid() = host_id);

CREATE POLICY "Players viewable" ON game_players FOR SELECT USING (true);
CREATE POLICY "Anyone can join" ON game_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update" ON game_players FOR UPDATE USING (true);

CREATE POLICY "Answers viewable" ON player_answers FOR SELECT USING (true);
CREATE POLICY "Players can answer" ON player_answers FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quizzes_creator ON quizzes(creator_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_pin ON game_sessions(game_pin);
CREATE INDEX IF NOT EXISTS idx_game_players_session ON game_players(session_id);

-- DONE! 🎉
