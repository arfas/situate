# Analytics Events Reference

Complete reference of all tracked events, their properties, and usage.

## Event Tracking Architecture

```
User Action → Frontend Component → analytics.ts → PostHog Cloud
                                  ↓
                            Database (for queries)
```

## Event Categories

- **Acquisition:** User growth and source tracking
- **Engagement:** How users interact with the app
- **Retention:** User return behavior
- **Quality:** Content and safety metrics

---

## Acquisition Events

### `user_signed_up`

**When:** User completes account creation

**Properties:**
```typescript
{
  method: 'email' | 'google',  // Authentication method
  source: string               // Traffic source (organic, referral, etc.)
}
```

**Triggered in:** `src/contexts/AuthContext.tsx` → `signUp()`

**Example:**
```typescript
trackSignup('email', 'organic');
```

**Analysis Use Cases:**
- Daily/weekly signup trends
- Signup source attribution
- Conversion rate optimization

---

### `search_performed`

**When:** User searches for rooms

**Properties:**
```typescript
{
  query: string,              // Search query text
  results_count: number,      // Number of results returned
  query_length: number        // Character length of query
}
```

**Triggered in:** `src/App.tsx` → `handleSearch()`

**Example:**
```typescript
trackSearchQuery('dealing with anxiety', 5);
```

**Analysis Use Cases:**
- Most searched topics/situations
- Search success rate (results found)
- Content gap analysis (searches with 0 results)

---

## Engagement Events

### `session_started`

**When:** User logs in or page loads with active session

**Properties:** None

**Triggered in:** `src/App.tsx` → `useEffect` (on user auth)

**Example:**
```typescript
trackSessionStart();
```

**Analysis Use Cases:**
- Session frequency
- Login patterns
- Feature adoption after login

---

### `room_created`

**When:** User creates a new support room

**Properties:**
```typescript
{
  room_id: string,            // UUID of created room
  category: string,           // Room category/topic
  is_anonymous: boolean       // Whether creator is anonymous
}
```

**Triggered in:** `src/App.tsx` → `handleCreateRoom()`

**Example:**
```typescript
trackRoomCreated('uuid-123', 'Mental Health', true);
```

**Analysis Use Cases:**
- Room creation rate
- Popular categories
- Anonymous vs identified room creators

---

### `room_joined`

**When:** User joins a room for the first time

**Properties:**
```typescript
{
  room_id: string,            // UUID of joined room
  is_anonymous: boolean       // Anonymity level chosen
}
```

**Triggered in:** `src/App.tsx` → `handleAnonymitySelected()`

**Example:**
```typescript
trackRoomJoined('uuid-456', true);
```

**Analysis Use Cases:**
- Average rooms per user
- Anonymous join rate
- Room membership growth

---

### `room_viewed`

**When:** User opens a room they're already a member of

**Properties:**
```typescript
{
  room_id: string             // UUID of viewed room
}
```

**Triggered in:** `src/components/Room/RoomView.tsx` → `useEffect`

**Example:**
```typescript
trackRoomViewed('uuid-789');
```

**Analysis Use Cases:**
- Most visited rooms
- Return visit rate
- Room stickiness

---

### `message_sent`

**When:** User posts a message in a room

**Properties:**
```typescript
{
  room_id: string,            // UUID of room
  message_length: number,     // Character count
  is_anonymous: boolean       // Whether posted anonymously
}
```

**Triggered in:** `src/components/Room/RoomView.tsx` → `handlePostMessage()`

**Example:**
```typescript
trackMessageSent('uuid-789', 142, true);
```

**Analysis Use Cases:**
- Messages per user
- Average message length
- Anonymous posting rate
- Most active rooms

---

## Quality Events

### `message_upvoted`

**When:** User upvotes a message

**Properties:**
```typescript
{
  message_id: string,         // UUID of message
  room_id: string             // UUID of room
}
```

**Triggered in:** `src/components/Room/RoomView.tsx` → `handleVote()`

**Example:**
```typescript
trackMessageUpvoted('msg-123', 'room-456');
```

**Analysis Use Cases:**
- High-quality content identification
- User engagement with helpful content
- Message quality distribution

---

### `message_reported`

**When:** User reports a message

**Properties:**
```typescript
{
  message_id: string,         // UUID of message
  room_id: string,            // UUID of room
  reason: string              // Report reason (spam, harassment, etc.)
}
```

**Triggered in:** `src/components/Room/RoomView.tsx` → `handleReport()`

**Example:**
```typescript
trackMessageReported('msg-789', 'room-456', 'spam');
```

**Analysis Use Cases:**
- Report rate (safety metric)
- Most common report reasons
- Moderation workload

---

### `first_message_time`

**When:** User sends their first message in a room

**Properties:**
```typescript
{
  room_id: string,            // UUID of room
  time_seconds: number        // Seconds from join to first message
}
```

**Triggered in:** `src/components/Room/RoomView.tsx` → `handlePostMessage()`

**Example:**
```typescript
trackFirstMessageTime('room-456', 180); // 3 minutes
```

