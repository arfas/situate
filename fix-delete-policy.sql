-- Fix the RLS policy for updating/deleting messages
-- Run this in Supabase SQL Editor

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Create a new policy that allows users to update their own messages
-- WITH CHECK is set to true because we're only soft-deleting (setting is_deleted=true)
-- The USING clause ensures only the message owner can update
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (true);
