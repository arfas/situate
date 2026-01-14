-- Complete fix for all message RLS policies
-- Run this in Supabase SQL Editor

-- First, let's see what policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'messages';

-- Drop ALL existing policies on messages
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON messages;
DROP POLICY IF EXISTS "Members can post messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Recreate SELECT policy
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

-- Recreate INSERT policy
CREATE POLICY "Members can post messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM room_memberships rm
      WHERE rm.room_id = messages.room_id
      AND rm.user_id = auth.uid()
      AND rm.left_at IS NULL
    )
  );

-- Create UPDATE policy - check ownership and membership
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM room_memberships rm
      WHERE rm.room_id = messages.room_id
      AND rm.user_id = auth.uid()
      AND rm.left_at IS NULL
    )
  );

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'messages';
