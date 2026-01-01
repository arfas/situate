-- Analytics views and helper functions for tracking product health metrics

-- ============================================================================
-- ACQUISITION METRICS
-- ============================================================================

-- Daily signups with trend
CREATE OR REPLACE VIEW daily_signups AS
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as signups,
  COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE(created_at)) as change_from_previous_day
FROM auth.users
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Search queries aggregated by day
CREATE OR REPLACE VIEW search_queries_analysis AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_searches,
  COUNT(DISTINCT user_id) as unique_searchers,
  AVG(CASE WHEN results_count > 0 THEN 1.0 ELSE 0.0 END) as success_rate
FROM (
  -- This would come from PostHog events, but we can track in DB too
  SELECT 
    created_at,
    user_id,
    0 as results_count -- Placeholder, would need to log this
  FROM profiles
  LIMIT 0 -- Placeholder view structure
) search_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- ENGAGEMENT METRICS
-- ============================================================================

-- Daily/Weekly/Monthly Active Users
CREATE OR REPLACE VIEW active_users_metrics AS
WITH user_activity AS (
  SELECT DISTINCT
    user_id,
    DATE(created_at) as activity_date
  FROM messages
  UNION
  SELECT DISTINCT
    user_id,
    DATE(created_at) as activity_date
  FROM room_memberships
)
SELECT 
  'DAU' as metric,
  CURRENT_DATE as date,
  COUNT(DISTINCT user_id) as user_count
FROM user_activity
WHERE activity_date = CURRENT_DATE
UNION ALL
SELECT 
  'WAU' as metric,
  CURRENT_DATE as date,
  COUNT(DISTINCT user_id) as user_count
FROM user_activity
WHERE activity_date >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  'MAU' as metric,
  CURRENT_DATE as date,
  COUNT(DISTINCT user_id) as user_count
FROM user_activity
WHERE activity_date >= CURRENT_DATE - INTERVAL '30 days';

-- Messages sent per user (engagement depth)
CREATE OR REPLACE VIEW user_engagement_stats AS
SELECT 
  user_id,
  COUNT(*) as total_messages,
  COUNT(DISTINCT room_id) as rooms_participated,
  MIN(created_at) as first_message_date,
  MAX(created_at) as last_message_date,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 86400 as days_active
FROM messages
GROUP BY user_id
ORDER BY total_messages DESC;

-- Room participation metrics
CREATE OR REPLACE VIEW room_participation_per_user AS
SELECT 
  user_id,
  COUNT(*) as rooms_joined,
  COUNT(CASE WHEN anonymity_level != 'identified' THEN 1 END) as anonymous_joins,
  MIN(created_at) as first_join_date,
  MAX(created_at) as last_join_date
FROM room_memberships
GROUP BY user_id;

-- ============================================================================
-- RETENTION METRICS
-- ============================================================================

