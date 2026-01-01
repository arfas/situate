# Weekly Product Health Report Template

**SupportCircle Weekly Metrics**  
*Week of [START_DATE] - [END_DATE]*

---

## 📊 Executive Summary

**Key Highlights:**
- [Biggest win of the week]
- [Notable concern or trend]
- [Action item or focus for next week]

---

## 🎯 Acquisition Metrics

### New User Signups
- **This Week:** [XX] signups
- **Last Week:** [XX] signups  
- **Change:** [+/-XX%] [↑/↓]
- **7-Day Trend:** [Growing/Stable/Declining]

**Signup Sources:**
- Organic: [XX%]
- Referral: [XX%]
- Social: [XX%]
- Other: [XX%]

### Top Search Queries
*What situations are people looking for?*

| Search Query | Count | Avg Results |
|--------------|-------|-------------|
| 1. [query]   | [XX]  | [X.X]       |
| 2. [query]   | [XX]  | [X.X]       |
| 3. [query]   | [XX]  | [X.X]       |
| 4. [query]   | [XX]  | [X.X]       |
| 5. [query]   | [XX]  | [X.X]       |

**Insights:** [Note any patterns or gaps in content]

---

## 💬 Engagement Metrics

### Active Users
- **DAU (Daily Active Users):** [XX]
  - Change from last week: [+/-XX%] [↑/↓]
- **WAU (Weekly Active Users):** [XX]
  - Change from last week: [+/-XX%] [↑/↓]
- **MAU (Monthly Active Users):** [XX]

**DAU/MAU Ratio:** [XX%] *(Target: >20% is healthy)*

### User Activity Depth
- **Messages Sent:** [XXX] total ([+/-XX%] vs last week)
- **Avg Messages per Active User:** [X.X]
- **Rooms Joined:** [XXX] total ([+/-XX%] vs last week)
- **Avg Rooms per User:** [X.X]

### Engagement Distribution

**Messages per User (This Week):**
- 1 message: [XX] users
- 2-5 messages: [XX] users
- 6-10 messages: [XX] users
- 11-20 messages: [XX] users
- 20+ messages: [XX] users (power users)

**Time Spent:** [Average session duration from PostHog]

---

## 🔁 Retention Metrics

### Cohort Analysis
*Users who returned after signup*

| Signup Week    | Cohort Size | Day 1 | Day 7 | Day 30 |
|----------------|-------------|-------|-------|--------|
| [Week -4]      | [XX]        | [XX%] | [XX%] | [XX%]  |
| [Week -3]      | [XX]        | [XX%] | [XX%] | [XX%]  |
| [Week -2]      | [XX]        | [XX%] | [XX%] | [XX%]  |
| [Last Week]    | [XX]        | [XX%] | [XX%] | -      |
| [This Week]    | [XX]        | [XX%] | -     | -      |

**Target Benchmarks:**
- Day 1: >40% (Currently: [XX%])
- Day 7: >20% (Currently: [XX%])
- Day 30: >10% (Currently: [XX%])

### Churn
- **Users who haven't returned in 30 days:** [XX]
- **Churn Rate:** [XX%]
- **Change from last week:** [+/-XX%] [↑/↓]

### Most Engaging Rooms
*Rooms with highest activity this week*

| Room Title | Participants | Messages | Avg Upvotes |
|------------|-------------|----------|-------------|
| 1. [Room]  | [XX]        | [XXX]    | [X.X]       |
| 2. [Room]  | [XX]        | [XXX]    | [X.X]       |
| 3. [Room]  | [XX]        | [XXX]    | [X.X]       |
| 4. [Room]  | [XX]        | [XXX]    | [X.X]       |
| 5. [Room]  | [XX]        | [XXX]    | [X.X]       |

**Insights:** [What types of rooms are most popular?]

---

## ⭐ Quality Metrics

