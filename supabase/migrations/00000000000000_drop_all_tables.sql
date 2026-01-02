-- Drop all tables in reverse dependency order
-- Run this in Supabase SQL Editor to start fresh

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_check_report_threshold ON reports;
DROP TRIGGER IF EXISTS trigger_update_message_vote_counts ON votes;
DROP TRIGGER IF EXISTS trigger_update_room_member_count ON room_memberships;
DROP TRIGGER IF EXISTS trigger_update_room_message_count ON messages;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS check_report_threshold();
DROP FUNCTION IF EXISTS update_message_vote_counts();
DROP FUNCTION IF EXISTS update_room_stats();
DROP FUNCTION IF EXISTS search_rooms_semantic(vector(1536), float, int);
DROP FUNCTION IF EXISTS search_rooms_hybrid(text, vector(1536), int);

-- Drop views
DROP VIEW IF EXISTS analytics_dashboard_summary CASCADE;
DROP VIEW IF EXISTS time_to_first_message CASCADE;
DROP VIEW IF EXISTS report_reasons_breakdown CASCADE;
DROP VIEW IF EXISTS safety_metrics CASCADE;
DROP VIEW IF EXISTS high_quality_messages CASCADE;
DROP VIEW IF EXISTS top_engaging_rooms CASCADE;
DROP VIEW IF EXISTS cohort_retention CASCADE;
DROP VIEW IF EXISTS room_participation_per_user CASCADE;
DROP VIEW IF EXISTS user_engagement_stats CASCADE;
DROP VIEW IF EXISTS active_users_metrics CASCADE;
DROP VIEW IF EXISTS search_queries_analysis CASCADE;
DROP VIEW IF EXISTS daily_signups CASCADE;

-- Drop tables in reverse dependency order (child tables first)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS room_member_keys CASCADE;
DROP TABLE IF EXISTS user_encryption_keys CASCADE;
DROP TABLE IF EXISTS room_memberships CASCADE;
DROP TABLE IF EXISTS search_queries CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Optional: Drop the pgvector extension if you want to completely reset
-- DROP EXTENSION IF EXISTS vector;
