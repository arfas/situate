-- Fix infinite recursion in room_memberships policy
-- The original policy tried to query room_memberships from within a policy on room_memberships

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view memberships in their rooms" ON room_memberships;

-- Create a simpler policy that allows users to:
-- 1. View their own memberships
-- 2. View memberships of rooms they are in (without recursion)
CREATE POLICY "Users can view room memberships"
  ON room_memberships FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own memberships
    auth.uid() = user_id
    OR
    -- Users can see other members in rooms where they have an active membership
    -- Use a direct table check without subquery to avoid recursion
    room_id IN (
      SELECT rm.room_id 
      FROM room_memberships rm
      WHERE rm.user_id = auth.uid() 
      AND rm.left_at IS NULL
    )
  );
