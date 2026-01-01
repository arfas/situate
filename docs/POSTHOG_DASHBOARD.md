# PostHog Dashboard Configuration

This is a reference configuration for creating a comprehensive product health dashboard in PostHog.

## Quick Setup

1. Log into PostHog
2. Go to Dashboards → New Dashboard
3. Name it "Product Health - SupportCircle"
4. Add the insights below

---

## Dashboard Layout

### Section 1: Acquisition (Top Row)

**1.1 Daily Signups (Line Chart)**
- Event: `user_signed_up`
- Aggregation: Total Count
- Time Range: Last 30 days
- Formula: None
- Display: Line chart with trend line

**1.2 Signup Sources (Pie Chart)**
- Event: `user_signed_up`
- Breakdown: `source` property
- Time Range: Last 30 days
- Display: Pie chart

**1.3 Top Search Queries (Table)**
- Event: `search_performed`
- Breakdown: `query` property
- Aggregation: Total Count
- Time Range: Last 7 days
- Limit: Top 10

---

### Section 2: Engagement (Second Row)

**2.1 DAU/WAU/MAU (Multi-Line Chart)**
- Event: `session_started` or `message_sent`
- Metrics:
  - DAU: Unique users (last 1 day)
  - WAU: Unique users (last 7 days)
  - MAU: Unique users (last 30 days)
- Time Range: Last 90 days
- Display: Multi-line chart

**2.2 Messages Sent (Bar Chart)**
- Event: `message_sent`
- Aggregation: Total Count
- Time Range: Last 30 days
- Breakdown by: Daily
- Display: Bar chart

**2.3 Rooms Joined (Line Chart)**
- Event: `room_joined`
- Aggregation: Total Count
- Time Range: Last 30 days
- Display: Line chart with trend

---

### Section 3: User Activity Funnel (Third Row)

**3.1 Search to Message Funnel**
- Step 1: `search_performed`
- Step 2: `room_joined`
- Step 3: `message_sent`
- Time window: Within 1 hour
- Display: Funnel visualization

**3.2 Room Engagement Distribution (Histogram)**
- Event: `message_sent`
- Aggregation: Property value distribution
- Property: `message_length`
- Buckets: [0-50, 51-100, 101-200, 201-500, 500+]
- Time Range: Last 30 days

**3.3 Anonymous vs Identified (Pie Chart)**
- Event: `message_sent`
- Breakdown: `is_anonymous` property
- Time Range: Last 30 days
- Display: Pie chart

---

### Section 4: Retention (Fourth Row)

**4.1 User Retention (Retention Table)**
- Initial Event: `user_signed_up`
- Return Event: `session_started` or `message_sent`
- Return Period: Daily, Weekly, Monthly
- Cohort Size: By signup date
- Time Range: Last 12 weeks
- Display: Retention table/heatmap

**4.2 Churn Rate (Single Number)**
- Event: `session_started`
- Calculation: Users who haven't returned in 30 days
- Display: Big number with trend arrow

**4.3 Most Engaging Rooms (Table)**
- Event: `message_sent`
- Breakdown: `room_id` property
- Metrics:
  - Total messages
  - Unique users
- Time Range: Last 7 days
- Limit: Top 10

---

### Section 5: Quality & Safety (Fifth Row)

**5.1 High Quality Messages (Line Chart)**
- Event: `message_upvoted`
- Filter: Message has 10+ upvotes (from database)
- Aggregation: Total Count
- Time Range: Last 30 days
- Display: Line chart

**5.2 Report Rate (Line Chart)**
- Events:
  - `message_reported` (Line 1)
  - `message_sent` (Line 2)
- Formula: (message_reported / message_sent) * 100
- Time Range: Last 30 days
- Display: Line chart with threshold marker at 2%

**5.3 Report Reasons (Bar Chart)**
- Event: `message_reported`
- Breakdown: `reason` property
- Time Range: Last 30 days
- Display: Horizontal bar chart

**5.4 Time to First Message (Histogram)**
- Event: `first_message_time`
- Property: `time_seconds`
- Buckets: [0-300, 301-900, 901-3600, 3600+]
- Time Range: Last 30 days
- Display: Histogram

