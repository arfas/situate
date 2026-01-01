-- ============================================================================
-- ANALYTICS DASHBOARD QUERIES
-- Copy these queries into your analytics tool (Metabase, Redash, etc.)
-- ============================================================================

-- ============================================================================
-- 1. ACQUISITION METRICS
-- ============================================================================

-- Query: Daily Signups Trend (Last 30 Days)
-- Chart Type: Line Chart
-- X-axis: signup_date, Y-axis: signups
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as signups,
  COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day') - 
  COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE - INTERVAL '2 days') as daily_change
FROM auth.users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY signup_date;

-- Query: Top Search Queries
-- Chart Type: Table
-- Use this to understand what situations users are looking for
-- NOTE: This requires logging search queries to database
-- Alternative: Export from PostHog events
SELECT 
  query_text,
  COUNT(*) as search_count,
  AVG(results_count) as avg_results,
  COUNT(DISTINCT user_id) as unique_users
FROM search_logs -- You'd need to create this table to log searches
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY query_text
ORDER BY search_count DESC
LIMIT 20;

-- Query: Signup Source Breakdown
-- Chart Type: Pie Chart
-- Track where users are coming from (requires UTM tracking)
SELECT 
  COALESCE(signup_source, 'organic') as source,
  COUNT(*) as signups,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM profiles
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY signup_source
ORDER BY signups DESC;

-- ============================================================================
-- 2. ENGAGEMENT METRICS
-- ============================================================================

-- Query: DAU/WAU/MAU Trend (Last 90 Days)
-- Chart Type: Multi-Line Chart
WITH daily_metrics AS (
  SELECT 
    date,
    COUNT(DISTINCT user_id) as dau
  FROM (
    SELECT DATE(created_at) as date, user_id FROM messages
    UNION ALL
    SELECT DATE(created_at) as date, user_id FROM room_memberships
  ) activity
  WHERE date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY date
)
SELECT 
  date,
  dau,
  AVG(dau) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as wau_7day_avg,
  AVG(dau) OVER (ORDER BY date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as mau_30day_avg
FROM daily_metrics
ORDER BY date;

-- Query: Messages Per User Distribution
-- Chart Type: Histogram
SELECT 
  CASE 
    WHEN message_count = 1 THEN '1 message'
    WHEN message_count BETWEEN 2 AND 5 THEN '2-5 messages'
    WHEN message_count BETWEEN 6 AND 10 THEN '6-10 messages'
    WHEN message_count BETWEEN 11 AND 20 THEN '11-20 messages'
    WHEN message_count > 20 THEN '20+ messages'
  END as message_bucket,
  COUNT(*) as user_count
FROM (
  SELECT user_id, COUNT(*) as message_count
  FROM messages
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id
) user_messages
GROUP BY message_bucket
ORDER BY 
  CASE message_bucket
    WHEN '1 message' THEN 1
    WHEN '2-5 messages' THEN 2
    WHEN '6-10 messages' THEN 3
    WHEN '11-20 messages' THEN 4
    WHEN '20+ messages' THEN 5
  END;

-- Query: Rooms Joined Per User
-- Chart Type: Bar Chart
SELECT 
  CASE 
    WHEN room_count = 1 THEN '1 room'
    WHEN room_count BETWEEN 2 AND 3 THEN '2-3 rooms'
    WHEN room_count BETWEEN 4 AND 5 THEN '4-5 rooms'
    WHEN room_count > 5 THEN '6+ rooms'
  END as room_bucket,
  COUNT(*) as user_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM (
  SELECT user_id, COUNT(DISTINCT room_id) as room_count
  FROM room_memberships
  GROUP BY user_id
) user_rooms
GROUP BY room_bucket
ORDER BY 
  CASE room_bucket
    WHEN '1 room' THEN 1
    WHEN '2-3 rooms' THEN 2
    WHEN '4-5 rooms' THEN 3
    WHEN '6+ rooms' THEN 4
  END;

-- Query: Average Session Duration (From PostHog)
-- This query would pull from PostHog's session data
-- Use PostHog dashboard for this metric

-- ============================================================================
-- 3. RETENTION METRICS
-- ============================================================================

-- Query: Weekly Cohort Retention Table
-- Chart Type: Heatmap
WITH weekly_cohorts AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', created_at) as cohort_week
  FROM auth.users
),
weekly_activity AS (
  SELECT DISTINCT
    user_id,
    DATE_TRUNC('week', created_at) as activity_week
  FROM messages
)
SELECT 
  c.cohort_week,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week THEN c.user_id END) as week_0,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '1 week' THEN c.user_id END) as week_1,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '2 weeks' THEN c.user_id END) as week_2,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '3 weeks' THEN c.user_id END) as week_3,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '4 weeks' THEN c.user_id END) as week_4,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '1 week' THEN c.user_id END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 1) as week_1_retention_pct
