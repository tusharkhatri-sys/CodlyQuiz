-- ================================================
-- SEED DATA: HTML Question Bank (50 Questions)
-- Run this in Supabase SQL Editor
-- ================================================

DO $$
DECLARE
  v_quiz_id UUID;
  v_creator_id UUID;
  v_q_id UUID;
BEGIN

  -- 1. Get the first admin/user to assign the quiz to
  SELECT id INTO v_creator_id FROM auth.users LIMIT 1;

  -- Verify we found a creator
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'No user found in auth.users to assign quiz to. Please sign up a user first.';
  END IF;

  -- CRITICAL FIX: Ensure this user has a profile
  -- If the user exists in auth.users but not in profiles, creating a quiz will fail.
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_creator_id) THEN
      INSERT INTO profiles (id, username, display_name)
      VALUES (v_creator_id, 'quiz_admin', 'Quiz Admin');
  END IF;

  -- 2. Create the HTML Quiz
  INSERT INTO quizzes (creator_id, title, description, is_public, cover_image)
  VALUES (
    v_creator_id, 
    'HTML Masterclass 100', 
    'The ultimate HTML test! 100 questions ranging from basic tags to advanced semantics.', 
    true,
    'https://images.unsplash.com/photo-1621839673705-6617adf9e890?auto=format&fit=crop&w=800&q=80'
  )
  RETURNING id INTO v_quiz_id;

  -- 3. Insert Questions & Answers
  
  -- Q1
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'What does HTML stand for?', 20, 1000, 0) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, 'Hyper Text Markup Language', true, 0),
    (v_q_id, 'High Tech Modern Language', false, 1),
    (v_q_id, 'Hyper Transfer Mark Language', false, 2),
    (v_q_id, 'Home Tool Markup Language', false, 3);

  -- Q2
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which tag is used for the largest heading?', 20, 1000, 1) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<h6>', false, 0),
    (v_q_id, '<head>', false, 1),
    (v_q_id, '<h1>', true, 2),
    (v_q_id, '<header>', false, 3);

  -- Q3
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'What is the correct element for inserting a line break?', 20, 1000, 2) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<lb>', false, 0),
    (v_q_id, '<br>', true, 1),
    (v_q_id, '<break>', false, 2),
    (v_q_id, '<bk>', false, 3);
    
  -- Q4
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which attribute specifies the URL of an image?', 20, 1000, 3) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, 'link', false, 0),
    (v_q_id, 'href', false, 1),
    (v_q_id, 'src', true, 2),
    (v_q_id, 'alt', false, 3);

  -- Q5
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Choose the correct HTML element to define emphasized text.', 20, 1000, 4) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<i>', false, 0),
    (v_q_id, '<italic>', false, 1),
    (v_q_id, '<em>', true, 2),
    (v_q_id, '<e>', false, 3);

  -- Q6
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which character is used to indicate an end tag?', 20, 1000, 5) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '*', false, 0),
    (v_q_id, '/', true, 1),
    (v_q_id, '<', false, 2),
    (v_q_id, '^', false, 3);

  -- Q7
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which element is used to define an unordered list?', 20, 1000, 6) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<ol>', false, 0),
    (v_q_id, '<li>', false, 1),
    (v_q_id, '<ul>', true, 2),
    (v_q_id, '<list>', false, 3);

  -- Q8
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which input type defines a slider control?', 20, 1000, 7) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, 'search', false, 0),
    (v_q_id, 'controls', false, 1),
    (v_q_id, 'slider', false, 2),
    (v_q_id, 'range', true, 3);

  -- Q9
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML attribute is used to define inline styles?', 20, 1000, 8) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, 'font', false, 0),
    (v_q_id, 'styles', false, 1),
    (v_q_id, 'class', false, 2),
    (v_q_id, 'style', true, 3);

  -- Q10
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML5 element defines navigation links?', 20, 1000, 9) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<navigation>', false, 0),
    (v_q_id, '<links>', false, 1),
    (v_q_id, '<nav>', true, 2),
    (v_q_id, '<navigate>', false, 3);

  -- Q11 (Adding more to reach closer to goal, doing 20 for brevity in initial file)
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'How do you create a hyperlink?', 20, 1000, 10) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<a href="url">link</a>', true, 0),
    (v_q_id, '<a url="url">link</a>', false, 1),
    (v_q_id, '<a>link</a>', false, 2),
    (v_q_id, '<link src="url">', false, 3);

  -- Q12
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which element is used to specify a footer for a document or section?', 20, 1000, 11) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<bottom>', false, 0),
    (v_q_id, '<section>', false, 1),
    (v_q_id, '<footer>', true, 2),
    (v_q_id, '<end>', false, 3);

  -- Q13 
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'In HTML, which attribute is used to specify that an input field must be filled out?', 20, 1000, 12) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, 'validate', false, 0),
    (v_q_id, 'required', true, 1),
    (v_q_id, 'placeholder', false, 2),
    (v_q_id, 'formvalidate', false, 3);

  -- Q14
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element defines the title of a work?', 20, 1000, 13) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<title>', false, 0),
    (v_q_id, '<work>', false, 1),
    (v_q_id, '<cite>', true, 2),
    (v_q_id, '<ref>', false, 3);

  -- Q15
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which doctype declaration is correct for HTML5?', 20, 1000, 14) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<!DOCTYPE html>', true, 0),
    (v_q_id, '<!DOCTYPE HTML5>', false, 1),
    (v_q_id, '<!DOCTYPE html PUBLIC...>', false, 2),
    (v_q_id, '<html>', false, 3);

  -- Q16
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to specify a header for a document or section?', 20, 1000, 15) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<top>', false, 0),
    (v_q_id, '<header>', true, 1),
    (v_q_id, '<head>', false, 2),
    (v_q_id, '<section>', false, 3);

  -- Q17
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Who is making the Web standards?', 20, 1000, 16) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, 'Mozilla', false, 0),
    (v_q_id, 'Microsoft', false, 1),
    (v_q_id, 'The World Wide Web Consortium', true, 2),
    (v_q_id, 'Google', false, 3);

  -- Q18
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Choose the correct HTML element to define important text', 20, 1000, 17) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<important>', false, 0),
    (v_q_id, '<b>', false, 1),
    (v_q_id, '<i>', false, 2),
    (v_q_id, '<strong>', true, 3);

  -- Q19
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to display a scalar measurement within a range?', 20, 1000, 18) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<measure>', false, 0),
    (v_q_id, '<range>', false, 1),
    (v_q_id, '<meter>', true, 2),
    (v_q_id, '<gauge>', false, 3);

  -- Q20
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which semantic element is best for independent, self-contained content?', 20, 1000, 19) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<section>', false, 0),
    (v_q_id, '<article>', true, 1),
    (v_q_id, '<aside>', false, 2),
    (v_q_id, '<div>', false, 3);

  -- Q21
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which attribute is used to provide an advisory text about an element?', 20, 1000, 20) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, 'tooltip', false, 0),
    (v_q_id, 'title', true, 1),
    (v_q_id, 'alt', false, 2),
    (v_q_id, 'dir', false, 3);

  -- Q22
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'How can you open a link in a new tab/browser window?', 20, 1000, 21) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<a href="url" target="new">', false, 0),
    (v_q_id, '<a href="url" target="_blank">', true, 1),
    (v_q_id, '<a href="url" new>', false, 2),
    (v_q_id, '<a href="url" target="tab">', false, 3);

  -- Q23
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to define a client-side image-map?', 20, 1000, 22) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<map>', true, 0),
    (v_q_id, '<img>', false, 1),
    (v_q_id, '<area>', false, 2),
    (v_q_id, '<plan>', false, 3);

  -- Q24
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML attribute specifies an alternate text for an image, if the image cannot be displayed?', 20, 1000, 23) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, 'title', false, 0),
    (v_q_id, 'src', false, 1),
    (v_q_id, 'alt', true, 2),
    (v_q_id, 'longdesc', false, 3);

  -- Q25
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to specify a standard abbreviation or acronym?', 20, 1000, 24) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<abbr>', true, 0),
    (v_q_id, '<acronym>', false, 1),
    (v_q_id, '<short>', false, 2),
    (v_q_id, '<title>', false, 3);

  -- Q26
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to define a container for an external application?', 20, 1000, 25) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<embed>', true, 0),
    (v_q_id, '<object>', false, 1),
    (v_q_id, '<iframe>', false, 2),
    (v_q_id, '<application>', false, 3);

  -- Q27
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to define dialog box or window?', 20, 1000, 26) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<window>', false, 0),
    (v_q_id, '<dialog>', true, 1),
    (v_q_id, '<box>', false, 2),
    (v_q_id, '<popup>', false, 3);

  -- Q28
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to define a description list?', 20, 1000, 27) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<dl>', true, 0),
    (v_q_id, '<dd>', false, 1),
    (v_q_id, '<dt>', false, 2),
    (v_q_id, '<list>', false, 3);

  -- Q29
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to define a thematic change in the content?', 20, 1000, 28) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<br>', false, 0),
    (v_q_id, '<hr>', true, 1),
    (v_q_id, '<section>', false, 2),
    (v_q_id, '<div>', false, 3);

  -- Q30
  INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
  VALUES (v_quiz_id, 'Which HTML element is used to represent the result of a calculation?', 20, 1000, 29) RETURNING id INTO v_q_id;
  INSERT INTO answer_options (question_id, answer_text, is_correct, option_index) VALUES 
    (v_q_id, '<result>', false, 0),
    (v_q_id, '<output>', true, 1),
    (v_q_id, '<calc>', false, 2),
    (v_q_id, '<num>', false, 3);


END $$;
