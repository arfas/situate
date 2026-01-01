# Analytics Implementation Guide

## Overview

This guide covers the complete analytics implementation for SupportCircle, including PostHog setup, database views, dashboard configuration, and automated reporting.

## Table of Contents

1. [PostHog Setup](#posthog-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Analytics Views](#database-analytics-views)
4. [Dashboard Setup](#dashboard-setup)
5. [Key Events Reference](#key-events-reference)
6. [Automated Alerts](#automated-alerts)
7. [Weekly Reporting](#weekly-reporting)

---

## PostHog Setup

### 1. Create PostHog Account

**Option A: Cloud (Recommended for MVP)**
1. Go to [posthog.com](https://posthog.com)
2. Sign up for free account (1M events/month free)
3. Create a new project
4. Copy your Project API Key and Host URL

**Option B: Self-Hosted**
1. Follow [PostHog deployment guide](https://posthog.com/docs/self-host)
2. Deploy to your infrastructure
3. Generate API key from settings

### 2. Add Environment Variables

Add to your `.env` file:

```env
# PostHog Configuration
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://app.posthog.com
```

Or for self-hosted:
```env
VITE_POSTHOG_HOST=https://your-posthog-instance.com
```

### 3. Verify Installation

The analytics are automatically initialized when the app starts (see `src/main.tsx`).

To verify:
1. Run your app: `npm run dev`
2. Open browser DevTools Console
3. Look for PostHog initialization messages
4. Visit [PostHog Dashboard](https://app.posthog.com) → Live Events
5. Perform actions in your app (signup, search, etc.)
6. Verify events appear in PostHog

---

## Environment Configuration

### Development Environment

```env
# Use PostHog's development mode to filter out dev events
VITE_POSTHOG_KEY=phc_dev_xxxxxxxxxxxx
VITE_POSTHOG_HOST=https://app.posthog.com
```

### Production Environment

```env
VITE_POSTHOG_KEY=phc_prod_xxxxxxxxxxxx
VITE_POSTHOG_HOST=https://app.posthog.com
```

**Important:** Use separate PostHog projects for dev/staging/production to keep data clean.

---

## Database Analytics Views

### 1. Run Migration

Apply the analytics views migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL file
# In Supabase dashboard → SQL Editor
# Paste contents of: supabase/migrations/20260101220000_create_analytics_views.sql
```

### 2. Verify Views Created

```sql
-- Check all views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name LIKE '%analytics%' 
  OR table_name LIKE '%cohort%'
  OR table_name LIKE '%engagement%';
```

### 3. Test Key Views

```sql
-- Test dashboard summary
SELECT * FROM analytics_dashboard_summary;

-- Test active users
SELECT * FROM active_users_metrics;

-- Test cohort retention
SELECT * FROM cohort_retention LIMIT 5;
```

---

## Dashboard Setup

### Option 1: PostHog Dashboard (Recommended)

PostHog provides built-in dashboards with no additional setup:

1. **Create Insights:**
   - Go to PostHog → Insights → New Insight
   - Choose event type (e.g., "user_signed_up")
   - Select visualization (line, bar, pie, etc.)
   - Set date range and filters

2. **Create Dashboard:**
   - Go to PostHog → Dashboards → New Dashboard
   - Name it "Product Health"
   - Add insights you created

3. **Suggested Insights:**
   - Daily Signups (Trend)
   - DAU/WAU/MAU (Trend)
   - Funnel: Search → Join Room → Send Message
   - Retention Table (Cohorts)
   - Top Search Queries (Table)

### Option 2: Metabase (For SQL-Heavy Analytics)

If you need more custom SQL dashboards:

1. Install Metabase: https://www.metabase.com/start/
2. Connect to your Supabase Postgres database
3. Import queries from `docs/analytics-dashboard-queries.sql`
4. Create dashboard with visualizations

### Option 3: Redash

Similar to Metabase, great for SQL power users:

1. Deploy Redash: https://redash.io/help/open-source/setup
2. Add Postgres data source (Supabase)
3. Create queries and visualizations
4. Build dashboard

---

## Key Events Reference

All events tracked by the application:

### Acquisition Events

| Event Name | Properties | Triggered When |
|------------|-----------|----------------|
| `user_signed_up` | `method`, `source` | User completes signup |
| `search_performed` | `query`, `results_count`, `query_length` | User searches for rooms |

### Engagement Events

| Event Name | Properties | Triggered When |
|------------|-----------|----------------|
| `session_started` | - | User logs in |
| `room_created` | `room_id`, `category`, `is_anonymous` | User creates new room |
| `room_joined` | `room_id`, `is_anonymous` | User joins a room |
| `room_viewed` | `room_id` | User opens a room |
| `message_sent` | `room_id`, `message_length`, `is_anonymous` | User posts message |

### Quality Events

| Event Name | Properties | Triggered When |
|------------|-----------|----------------|
| `message_upvoted` | `message_id`, `room_id` | User upvotes message |
| `message_reported` | `message_id`, `room_id`, `reason` | User reports message |
| `first_message_time` | `room_id`, `time_seconds` | First message in room |

### Automatic Events (PostHog)

PostHog automatically tracks:
- `$pageview` - Page views
- `$pageleave` - When user leaves
- `$autocapture` - (disabled by default)

---

## Automated Alerts

### PostHog Alerts

1. Go to PostHog → Insights → Your Metric
2. Click "Set Alert" button
3. Configure:
   - Threshold (e.g., DAU drops below 50)
   - Notification channel (email, Slack, webhook)

**Recommended Alerts:**

| Metric | Threshold | Alert When |
|--------|-----------|------------|
| DAU | < 30% of 7-day avg | Drops below |
| Report Rate | > 5% | Exceeds |
| Signups | < 5 per day | Drops below |
| Error Rate | > 1% | Exceeds |

### Database Alerts (Email via Cron)

Create a script to check critical metrics:

```typescript
// scripts/check-alerts.ts
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkAlerts() {
  // Check DAU drop
  const { data: dauDrop } = await supabase.rpc('check_dau_drop');
  
  // Check report rate spike
  const { data: reportSpike } = await supabase.rpc('check_report_spike');
  
  // Send email if any alerts
  if (dauDrop || reportSpike) {
    await sendAlertEmail({
      dauDrop,
      reportSpike,
    });
  }
}

// Run daily via cron
checkAlerts();
```

### Slack Integration

PostHog can send alerts to Slack:

1. PostHog → Settings → Integrations
2. Enable Slack integration
3. Authorize Slack workspace
4. Configure alert channels

---

## Weekly Reporting

### Manual Process

1. Run queries from `docs/analytics-dashboard-queries.sql`
2. Fill in `docs/weekly-metrics-report-template.md`
3. Send to team via email

### Automated Process (Future)

Create automation script:

```typescript
// scripts/generate-weekly-report.ts
import { createClient } from '@supabase/supabase-js';
import { PostHog } from 'posthog-node';

async function generateReport() {
  // Fetch database metrics
  const dbMetrics = await fetchDatabaseMetrics();
  
  // Fetch PostHog metrics
  const postHogMetrics = await fetchPostHogMetrics();
  
  // Generate report
  const report = buildReport(dbMetrics, postHogMetrics);
  
  // Send via email
  await sendReportEmail(report);
}
```

**Schedule with GitHub Actions:**

```yaml
# .github/workflows/weekly-report.yml
name: Weekly Analytics Report

on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday at 9 AM UTC

jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run generate-report
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          POSTHOG_API_KEY: ${{ secrets.POSTHOG_API_KEY }}
```

---

## Best Practices

### 1. Event Naming Convention

- Use snake_case: `user_signed_up`, `room_created`
- Be specific: `message_sent` not just `message`
- Include object type: `room_joined` not just `joined`

### 2. Property Standards

- Keep property names consistent across events
- Use primitives (string, number, boolean)
- Avoid deeply nested objects

### 3. Privacy Considerations

- Never track PII without consent
- Use anonymous IDs where appropriate
- Respect "Do Not Track" browser settings
- Add opt-out mechanism

### 4. Performance

- Events are tracked asynchronously (non-blocking)
- PostHog batches events automatically
- Failed events are retried

### 5. Testing

Test analytics in development:

```typescript
// src/lib/analytics.ts
// Add dev logging
if (import.meta.env.DEV) {
  console.log('[Analytics]', eventName, properties);
}
```

---

## Troubleshooting

### Events Not Appearing in PostHog

1. Check browser console for errors
2. Verify `VITE_POSTHOG_KEY` is set correctly
3. Check PostHog → Live Events (real-time)
4. Verify PostHog is initialized: `console.log(posthog.__loaded)`

### Database Views Not Working

1. Verify migration was applied: `SELECT * FROM information_schema.views`
2. Check Postgres logs for errors
3. Ensure Row-Level Security allows access
4. Test with service role key (bypasses RLS)

### Slow Query Performance

1. Add indexes on frequently queried columns:
   ```sql
   CREATE INDEX idx_messages_created_at ON messages(created_at);
   CREATE INDEX idx_messages_room_id ON messages(room_id);
   ```
2. Use materialized views for heavy queries
3. Consider data aggregation tables

---

## Next Steps

1. ✅ Set up PostHog account
2. ✅ Add environment variables
3. ✅ Run database migration
4. ✅ Verify events are tracking
5. ⬜ Create PostHog dashboard
6. ⬜ Set up automated alerts
7. ⬜ Schedule weekly report generation
8. ⬜ Review metrics and iterate

---

## Resources

- **PostHog Docs:** https://posthog.com/docs
- **PostHog API:** https://posthog.com/docs/api
- **Analytics Best Practices:** https://segment.com/academy/collecting-data/
- **Cohort Analysis Guide:** https://mixpanel.com/blog/cohort-analysis/

---

**Questions?** Open an issue or contact the analytics team.
