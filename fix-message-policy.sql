-- Fix the RLS policy for messages to allow inserts
-- Run this in Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Members can post messages" ON messages;

-- Create a simpler policy that just checks membership exists
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