---

### Section 6: Real-Time Activity (Bottom Row)

**6.1 Live Event Feed**
- All events
- Time Range: Last 1 hour
- Display: Live event stream
- Columns: Event name, User, Properties, Time

**6.2 Active Users Now (Single Number)**
- Event: Any event
- Unique users in last 5 minutes
- Display: Big number with auto-refresh

---

## Dashboard Filters

Add these global filters to the dashboard:

1. **Time Range Selector**
   - Quick options: Last 24h, 7d, 30d, 90d
   - Custom date range picker

2. **Room Category Filter**
   - Filter by: `category` property
   - Options: Mental Health, Relationships, Work, etc.

3. **Anonymity Filter**
   - Filter by: `is_anonymous` property
   - Options: All, Anonymous Only, Identified Only

4. **User Cohort Filter**
   - Filter by: Signup date cohort
   - Options: This week, Last week, This month, etc.

---

## Alerts Configuration

Set up alerts for critical metrics:

### Alert 1: DAU Drop
- Metric: DAU (from Section 2.1)
- Condition: Drops below 30% of 7-day average
- Notification: Email + Slack
- Recipients: Product team

### Alert 2: Report Spike
- Metric: Report Rate (from Section 5.2)
- Condition: Exceeds 5%
- Notification: Email + Slack
- Recipients: Moderation team

### Alert 3: Signup Drop
- Metric: Daily Signups (from Section 1.1)
- Condition: < 5 signups in a day
- Notification: Email
- Recipients: Growth team

### Alert 4: Error Rate
- Metric: Errors (from PostHog automatic tracking)
- Condition: > 1% of sessions
- Notification: Slack
- Recipients: Engineering team

---

## Saved Reports

Create these saved reports for easy access:

1. **Weekly Executive Summary**
   - All Section 1-5 insights
   - Time range: Last 7 days vs previous 7 days
   - Export: PDF

2. **Monthly Growth Report**
   - Section 1 (Acquisition) + Section 2 (Engagement)
   - Time range: Last 30 days vs previous 30 days
   - Export: CSV

3. **Safety & Quality Report**
   - Section 5 (Quality & Safety)
   - Time range: Last 30 days
   - Export: PDF

---

## Dashboard Permissions

Set up access control:

- **View Only:** All team members
- **Edit:** Product managers, Data analysts
- **Admin:** Engineering leads, Founders

---

## Sharing & Embedding

### Public Link
- Generate shareable link for stakeholders
- Option: Password protect
- Option: Refresh interval (hourly, daily)

### Embed in Internal Tools
```html
<iframe 
  src="https://app.posthog.com/dashboard/12345?embed=true" 
  width="100%" 
  height="800px"
  frameborder="0">
</iframe>
```

---

## Maintenance

### Weekly Tasks
- Review alert configurations
- Check for missing data
- Update filters as new categories are added

### Monthly Tasks
- Archive old cohorts
- Review and optimize slow queries
- Add new insights based on team needs

---

## PostHog Dashboard JSON (Import/Export)

You can export this entire dashboard as JSON and import into another PostHog project:

1. Go to Dashboard Settings (⚙️)
2. Click "Export dashboard"
3. Save JSON file
4. In new project: Import dashboard → Upload JSON

---

## Alternative: Create via API

Automate dashboard creation:

```typescript
// create-dashboard.ts
import fetch from 'node-fetch';

const POSTHOG_API_KEY = 'your-api-key';
const POSTHOG_PROJECT_ID = 'your-project-id';

async function createDashboard() {
  const response = await fetch(
    `https://app.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTHOG_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Product Health - SupportCircle',
        description: 'Comprehensive product analytics dashboard',
        pinned: true,
        // ... add insights configuration
      }),
    }
  );
  
  const dashboard = await response.json();
  console.log('Dashboard created:', dashboard.id);
}
```

---

## Resources

- **PostHog Dashboards Guide:** https://posthog.com/docs/user-guides/dashboards
- **Insight Types:** https://posthog.com/docs/user-guides/insights
- **Dashboard API:** https://posthog.com/docs/api/dashboards
