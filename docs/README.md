# Analytics Documentation

Complete documentation for SupportCircle's product health analytics implementation.

## 📖 Documentation Index

### 🚀 Getting Started

**[ANALYTICS_QUICKSTART.md](./ANALYTICS_QUICKSTART.md)** ⭐ START HERE
- 15-minute setup guide
- Step-by-step instructions
- Verification checklist
- Basic troubleshooting

### 📘 Core Documentation

**[ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md)** - Complete Setup Guide
- PostHog account creation
- Environment configuration
- Database views installation
- Dashboard setup (PostHog, Metabase, Redash)
- Automated alerts configuration
- Weekly reporting automation
- Comprehensive troubleshooting

**[ANALYTICS_EVENTS.md](./ANALYTICS_EVENTS.md)** - Events Reference
- All tracked events catalog
- Event properties and types
- Implementation examples
- Testing procedures
- Privacy guidelines
- Performance considerations

**[ANALYTICS_SUMMARY.md](./ANALYTICS_SUMMARY.md)** - Implementation Overview
- What was implemented
- Key features delivered
- Technology stack
- Success metrics
- Maintenance schedule

### 📊 Dashboard & Queries

**[POSTHOG_DASHBOARD.md](./POSTHOG_DASHBOARD.md)** - Dashboard Configuration
- Complete dashboard layout
- 20+ insight configurations
- Alert setup instructions
- Permissions and sharing
- Import/export procedures

**[analytics-dashboard-queries.sql](./analytics-dashboard-queries.sql)** - SQL Queries
- 25+ production-ready queries
- Acquisition metrics
- Engagement analysis
- Retention calculations
- Quality monitoring
- Alert queries

### 📧 Reporting

**[weekly-metrics-report-template.md](./weekly-metrics-report-template.md)** - Report Template
- Complete weekly report structure
- All metrics organized by category
- Trend indicators
- Action items framework
- Automation guidance

---

## 🎯 Quick Links by Use Case

### "I want to set up analytics from scratch"
→ Start with [ANALYTICS_QUICKSTART.md](./ANALYTICS_QUICKSTART.md)

### "I need to understand what events are tracked"
→ See [ANALYTICS_EVENTS.md](./ANALYTICS_EVENTS.md)

### "I want to create a dashboard"
→ Follow [POSTHOG_DASHBOARD.md](./POSTHOG_DASHBOARD.md)

### "I need SQL queries for metrics"
→ Use [analytics-dashboard-queries.sql](./analytics-dashboard-queries.sql)

### "I want to send weekly reports"
→ Use [weekly-metrics-report-template.md](./weekly-metrics-report-template.md)

