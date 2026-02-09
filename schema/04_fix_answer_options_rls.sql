-- Fix RLS for answer_options to ensure they can be inserted and viewed

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Answers viewable" ON answer_options;
DROP POLICY IF EXISTS "Answers manageable" ON answer_options;

-- Re-create stricter but robust policies
-- 1. Everyone can view answer options (needed for gameplay)
CREATE POLICY "Answers viewable" ON answer_options 
FOR SELECT USING (true);

-- 2. Only the quiz creator can INSERT/UPDATE/DELETE
-- We link answer -> question -> quiz -> creator
CREATE POLICY "Creators can manage answers" ON answer_options 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM questions 
    JOIN quizzes ON quizzes.id = questions.quiz_id 
    WHERE questions.id = answer_options.question_id 
    AND quizzes.creator_id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;
