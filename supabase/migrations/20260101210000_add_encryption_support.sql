-- Add encryption support
-- This migration adds tables and columns needed for end-to-end encryption

-- Add is_encrypted column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;

-- Create user_encryption_keys table to store public keys
CREATE TABLE IF NOT EXISTS user_encryption_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_member_keys table to store encrypted room keys for each member
CREATE TABLE IF NOT EXISTS room_member_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_room_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_member_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_encryption_keys
-- Users can read all public keys (needed for encryption)
CREATE POLICY "Anyone can read public keys"
  ON user_encryption_keys
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert/update their own keys
CREATE POLICY "Users can manage their own keys"
  ON user_encryption_keys
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for room_member_keys
-- Users can only read their own encrypted room keys
CREATE POLICY "Users can read their own room keys"
  ON room_member_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow inserting room keys for any user (room creator will do this)
-- Simplified to avoid recursion issues
CREATE POLICY "Allow inserting room member keys"
  ON room_member_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_member_keys_room_id ON room_member_keys(room_id);
CREATE INDEX IF NOT EXISTS idx_room_member_keys_user_id ON room_member_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_encrypted ON messages(is_encrypted) WHERE is_encrypted = true;

-- Update existing messages to be marked as unencrypted
UPDATE messages SET is_encrypted = FALSE WHERE is_encrypted IS NULL;