### "Something isn't working"
→ Check [ANALYTICS_SETUP.md#troubleshooting](./ANALYTICS_SETUP.md#troubleshooting)

---

## 📊 Metrics Overview

### Acquisition
- New signups per day
- Signup sources (organic, referral)
- Search queries and topics

### Engagement
- DAU/WAU/MAU (Daily/Weekly/Monthly Active Users)
- Messages sent per user
- Rooms joined per user
- Session duration

### Retention
- Cohort retention (D1, D7, D30)
- Churn rate
- Most engaging rooms

### Quality
- High-quality messages (10+ upvotes)
- Report rate (safety)
- Time to first message

---

## 🏗️ Architecture

```
Frontend (React)
│
├── src/lib/analytics.ts         → Event tracking functions
├── src/main.tsx                 → Analytics initialization
├── src/contexts/AuthContext.tsx → User identification
└── Components                   → Event triggers
    │
    └── Events sent to ↓

PostHog Cloud
│
├── Live Events (real-time)
├── Insights (charts/graphs)
├── Dashboards
├── Retention tables
└── Alerts

Database (Supabase PostgreSQL)
│
└── Analytics Views
    │
    ├── daily_signups
    ├── active_users_metrics
    ├── cohort_retention
    ├── user_engagement_stats
    └── ... (11 total views)
```

---

## 🚀 Quick Setup Checklist

- [ ] Create PostHog account
- [ ] Add `VITE_POSTHOG_KEY` to `.env`
- [ ] Run `npm install posthog-js`
- [ ] Apply database migration
- [ ] Restart dev server
- [ ] Verify events in PostHog
- [ ] Create basic dashboard
- [ ] Set up 2-3 alerts

**Time:** ~15 minutes  
**Guide:** [ANALYTICS_QUICKSTART.md](./ANALYTICS_QUICKSTART.md)

---

## 📁 File Structure

```
docs/
├── README.md                           ← You are here
├── ANALYTICS_QUICKSTART.md            ← Start here for setup
├── ANALYTICS_SETUP.md                 ← Complete setup guide
├── ANALYTICS_EVENTS.md                ← Event reference
├── ANALYTICS_SUMMARY.md               ← Implementation overview
├── POSTHOG_DASHBOARD.md               ← Dashboard guide
├── analytics-dashboard-queries.sql    ← SQL queries
└── weekly-metrics-report-template.md  ← Report template

src/lib/
└── analytics.ts                        ← Event tracking code

supabase/migrations/
└── 20260101220000_create_analytics_views.sql  ← Database views
```

---

## 🎓 Learning Path

### Beginner
1. Read [ANALYTICS_SUMMARY.md](./ANALYTICS_SUMMARY.md) - Understand what's implemented
2. Follow [ANALYTICS_QUICKSTART.md](./ANALYTICS_QUICKSTART.md) - Get it running
3. Explore PostHog Live Events - See your data

### Intermediate
1. Review [ANALYTICS_EVENTS.md](./ANALYTICS_EVENTS.md) - Learn all events
2. Create dashboard with [POSTHOG_DASHBOARD.md](./POSTHOG_DASHBOARD.md)
3. Run queries from [analytics-dashboard-queries.sql](./analytics-dashboard-queries.sql)

### Advanced
1. Set up automated alerts
2. Create custom funnels
3. Build automated weekly reports
4. Implement A/B testing with feature flags

---

## 🔧 Maintenance

### Daily
- Check PostHog for anomalies
- Review alert notifications

### Weekly
- Generate metrics report
- Review dashboard trends
- Share insights with team

### Monthly
- Review alert thresholds
- Update dashboard as needed
- Optimize slow queries
- Archive old data

---

## 🆘 Support

### Documentation
- **PostHog:** https://posthog.com/docs
- **Supabase:** https://supabase.com/docs
- **SQL Tutorial:** https://www.postgresql.org/docs/

### Troubleshooting
- See [ANALYTICS_SETUP.md#troubleshooting](./ANALYTICS_SETUP.md#troubleshooting)
- Check browser console for errors
- Verify environment variables
- Test database connections

### Community
- PostHog Slack: https://posthog.com/slack
- Supabase Discord: https://discord.supabase.com

---

## 📝 Contributing

### Adding New Events

1. Define event in `src/lib/analytics.ts`
2. Trigger event in component
3. Document in `ANALYTICS_EVENTS.md`
4. Add to dashboard guide

### Adding New Queries

1. Write query in `analytics-dashboard-queries.sql`
2. Test in Supabase SQL Editor
3. Document in `POSTHOG_DASHBOARD.md`
4. Update report template if needed

### Updating Documentation

1. Keep examples current with code
2. Update troubleshooting section
3. Add screenshots where helpful
4. Test all setup steps

---

## 🎯 Success Criteria

You'll know analytics is working when:

- ✅ Events appear in PostHog Live Events
- ✅ Dashboard shows real data
- ✅ SQL queries return results
- ✅ Alerts trigger appropriately
- ✅ Team uses metrics for decisions

---

## 📞 Contact

**Questions about analytics?**
- Open GitHub issue with `[Analytics]` tag
- Email: analytics@supportcircle.com (if applicable)
- Slack: #analytics channel (if applicable)

---

**Last Updated:** January 1, 2026  
**Version:** 1.0.0  
**Maintained by:** Product & Engineering Teams
