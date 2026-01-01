/*
  # Create Core Schema for Situational Support Chat App

  ## Overview
  This migration creates the foundational database structure for a peer support chat platform
  where users can join topic-based rooms with configurable anonymity settings.

  ## New Tables

  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, pk) - References auth.users
  - `email` (text) - User email
  - `created_at` (timestamptz) - Account creation time
  - `subscription_tier` (text) - free, premium, etc.
  - `default_anonymity_preference` (text) - Default anonymity setting
  - `persistent_pseudonym` (text) - Optional pseudonym used across rooms
  - `updated_at` (timestamptz) - Last profile update

  ### 2. `rooms`
  Chat rooms organized by situation/topic
  - `id` (uuid, pk) - Room identifier
  - `title` (text) - Room name
  - `description` (text) - Room description
  - `category` (text) - Category/tag for grouping
  - `created_at` (timestamptz) - Creation time
  - `created_by` (uuid) - Creator user id
  - `member_count` (int) - Cached member count
  - `message_count` (int) - Cached message count
  - `last_activity` (timestamptz) - Last message time
  - `is_archived` (boolean) - Soft delete flag
  - `embedding` (vector) - AI embedding for semantic search (added later)

  ### 3. `room_memberships`
  Tracks which users are in which rooms with their anonymity settings
  - `id` (uuid, pk) - Membership identifier
  - `user_id` (uuid) - User reference
  - `room_id` (uuid) - Room reference
  - `joined_at` (timestamptz) - Join time
  - `display_name` (text) - How user appears in this room
  - `anonymity_level` (text) - anonymous, pseudonym, semi_anonymous, verified
  - `role` (text) - member, moderator, admin
  - `left_at` (timestamptz) - NULL if still member

  ### 4. `messages`
  All messages posted in rooms
  - `id` (uuid, pk) - Message identifier
  - `room_id` (uuid) - Room reference
  - `user_id` (uuid) - Author reference
  - `content` (text) - Message text
  - `created_at` (timestamptz) - Post time
  - `updated_at` (timestamptz) - Last edit time
  - `parent_message_id` (uuid) - For threaded replies
  - `upvotes` (int) - Cached upvote count
  - `downvotes` (int) - Cached downvote count
  - `is_pinned` (boolean) - Pinned by moderator
  - `is_deleted` (boolean) - Soft delete flag
  - `is_hidden` (boolean) - Hidden by moderator

  ### 5. `votes`
  User votes on messages
  - `id` (uuid, pk) - Vote identifier
  - `user_id` (uuid) - Voter reference
  - `message_id` (uuid) - Message reference
  - `vote_type` (text) - 'up' or 'down'
  - `created_at` (timestamptz) - Vote time
  - Unique constraint on (user_id, message_id)

  ### 6. `reports`
  User reports for moderation
  - `id` (uuid, pk) - Report identifier
  - `message_id` (uuid) - Reported message
  - `reporter_id` (uuid) - User who reported
  - `reason` (text) - spam, harassment, misinformation, other
  - `details` (text) - Additional context
  - `status` (text) - pending, reviewed, dismissed, actioned
  - `created_at` (timestamptz) - Report time
  - `reviewed_by` (uuid) - Moderator who reviewed
  - `reviewed_at` (timestamptz) - Review time

  ## Security
  - Enable RLS on all tables
  - Users can read their own profiles
  - Users can update their own profiles
  - Users can view non-archived rooms
  - Users can join/leave rooms
  - Users can post messages in rooms they've joined
  - Users can vote on messages
  - Users can report messages
  - Only moderators can review reports

  ## Performance
  - Indexes on foreign keys
  - Indexes for common queries (room search, message threads)
  - Indexes for real-time subscriptions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'professional')),
  default_anonymity_preference text DEFAULT 'anonymous' CHECK (default_anonymity_preference IN ('anonymous', 'pseudonym', 'semi_anonymous', 'verified')),
  persistent_pseudonym text
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count int DEFAULT 0 CHECK (member_count >= 0),
  message_count int DEFAULT 0 CHECK (message_count >= 0),
  last_activity timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-archived rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (is_archived = false);

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create room_memberships table
CREATE TABLE IF NOT EXISTS room_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  display_name text NOT NULL,
  anonymity_level text DEFAULT 'anonymous' CHECK (anonymity_level IN ('anonymous', 'pseudonym', 'semi_anonymous', 'verified')),
  role text DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  UNIQUE(user_id, room_id)
);

ALTER TABLE room_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view room memberships"
  ON room_memberships FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own memberships
    auth.uid() = user_id
    OR
    -- Users can see other members in rooms where they have an active membership
    room_id IN (
      SELECT rm.room_id 
      FROM room_memberships rm
      WHERE rm.user_id = auth.uid() 
      AND rm.left_at IS NULL
    )
  );

CREATE POLICY "Users can create their own memberships"
  ON room_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships"
  ON room_memberships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  parent_message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  upvotes int DEFAULT 0 CHECK (upvotes >= 0),
  downvotes int DEFAULT 0 CHECK (downvotes >= 0),
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  is_hidden boolean DEFAULT false
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rooms"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships rm
      WHERE rm.room_id = messages.room_id
      AND rm.user_id = auth.uid()
      AND rm.left_at IS NULL
    )
    AND is_deleted = false
  );

CREATE POLICY "Members can post messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_memberships rm
      WHERE rm.room_id = messages.room_id
      AND rm.user_id = auth.uid()
      AND rm.left_at IS NULL
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, message_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view votes on messages they can see"
  ON votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN room_memberships rm ON rm.room_id = m.room_id
      WHERE m.id = votes.message_id
      AND rm.user_id = auth.uid()
      AND rm.left_at IS NULL
    )
  );

CREATE POLICY "Users can create votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'misinformation', 'self_harm', 'other')),
  details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_category ON rooms(category);
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_room_memberships_user_id ON room_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_room_memberships_room_id ON room_memberships(room_id);
CREATE INDEX IF NOT EXISTS idx_room_memberships_active ON room_memberships(room_id, user_id) WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_score ON messages(room_id, (upvotes - downvotes) DESC);

CREATE INDEX IF NOT EXISTS idx_votes_message_id ON votes(message_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_message ON votes(user_id, message_id);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_message_id ON reports(message_id);

-- Create function to update room stats
CREATE OR REPLACE FUNCTION update_room_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'messages' THEN
      UPDATE rooms 
      SET message_count = message_count + 1,
          last_activity = NEW.created_at
      WHERE id = NEW.room_id;
    ELSIF TG_TABLE_NAME = 'room_memberships' AND NEW.left_at IS NULL THEN
      UPDATE rooms 
      SET member_count = member_count + 1
      WHERE id = NEW.room_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'room_memberships' AND OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
      UPDATE rooms 
      SET member_count = GREATEST(member_count - 1, 0)
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for room stats
DROP TRIGGER IF EXISTS trigger_update_room_message_count ON messages;
CREATE TRIGGER trigger_update_room_message_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_room_stats();

DROP TRIGGER IF EXISTS trigger_update_room_member_count ON room_memberships;
CREATE TRIGGER trigger_update_room_member_count
  AFTER INSERT OR UPDATE ON room_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_room_stats();

-- Create function to update message vote counts
CREATE OR REPLACE FUNCTION update_message_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE messages SET upvotes = upvotes + 1 WHERE id = NEW.message_id;
    ELSE
      UPDATE messages SET downvotes = downvotes + 1 WHERE id = NEW.message_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE messages SET upvotes = GREATEST(upvotes - 1, 0), downvotes = downvotes + 1 WHERE id = NEW.message_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE messages SET downvotes = GREATEST(downvotes - 1, 0), upvotes = upvotes + 1 WHERE id = NEW.message_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE messages SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.message_id;
    ELSE
      UPDATE messages SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.message_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vote counts
DROP TRIGGER IF EXISTS trigger_update_message_vote_counts ON votes;
CREATE TRIGGER trigger_update_message_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_message_vote_counts();

-- Create function to auto-hide reported messages
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
  report_count int;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE message_id = NEW.message_id
  AND status = 'pending';
  
  IF report_count >= 3 THEN
    UPDATE messages
    SET is_hidden = true
    WHERE id = NEW.message_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-hiding
DROP TRIGGER IF EXISTS trigger_check_report_threshold ON reports;
CREATE TRIGGER trigger_check_report_threshold
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_report_threshold();