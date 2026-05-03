-- Whiteboard Schema
CREATE TABLE IF NOT EXISTS whiteboard_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  target_date DATE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whiteboard_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES whiteboard_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, user_id)
);

CREATE TABLE IF NOT EXISTS whiteboard_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES whiteboard_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Gallery Schema
CREATE TABLE IF NOT EXISTS gallery_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Constraint for 1 post per day per user
CREATE UNIQUE INDEX IF NOT EXISTS gallery_posts_user_date_idx 
ON gallery_posts (user_id, (CAST(created_at AT TIME ZONE 'UTC' AS DATE)));

CREATE TABLE IF NOT EXISTS gallery_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS gallery_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE whiteboard_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;

-- Whiteboard Policies
-- Questions: everyone can read. Server inserts.
CREATE POLICY "Public read whiteboard questions" ON whiteboard_questions FOR SELECT USING (true);

-- Votes: users can vote and read votes
CREATE POLICY "Public read whiteboard votes" ON whiteboard_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own votes" ON whiteboard_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Answers: public read, users can insert, update, and delete their own
CREATE POLICY "Public read whiteboard answers" ON whiteboard_answers FOR SELECT USING (true);
CREATE POLICY "Users can insert their own answers" ON whiteboard_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own answers" ON whiteboard_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own answers" ON whiteboard_answers FOR DELETE USING (auth.uid() = user_id);

-- Gallery Policies
-- Posts: read approved posts or own pending posts
CREATE POLICY "Read gallery posts" ON gallery_posts FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Users can insert gallery posts" ON gallery_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Edge functions or admins update status, so users don't update posts (or maybe they can update description, but let's restrict for now)

-- Gallery Votes
CREATE POLICY "Public read gallery votes" ON gallery_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own gallery votes" ON gallery_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gallery votes" ON gallery_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own gallery votes" ON gallery_votes FOR DELETE USING (auth.uid() = user_id);

-- Gallery Comments
CREATE POLICY "Public read gallery comments" ON gallery_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own gallery comments" ON gallery_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gallery comments" ON gallery_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own gallery comments" ON gallery_comments FOR DELETE USING (auth.uid() = user_id);