FROM weekly_cohorts c
LEFT JOIN weekly_activity a ON c.user_id = a.user_id
WHERE c.cohort_week >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY c.cohort_week
ORDER BY c.cohort_week DESC;

-- Query: Churn Rate (Users who haven't returned in 30 days)
-- Chart Type: Single Number
SELECT 
  COUNT(DISTINCT user_id) as churned_users,
  ROUND(100.0 * COUNT(DISTINCT user_id) / (SELECT COUNT(*) FROM auth.users WHERE created_at < CURRENT_DATE - INTERVAL '30 days'), 2) as churn_rate_pct
FROM auth.users u
WHERE u.created_at < CURRENT_DATE - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM messages m 
    WHERE m.user_id = u.id 
      AND m.created_at >= CURRENT_DATE - INTERVAL '30 days'
  );

-- Query: Most Engaging Rooms (Last 30 Days)
-- Chart Type: Table
SELECT 
  r.id,
  r.title,
  r.category,
  COUNT(DISTINCT m.user_id) as unique_participants,
  COUNT(m.id) as total_messages,
  ROUND(AVG(m.upvotes), 1) as avg_upvotes,
  MAX(m.created_at) as last_activity
FROM rooms r
JOIN messages m ON r.id = m.room_id
WHERE m.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY r.id, r.title, r.category
HAVING COUNT(DISTINCT m.user_id) >= 3
ORDER BY unique_participants DESC, total_messages DESC
LIMIT 20;

-- ============================================================================
-- 4. QUALITY METRICS
-- ============================================================================

-- Query: High Quality Messages (10+ Upvotes)
-- Chart Type: Table with trend
SELECT 
  DATE(m.created_at) as date,
  COUNT(*) as high_quality_messages,
  COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM messages WHERE DATE(created_at) = DATE(m.created_at)), 0) as quality_rate
FROM messages m
WHERE m.upvotes >= 10
  AND m.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(m.created_at)
ORDER BY date DESC;

-- Query: Safety - Report Rate Trend
-- Chart Type: Line Chart
SELECT 
  DATE(r.created_at) as date,
  COUNT(r.id) as total_reports,
  COUNT(DISTINCT r.message_id) as unique_messages_reported,
  (
    SELECT COUNT(*) 
    FROM messages 
    WHERE DATE(created_at) = DATE(r.created_at)
  ) as total_messages_that_day,
  ROUND(100.0 * COUNT(r.id)::float / NULLIF((
    SELECT COUNT(*) 
    FROM messages 
    WHERE DATE(created_at) = DATE(r.created_at)
  ), 0), 3) as report_rate_pct
FROM reports r
WHERE r.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(r.created_at)
ORDER BY date;

-- Query: Report Reasons Breakdown
-- Chart Type: Pie Chart
SELECT 
  reason,
  COUNT(*) as report_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM reports
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY reason
ORDER BY report_count DESC;

-- Query: Time to First Message After Joining
-- Chart Type: Histogram
SELECT 
  CASE 
    WHEN minutes_to_first_message < 5 THEN '< 5 min'
    WHEN minutes_to_first_message < 15 THEN '5-15 min'
    WHEN minutes_to_first_message < 60 THEN '15-60 min'
    WHEN minutes_to_first_message < 1440 THEN '1-24 hours'
    ELSE '24+ hours'
  END as time_bucket,
  COUNT(*) as user_count,
  ROUND(AVG(minutes_to_first_message), 1) as avg_minutes
FROM (
  SELECT 
    rm.user_id,
    rm.room_id,
    EXTRACT(EPOCH FROM (MIN(m.created_at) - rm.created_at)) / 60 as minutes_to_first_message
  FROM room_memberships rm
  JOIN messages m ON rm.room_id = m.room_id AND rm.user_id = m.user_id
  WHERE rm.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY rm.user_id, rm.room_id, rm.created_at
) first_messages
GROUP BY time_bucket
ORDER BY 
  CASE time_bucket
    WHEN '< 5 min' THEN 1
    WHEN '5-15 min' THEN 2
    WHEN '15-60 min' THEN 3
    WHEN '1-24 hours' THEN 4
    WHEN '24+ hours' THEN 5
  END;

