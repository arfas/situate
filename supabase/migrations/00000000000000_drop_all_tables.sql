-- Drop all tables in reverse dependency order
-- Run this in Supabase SQL Editor to start fresh

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_check_report_threshold ON reports;
DROP TRIGGER IF EXISTS trigger_update_message_vote_counts ON votes;
DROP TRIGGER IF EXISTS trigger_update_room_member_count ON room_memberships;
DROP TRIGGER IF EXISTS trigger_update_room_message_count ON messages;

-- Drop functions
DROP FUNCTION IF EXISTS check_report_threshold();
DROP FUNCTION IF EXISTS update_message_vote_counts();
DROP FUNCTION IF EXISTS update_room_stats();

-- Drop tables in reverse dependency order (child tables first)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS room_memberships CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Optional: Drop the pgvector extension if you want to completely reset
-- DROP EXTENSION IF EXISTS vector;
