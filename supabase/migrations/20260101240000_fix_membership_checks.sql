-- Fix membership checks to avoid infinite recursion
-- Create helper function that bypasses RLS to check if user is a member of a room

-- Create a SECURITY DEFINER function to check room membership
CREATE OR REPLACE FUNCTION is_room_member(check_room_id uuid, check_user_id uuid)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM room_memberships 
    WHERE room_id = check_room_id 
    AND user_id = check_user_id 
    AND left_at IS NULL
  );
END;
$$;

-- Drop and recreate messages policies to use the helper function
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON messages;
DROP POLICY IF EXISTS "Members can post messages" ON messages;

CREATE POLICY "Users can view messages in their rooms"
  ON messages FOR SELECT
  TO authenticated
  USING (
    is_room_member(room_id, auth.uid())
    AND is_deleted = false
  );

CREATE POLICY "Members can post messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    is_room_member(room_id, auth.uid())
    AND auth.uid() = user_id
  );

-- Update votes policy to use helper function
DROP POLICY IF EXISTS "Users can view votes in their rooms" ON votes;

CREATE POLICY "Users can view votes in their rooms"
  ON votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = votes.message_id
      AND is_room_member(m.room_id, auth.uid())
    )
  );

-- Update votes insert policy
DROP POLICY IF EXISTS "Members can vote on messages" ON votes;

CREATE POLICY "Members can vote on messages"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = votes.message_id
      AND is_room_member(m.room_id, auth.uid())
    )
    AND auth.uid() = user_id
  );

-- Update votes update policy
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;

CREATE POLICY "Users can update their own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