### High-Quality Content
- **Messages with 10+ upvotes:** [XX] ([+/-XX%] vs last week)
- **Quality Rate:** [X.X%] of all messages
- **Average upvotes per message:** [X.X]

**Top Quality Messages This Week:**
1. "[Message preview...]" - [XX] upvotes in [Room Name]
2. "[Message preview...]" - [XX] upvotes in [Room Name]
3. "[Message preview...]" - [XX] upvotes in [Room Name]

### Safety & Moderation
- **Total Reports:** [XX] ([+/-XX%] vs last week)
- **Report Rate:** [X.XX%] of messages *(Target: <2%)*
- **Unique Messages Reported:** [XX]

**Report Reasons Breakdown:**
- Spam: [XX%]
- Harassment: [XX%]
- Misinformation: [XX%]
- Self-harm: [XX%]
- Other: [XX%]

### Time to Engagement
- **Avg time to first message after joining:** [XX] minutes
- **% of users who message within 5 min:** [XX%]
- **% of users who never message:** [XX%]

---

## 🚨 Alerts & Concerns

### Automated Alerts This Week
- [ ] Churn spike detected ([XX%] increase)
- [ ] Report rate above threshold ([X.X%])
- [ ] DAU drop ([XX%] below 7-day average)
- [ ] None detected ✅

### Manual Observations
- [Any concerning trends or patterns]
- [User feedback or support tickets]
- [Technical issues or bugs]

---

## 🎯 Action Items for Next Week

**Priority 1 (Critical):**
1. [Action item based on metrics]
2. [Action item based on alerts]

**Priority 2 (Important):**
1. [Growth or engagement initiative]
2. [Quality or safety improvement]

**Priority 3 (Nice to Have):**
1. [Feature improvement]
2. [Analytics enhancement]

---

## 📈 Key Trends to Watch

- **Growing:** [Metric showing positive trend]
- **Stable:** [Metrics at healthy levels]
- **Declining:** [Metrics needing attention]

---

## 💡 Insights & Recommendations

### What's Working Well
- [Positive pattern or feature]
- [User behavior to amplify]

### Areas for Improvement
- [Metric below target]
- [User drop-off point]

### Experiment Ideas
- [A/B test suggestion]
- [Feature or content idea]

---

## 📎 Appendix: Data Sources

- **User Data:** Supabase `auth.users` table
- **Activity Data:** `messages`, `room_memberships` tables
- **Event Tracking:** PostHog analytics
- **Queries:** See `/docs/analytics-dashboard-queries.sql`
- **Dashboard:** [Link to analytics dashboard]

---

*Report generated on [DATE] | Next report: [NEXT_DATE]*  
*Questions? Contact: [analytics@supportcircle.com]*

---

## How to Generate This Report

### Automated Report Generation (Future)

Create a script to auto-generate this report:

\`\`\`typescript
// scripts/generate-weekly-report.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for admin access
);

async function generateWeeklyReport() {
  // Fetch all metrics
  const signups = await getWeeklySignups();
  const dau = await getDAU();
  const retention = await getCohortRetention();
  // ... fetch all other metrics
  
  // Generate markdown report
  const report = generateMarkdown({
    signups,
    dau,
    retention,
    // ... all metrics
  });
  
  // Save to file
  fs.writeFileSync(
    \`reports/weekly-report-\${new Date().toISOString().split('T')[0]}.md\`,
    report
  );
  
  // Optional: Send via email
  await sendEmailReport(report);
}

generateWeeklyReport();
\`\`\`

### Manual Report Generation

1. Run queries from `analytics-dashboard-queries.sql`
2. Export data from PostHog dashboard
3. Fill in this template with actual numbers
4. Review trends and add insights
5. Share with team via email/Slack

### Email Distribution

**Recipients:** Product team, Engineering leads, Executive team  
**Schedule:** Every Monday at 9 AM  
**Tools:** SendGrid, Mailgun, or Postmark for email delivery
