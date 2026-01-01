# Analytics Quick Start Guide

Get your analytics up and running in 15 minutes.

## ✅ Prerequisites

- [ ] SupportCircle app running locally
- [ ] Supabase project set up
- [ ] Access to Supabase dashboard

## 🚀 Step-by-Step Setup

### Step 1: Create PostHog Account (3 minutes)

1. Go to [posthog.com](https://posthog.com)
2. Click "Get Started Free"
3. Sign up (1M events/month free tier)
4. Create a new project: "SupportCircle"
5. Copy your **Project API Key** (starts with `phc_`)

### Step 2: Configure Environment (1 minute)

1. Open your `.env` file
2. Add PostHog credentials:

```env
VITE_POSTHOG_KEY=phc_your_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

3. Save the file

### Step 3: Install Dependencies (1 minute)

```bash
npm install posthog-js
```

The package is already listed in `package.json`, this just installs it.

### Step 4: Apply Database Migration (2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to your project → SQL Editor
3. Click "New Query"
4. Copy the entire contents of:
   ```
   supabase/migrations/20260101220000_create_analytics_views.sql
   ```
5. Paste into SQL Editor
6. Click "Run" (⏵ button)
7. Verify: Should see "Success. No rows returned"

### Step 5: Verify Tracking (3 minutes)

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser DevTools:**
   - Press F12
   - Go to Console tab

3. **Test event tracking:**
   - Sign up with a new account
   - Search for a room
   - Create a room
   - Send a message

4. **Check PostHog:**
   - Go to PostHog dashboard
   - Click "Live Events" in sidebar
   - You should see events appearing in real-time:
     - `user_signed_up`
     - `search_performed`
     - `room_created`
     - `message_sent`

✅ If you see events, tracking is working!

### Step 6: Create Dashboard (5 minutes)

1. In PostHog, go to **Dashboards** → **New Dashboard**

2. Name it: "Product Health"

3. Add these 3 essential insights:

   **Insight 1: Daily Signups**
   - Click "+ New Insight"
   - Event: `user_signed_up`
   - Chart: Line
   - Time range: Last 30 days
   - Save as: "Daily Signups"

   **Insight 2: Daily Active Users**
   - Event: `session_started` or `message_sent`
   - Aggregation: Unique users
   - Chart: Line
   - Time range: Last 30 days
   - Save as: "DAU"

   **Insight 3: Messages Sent**
   - Event: `message_sent`
   - Chart: Bar
   - Time range: Last 7 days
   - Save as: "Messages This Week"

4. Save dashboard

✅ You now have a basic analytics dashboard!

---

## 🎯 What's Being Tracked

Your app now automatically tracks:

### User Acquisition
- ✅ New signups
- ✅ Search queries

### User Engagement
- ✅ Room creation
- ✅ Room joins
- ✅ Messages sent
- ✅ Message upvotes

### Product Quality
- ✅ Content reports (safety)
- ✅ Time to first message

All tracking happens automatically - **no additional code needed**.

---

## 📊 View Your Metrics

### In PostHog (Real-time)
- **Live Events:** See events as they happen
- **Insights:** Create custom charts
- **Dashboards:** Combine multiple insights
- **Retention:** Track user return rates

### In Supabase (SQL)
Run these queries in Supabase SQL Editor:

**Today's active users:**
```sql
SELECT * FROM active_users_metrics;
```

**Top engaging rooms:**
```sql
SELECT * FROM top_engaging_rooms LIMIT 10;
```

**User retention:**
```sql
SELECT * FROM cohort_retention LIMIT 5;
```

---

## 🔔 Set Up Alerts (Optional, 5 minutes)

Get notified when metrics are concerning:

1. In PostHog, open an insight (e.g., DAU)
2. Click "Set Alert" button
3. Configure:
   - **Metric:** Daily Active Users
   - **Condition:** Drops below → 50% of normal
   - **Notification:** Email
4. Save alert

Repeat for:
- Daily signups < 5
- Report rate > 5%

---

## 📧 Weekly Report (Optional)

1. Use the template: `docs/weekly-metrics-report-template.md`
2. Run queries from: `docs/analytics-dashboard-queries.sql`
3. Fill in numbers
4. Email to team every Monday

---

## 🐛 Troubleshooting

### Events not showing in PostHog?

**Check 1: Console errors**
- Open DevTools → Console
- Look for PostHog errors
- Common issue: Wrong API key

**Check 2: Network requests**
- DevTools → Network tab
- Filter by "posthog"
- Should see requests to `app.posthog.com`

**Check 3: PostHog loaded**
In browser console, run:
```javascript
console.log(posthog.__loaded); // Should be true
```

**Fix:**
- Verify `.env` has correct `VITE_POSTHOG_KEY`
- Restart dev server: `npm run dev`
- Clear browser cache

### Database views not working?

**Check migration ran:**
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'analytics_dashboard_summary';
```

**Should return:** 1 row

**If empty:**
- Re-run migration SQL
- Check for SQL errors in output

---

## 📚 Next Steps

### Learn More
- **Full setup guide:** [ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md)
- **All tracked events:** [ANALYTICS_EVENTS.md](./ANALYTICS_EVENTS.md)
- **Dashboard guide:** [POSTHOG_DASHBOARD.md](./POSTHOG_DASHBOARD.md)

### Advanced Features
- Set up Slack alerts
- Create retention cohorts
- Build custom funnels
- Export data for analysis

### Production Deployment
- Use separate PostHog project for production
- Set up automated weekly reports
- Configure data retention policies
- Add user consent banner (GDPR)

---

## ✅ Checklist

- [ ] PostHog account created
- [ ] Environment variables added to `.env`
- [ ] Dependencies installed (`npm install`)
- [ ] Database migration applied
- [ ] Dev server restarted
- [ ] Events appearing in PostHog Live Events
- [ ] Basic dashboard created
- [ ] SQL queries tested

---

## 🎉 You're Done!

Your app is now tracking product health metrics. You can:

- See user growth trends
- Track engagement patterns
- Monitor retention rates
- Identify quality content
- Spot safety issues

**Need help?** Check [ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md) for detailed troubleshooting.

**Ready for more?** Explore [POSTHOG_DASHBOARD.md](./POSTHOG_DASHBOARD.md) to build advanced dashboards.
