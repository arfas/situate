-- Sample data to populate the database with test rooms
-- Run this in Supabase SQL Editor after authentication is set up

-- Insert sample rooms (you'll need to replace 'YOUR_USER_ID' with an actual user ID)
INSERT INTO rooms (title, description, category, created_by) VALUES
  ('Tech Layoffs 2025', 'Support for those recently laid off from tech companies. Share job leads, interview tips, and emotional support.', 'Career', NULL),
  ('New Parent Support', 'First-time parents sharing experiences, advice, and late-night struggles. You are not alone!', 'Parenting', NULL),
  ('Career Transition at 40+', 'Making a career change later in life. Discussing challenges, opportunities, and success stories.', 'Career', NULL),
  ('Chronic Pain Community', 'Living with chronic pain conditions. Share coping strategies, treatments, and support.', 'Health', NULL),
  ('Remote Work Life', 'Tips and tricks for working from home. Combat isolation, stay productive, and maintain work-life balance.', 'Work', NULL),
  ('Divorce Recovery', 'Support for those going through or recovering from divorce. Share experiences and healing strategies.', 'Relationships', NULL),
  ('Starting a Side Hustle', 'Building a business while working full-time. Share ideas, progress, and challenges.', 'Entrepreneurship', NULL),
  ('Anxiety Management', 'Coping with anxiety disorders. Share techniques, wins, and support each other through tough days.', 'Mental Health', NULL),
  ('Solo Travel Adventures', 'Tips, stories, and safety advice for traveling alone. Connect before trips and share experiences.', 'Travel', NULL),
  ('Moving to a New City', 'Starting over in a new place. Find local recommendations, make friends, and navigate the challenges.', 'Life Transitions', NULL);

-- Note: To generate embeddings for these rooms, you'll need to:
-- 1. Create an account in the app
-- 2. Use the search feature (this triggers embedding generation)
-- OR
-- 3. Call the generate-embeddings Edge Function for each room

-- Example of how to call the Edge Function (after rooms are created):
-- You would do this via your app or using curl:
/*
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/generate-embeddings' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Tech Layoffs 2025 Support for those recently laid off from tech companies",
    "roomId": "ROOM_ID_HERE"
  }'
*/

-- Verify rooms were created
SELECT id, title, category, member_count, message_count FROM rooms ORDER BY created_at DESC;
