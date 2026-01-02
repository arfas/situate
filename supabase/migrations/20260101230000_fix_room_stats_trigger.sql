-- Fix room stats trigger to properly bypass RLS
-- The issue: triggers need to update rooms.member_count but users don't have permission

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_room_member_count ON room_memberships;
DROP TRIGGER IF EXISTS trigger_update_room_message_count ON messages;
DROP FUNCTION IF EXISTS update_room_stats();

-- Drop the existing restrictive update policy on rooms
DROP POLICY IF EXISTS "Room creators can update their rooms" ON rooms;

-- Recreate the function with proper SECURITY DEFINER and SET search_path
CREATE OR REPLACE FUNCTION update_room_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Recreate triggers
CREATE TRIGGER trigger_update_room_message_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_room_stats();

CREATE TRIGGER trigger_update_room_member_count
  AFTER INSERT OR UPDATE ON room_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_room_stats();

-- Create a more flexible policy for rooms updates
-- Allow creators to update any field, and allow system (triggers) to update stats
CREATE POLICY "Room updates allowed"
  ON rooms FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by  -- Creators can update their rooms
  )
  WITH CHECK (
    auth.uid() = created_by  -- Creators can update their rooms
  );