**Analysis Use Cases:**
- User activation speed
- Room onboarding effectiveness
- Barrier to participation

---

## Page Tracking Events

### `$pageview`

**When:** User navigates to a page (automatic)

**Properties:**
```typescript
{
  page_name: string           // 'search', 'room', 'auth', etc.
}
```

**Triggered in:** Various components via `trackPageView()`

**Example:**
```typescript
trackPageView('room');
```

**Analysis Use Cases:**
- User flow through app
- Most visited pages
- Drop-off points

---

## Implementation Examples

### Adding a New Event

1. **Define in analytics.ts:**

```typescript
// src/lib/analytics.ts
export const trackFeatureUsed = (featureName: string) => {
  if (!posthog.__loaded) return;
  posthog.capture('feature_used', {
    feature_name: featureName,
  });
};
```

2. **Use in component:**

```typescript
// src/components/MyComponent.tsx
import { trackFeatureUsed } from '../../lib/analytics';

function handleFeatureClick() {
  trackFeatureUsed('new_feature');
  // ... rest of logic
}
```

3. **Document here in this file**

---

## Event Properties Best Practices

### Do ✅

- Use snake_case for property names
- Keep properties simple (primitives)
- Be consistent across events
- Include relevant context

### Don't ❌

- Track PII (emails, names) without consent
- Use deeply nested objects
- Change property types over time
- Track passwords or sensitive data

---

## PostHog-Specific Features

### User Properties

Set additional user attributes:

```typescript
import { setUserProperties } from './lib/analytics';

setUserProperties({
  subscription_tier: 'free',
  rooms_created: 5,
  messages_sent: 42,
});
```

### Feature Flags

Check if a feature is enabled:

```typescript
import { getFeatureFlag } from './lib/analytics';

if (getFeatureFlag('new_ui_redesign')) {
  // Show new UI
} else {
  // Show old UI
}
```

### Session Recording

PostHog can record user sessions for debugging:

```typescript
// Enable in posthog.init()
posthog.init(key, {
  // ... other options
  session_recording: {
    enabled: true,
    maskAllInputs: true,  // Mask sensitive inputs
  }
});
```

---

## Query Examples

### Most Common Search Queries

```typescript
// In PostHog Insights
// Event: search_performed
// Breakdown by: properties.query
// Aggregation: Total count
// Time range: Last 30 days
```

### Funnel: Search → Join → Message

```typescript
// In PostHog Funnels
// Step 1: search_performed
// Step 2: room_joined
// Step 3: message_sent
// Time window: 1 hour
```

### Retention: Day 7 Return Rate

```typescript
// In PostHog Retention
// Initial event: user_signed_up
// Return event: session_started
// Return period: 7 days
```

---

## Testing Events

### Development Testing

```typescript
// Add to analytics.ts for debugging
if (import.meta.env.DEV) {
  console.log('[Analytics Event]', eventName, properties);
}
```

### Verify in PostHog

1. Open PostHog dashboard
2. Go to "Live Events" (real-time stream)
3. Perform action in your app
4. Event should appear within seconds

### Check Event Properties

```typescript
// In browser console
posthog.debug();  // Enable debug mode
// Perform action
// Check console for detailed logs
```

---

## Compliance & Privacy

### GDPR Compliance

- Allow users to opt out of tracking
- Delete user data on request
- Don't track without consent

### Implementation:

```typescript
// Check for consent before tracking
const hasConsent = localStorage.getItem('analytics_consent');
if (!hasConsent) {
  // Show consent banner
  // Only initialize after consent
}
```

### Data Retention

PostHog default: 90 days  
Configure in: PostHog Settings → Data Retention

---

## Performance Considerations

### Event Batching

PostHog automatically batches events:
- Events sent every 10 seconds
- Or when batch reaches 10 events
- Configurable in `posthog.init()`

### Impact on Performance

- Events tracked async (non-blocking)
- Minimal bundle size impact (~30KB gzipped)
- Network requests batched

### Optimizations

```typescript
// Don't track too frequently
let lastTrack = 0;
function trackScrollPosition(position: number) {
  const now = Date.now();
  if (now - lastTrack < 1000) return; // Throttle to 1 per second
  lastTrack = now;
  posthog.capture('scroll_position', { position });
}
```

---

## Troubleshooting

### Events Not Tracking

**Check:**
1. Is PostHog initialized? `console.log(posthog.__loaded)`
2. Is API key correct? Check `.env` file
3. Network tab: Look for requests to PostHog
4. Browser console: Check for errors

### Wrong Event Properties

**Fix:**
1. Check property names (snake_case)
2. Verify types (string, number, boolean)
3. Test with `posthog.debug()`

### Events in Wrong Project

**Fix:**
1. Verify `VITE_POSTHOG_KEY` matches your project
2. Use separate keys for dev/staging/prod

---

## Resources

- **PostHog Docs:** https://posthog.com/docs/libraries/js
- **Event Best Practices:** https://posthog.com/docs/data/events
- **Privacy & GDPR:** https://posthog.com/docs/privacy

---

**Last Updated:** January 1, 2026  
**Maintained by:** Analytics Team
