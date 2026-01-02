-- Fix infinite recursion in room_memberships policy
-- The original policy tried to query room_memberships from within a policy on room_memberships

-- Drop the problematic policies (try both possible names)
DROP POLICY IF EXISTS "Users can view memberships in their rooms" ON room_memberships;
DROP POLICY IF EXISTS "Users can view room memberships" ON room_memberships;

-- Create a simple non-recursive policy
-- Users can only view their own memberships
-- To see other members in a room, we'll need to use a SECURITY DEFINER function or service role
CREATE POLICY "Users can view their own memberships"
  ON room_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