-- ============================================================================
-- 5. ALERT QUERIES (Run these regularly to detect issues)
-- ============================================================================

-- Alert: Sudden Churn Spike (30%+ increase in daily churn)
WITH daily_churn AS (
  SELECT 
    DATE(last_activity) as date,
    COUNT(*) as churned_users
  FROM (
    SELECT 
      u.id,
      MAX(m.created_at) as last_activity
    FROM auth.users u
    LEFT JOIN messages m ON u.id = m.user_id
    GROUP BY u.id
    HAVING MAX(m.created_at) < CURRENT_DATE - INTERVAL '7 days'
      OR MAX(m.created_at) IS NULL
  ) inactive_users
  GROUP BY DATE(last_activity)
)
SELECT 
  date,
  churned_users,
  LAG(churned_users) OVER (ORDER BY date) as previous_day,
  ROUND(100.0 * (churned_users - LAG(churned_users) OVER (ORDER BY date)) / 
    NULLIF(LAG(churned_users) OVER (ORDER BY date), 0), 2) as churn_change_pct
FROM daily_churn
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

-- Alert: Report Rate Spike (> 5% of messages reported)
SELECT 
  CURRENT_DATE as alert_date,
  COUNT(r.id) as reports_today,
  (SELECT COUNT(*) FROM messages WHERE DATE(created_at) = CURRENT_DATE) as messages_today,
  ROUND(100.0 * COUNT(r.id)::float / NULLIF((SELECT COUNT(*) FROM messages WHERE DATE(created_at) = CURRENT_DATE), 0), 2) as report_rate_pct
FROM reports r
WHERE DATE(r.created_at) = CURRENT_DATE
HAVING ROUND(100.0 * COUNT(r.id)::float / NULLIF((SELECT COUNT(*) FROM messages WHERE DATE(created_at) = CURRENT_DATE), 0), 2) > 5.0;

-- Alert: DAU Drop (20%+ decrease from 7-day average)
WITH recent_dau AS (
  SELECT 
    CURRENT_DATE as date,
    COUNT(DISTINCT user_id) as today_dau,
    AVG(COUNT(DISTINCT user_id)) OVER (ORDER BY DATE(created_at) ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) as avg_dau_7days
  FROM messages
  WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '8 days'
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at) DESC
  LIMIT 1
)
SELECT 
  date,
  today_dau,
  ROUND(avg_dau_7days, 0) as avg_dau_last_7days,
  ROUND(100.0 * (today_dau - avg_dau_7days) / avg_dau_7days, 2) as change_pct
FROM recent_dau
WHERE (today_dau - avg_dau_7days) / avg_dau_7days < -0.20;

-- ============================================================================
-- 6. EXECUTIVE SUMMARY QUERY (Single dashboard view)
-- ============================================================================

SELECT 
  metric_name,
  current_value,
  previous_value,
  change_pct,
  trend
FROM (
  -- Total Users
  SELECT 
    'Total Users' as metric_name,
    (SELECT COUNT(*)::text FROM auth.users) as current_value,
    NULL as previous_value,
    NULL as change_pct,
    '↑' as trend
  
  UNION ALL
  
  -- DAU
  SELECT 
    'DAU',
    (
      SELECT COUNT(DISTINCT user_id)::text 
      FROM messages 
      WHERE DATE(created_at) = CURRENT_DATE
    ),
    (
      SELECT COUNT(DISTINCT user_id)::text 
      FROM messages 
      WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    ),
    (
      SELECT ROUND(100.0 * (
        (SELECT COUNT(DISTINCT user_id) FROM messages WHERE DATE(created_at) = CURRENT_DATE)::float -
        (SELECT COUNT(DISTINCT user_id) FROM messages WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day')
      ) / NULLIF((SELECT COUNT(DISTINCT user_id) FROM messages WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'), 0), 2)::text || '%'
    ),
    CASE 
      WHEN (SELECT COUNT(DISTINCT user_id) FROM messages WHERE DATE(created_at) = CURRENT_DATE) > 
           (SELECT COUNT(DISTINCT user_id) FROM messages WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day')
      THEN '↑' ELSE '↓' 
    END
  
  -- Add more metrics as needed...
) metrics
ORDER BY metric_name;