-- Cohort analysis: users who return after N days
CREATE OR REPLACE VIEW cohort_retention AS
WITH user_cohorts AS (
  SELECT 
    user_id,
    DATE(created_at) as cohort_date,
    created_at
  FROM auth.users
),
user_activity_dates AS (
  SELECT DISTINCT
    user_id,
    DATE(created_at) as activity_date
  FROM messages
)
SELECT 
  c.cohort_date,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE 
    WHEN a.activity_date = c.cohort_date + INTERVAL '1 day' 
    THEN c.user_id 
  END) as day_1_retained,
  COUNT(DISTINCT CASE 
    WHEN a.activity_date BETWEEN c.cohort_date + INTERVAL '7 days' 
      AND c.cohort_date + INTERVAL '8 days'
    THEN c.user_id 
  END) as day_7_retained,
  COUNT(DISTINCT CASE 
    WHEN a.activity_date BETWEEN c.cohort_date + INTERVAL '30 days' 
      AND c.cohort_date + INTERVAL '31 days'
    THEN c.user_id 
  END) as day_30_retained,
  ROUND(100.0 * COUNT(DISTINCT CASE 
    WHEN a.activity_date = c.cohort_date + INTERVAL '1 day' 
    THEN c.user_id 
  END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as day_1_retention_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE 
    WHEN a.activity_date BETWEEN c.cohort_date + INTERVAL '7 days' 
      AND c.cohort_date + INTERVAL '8 days'
    THEN c.user_id 
  END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as day_7_retention_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE 
    WHEN a.activity_date BETWEEN c.cohort_date + INTERVAL '30 days' 
      AND c.cohort_date + INTERVAL '31 days'
    THEN c.user_id 
  END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as day_30_retention_rate
FROM user_cohorts c
LEFT JOIN user_activity_dates a ON c.user_id = a.user_id
GROUP BY c.cohort_date
ORDER BY c.cohort_date DESC;

-- Most engaging rooms by activity
CREATE OR REPLACE VIEW top_engaging_rooms AS
SELECT 
  r.id,
  r.title,
  r.category,
  COUNT(DISTINCT m.user_id) as unique_participants,
  COUNT(m.id) as total_messages,
  COUNT(DISTINCT DATE(m.created_at)) as days_with_activity,
  MAX(m.created_at) as last_activity,
  ROUND(AVG(m.upvotes), 2) as avg_upvotes_per_message
FROM rooms r
LEFT JOIN messages m ON r.id = m.room_id
GROUP BY r.id, r.title, r.category
ORDER BY total_messages DESC, unique_participants DESC;

-- ============================================================================
-- QUALITY METRICS
-- ============================================================================

-- High quality messages (10+ upvotes)
CREATE OR REPLACE VIEW high_quality_messages AS
SELECT 
  m.id,
  m.room_id,
  r.title as room_title,
  m.content,
  m.upvotes,
  m.created_at,
  rm.display_name as author_display_name
FROM messages m
JOIN rooms r ON m.room_id = r.id
JOIN room_memberships rm ON m.user_id = rm.user_id AND m.room_id = rm.room_id
WHERE m.upvotes >= 10
ORDER BY m.upvotes DESC, m.created_at DESC;

-- Safety metrics: report rate
CREATE OR REPLACE VIEW safety_metrics AS
SELECT 
  DATE(r.created_at) as date,
  COUNT(r.id) as total_reports,
  COUNT(DISTINCT r.message_id) as unique_messages_reported,
  COUNT(DISTINCT r.reported_by) as unique_reporters,
  COUNT(r.id)::float / NULLIF((
    SELECT COUNT(*) 
    FROM messages 
    WHERE DATE(created_at) = DATE(r.created_at)
  ), 0) as report_rate
FROM reports r
GROUP BY DATE(r.created_at)
ORDER BY date DESC;

-- Report reasons breakdown
CREATE OR REPLACE VIEW report_reasons_breakdown AS
SELECT 
  reason,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage,
  COUNT(DISTINCT message_id) as unique_messages
FROM reports
GROUP BY reason
ORDER BY count DESC;

-- Average time to first message after joining
CREATE OR REPLACE VIEW time_to_first_message AS
SELECT 
  rm.room_id,
  r.title as room_title,
  AVG(EXTRACT(EPOCH FROM (m.first_message_time - rm.created_at))) / 60 as avg_minutes_to_first_message,
  COUNT(DISTINCT rm.user_id) as users_who_messaged
FROM room_memberships rm
JOIN rooms r ON rm.room_id = r.id
JOIN (
  SELECT 
    room_id,
    user_id,
    MIN(created_at) as first_message_time
  FROM messages
  GROUP BY room_id, user_id
) m ON rm.room_id = m.room_id AND rm.user_id = m.user_id
GROUP BY rm.room_id, r.title
HAVING COUNT(DISTINCT rm.user_id) >= 5 -- Only rooms with 5+ active users
ORDER BY avg_minutes_to_first_message;

-- ============================================================================
-- SUMMARY DASHBOARD VIEW
-- ============================================================================

CREATE OR REPLACE VIEW analytics_dashboard_summary AS
SELECT 
  'Total Users' as metric,
  (SELECT COUNT(*) FROM auth.users)::text as value,
  'all_time' as period
UNION ALL
SELECT 
  'New Signups (24h)',
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '24 hours')::text,
  'daily'
UNION ALL
SELECT 
  'DAU',
  (SELECT user_count::text FROM active_users_metrics WHERE metric = 'DAU'),
  'daily'
UNION ALL
SELECT 
  'WAU',
  (SELECT user_count::text FROM active_users_metrics WHERE metric = 'WAU'),
  'weekly'
UNION ALL
SELECT 
  'MAU',
  (SELECT user_count::text FROM active_users_metrics WHERE metric = 'MAU'),
  'monthly'
UNION ALL
SELECT 
  'Total Messages',
  (SELECT COUNT(*)::text FROM messages),
  'all_time'
UNION ALL
SELECT 
  'Messages (24h)',
  (SELECT COUNT(*)::text FROM messages WHERE created_at >= NOW() - INTERVAL '24 hours'),
  'daily'
UNION ALL
SELECT 
  'Active Rooms',
  (SELECT COUNT(DISTINCT room_id)::text FROM messages WHERE created_at >= NOW() - INTERVAL '7 days'),
  'weekly'
UNION ALL
SELECT 
  'High Quality Messages',
  (SELECT COUNT(*)::text FROM messages WHERE upvotes >= 10),
  'all_time'
UNION ALL
SELECT 
  'Total Reports',
  (SELECT COUNT(*)::text FROM reports),
  'all_time'
UNION ALL
SELECT 
  'Report Rate (24h)',
  (
    SELECT ROUND(100.0 * COUNT(r.id)::float / NULLIF(COUNT(m.id), 0), 2)::text || '%'
    FROM reports r
    FULL OUTER JOIN messages m ON DATE(m.created_at) = CURRENT_DATE
    WHERE DATE(r.created_at) = CURRENT_DATE
  ),
  'daily';

COMMENT ON VIEW analytics_dashboard_summary IS 'Quick overview of key product health metrics';
