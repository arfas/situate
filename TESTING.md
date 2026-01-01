# SupportCircle Testing Plan

## Test Coverage Strategy

### 1. Unit Tests (Services & Utilities)
- API service functions
- Message service functions
- Auth context logic
- Utility functions

### 2. Integration Tests (Components)
- Auth flow
- Room creation & joining
- Message posting & display
- Search functionality
- Real-time updates

### 3. Manual QA Checklist
- User flows
- Edge cases
- Browser compatibility
- Performance

### 4. Load Testing
- Concurrent users
- Message throughput
- Database performance

---

## Test Cases

### Authentication ✓
- [x] Sign up with valid email
- [x] Sign up with invalid email format
- [x] Login with correct credentials
- [x] Login with incorrect password
- [x] Logout successfully
- [ ] Session persistence across page refresh
- [ ] Auto-logout after session expiry
- [ ] Multiple tabs same user

### Search & Discovery
- [x] Search by keyword returns matching rooms
- [ ] Search with no results shows message
- [ ] Empty state shows "Start typing" message
- [ ] Create room button always visible in header
- [ ] Search debounce works (500ms delay)

### Room Management
- [x] Create room with title only
- [x] Create room with full details
- [ ] Create room with duplicate title
- [ ] Room appears in search after creation
- [ ] Room shows correct member count
- [ ] Room shows last activity time

### Joining Rooms
- [x] Anonymity selector appears for new join
- [x] Join with fully anonymous
- [x] Join with persistent pseudonym
- [ ] Join same room twice (should show error)
- [ ] Rejoin room after leaving
- [ ] See room immediately after joining

### Messaging
- [x] Post simple text message
- [x] Message appears immediately for sender
- [x] Message appears for other users (real-time)
- [ ] Post message with special characters (!@#$%^&*)
- [ ] Post message with emojis 😊
- [ ] Post very long message (2000 chars)
- [ ] Post empty message (should be blocked)
- [ ] Edit own message within 5 minutes
- [ ] Cannot edit others' messages

### Message Display
- [x] Messages show display name
- [x] Messages show timestamp
- [ ] Messages show relative time ("5m ago")
- [ ] Own messages distinguished visually
- [ ] Deleted messages show "[deleted]"
- [ ] Hidden messages don't appear

### Voting
- [ ] Upvote message increments count
- [ ] Downvote message decrements count
- [ ] Toggle vote (up->down->none)
- [ ] Vote persists across refresh
- [ ] Cannot vote on own messages
- [ ] Vote counts update in real-time

### Reporting
- [ ] Report message opens dialog
- [ ] Report with reason saves to database
- [ ] 3 reports auto-hides message
- [ ] Moderators can see hidden messages
- [ ] Reporter remains anonymous

### Real-time Sync
- [x] New messages appear without refresh
- [ ] Message edits sync instantly
- [ ] Vote counts update live
- [ ] Member count updates when users join
- [ ] Reconnects after network drop
- [ ] Handles connection errors gracefully

### Edge Cases
- [x] No rooms in database shows empty state
- [x] No messages in room shows empty state
- [ ] Network offline shows indicator
- [ ] Slow network shows loading states
- [ ] Very active room (100+ msgs) scrolls smoothly
- [ ] Multiple rooms open in tabs work independently
- [ ] Browser back button works correctly

### Security
- [ ] Cannot access room without membership
- [ ] Cannot post without authentication
- [ ] Cannot see other users' emails
- [ ] Cannot modify database directly (RLS works)
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized

### Performance
- [ ] Room loads in <2 seconds
- [ ] Search returns in <1 second
- [ ] Message posts in <500ms
- [ ] Handles 50 messages without lag
- [ ] Real-time updates <1 second latency
- [ ] Page loads <5 seconds on 3G

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Responsive Design
- [ ] Works on mobile (320px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1920px width)
- [ ] Touch gestures work on mobile
- [ ] Keyboard navigation works

---

## Priority Levels

**P0 (Critical)**: Must work for MVP launch
- Authentication
- Create/join room
- Post message
- See messages from others

**P1 (High)**: Should work for good UX
- Real-time updates
- Search functionality
- Voting system

**P2 (Medium)**: Nice to have
- Reporting
- Message editing
- Advanced moderation

**P3 (Low)**: Future improvements
- Typing indicators
- Read receipts
- User profiles

---

## Testing Schedule

### Week 1: Core Functionality
- Day 1-2: Auth & room management tests
- Day 3-4: Messaging tests
- Day 5: Real-time sync tests

### Week 2: Integration & Edge Cases
- Day 1-2: Full user flow tests
- Day 3: Edge case testing
- Day 4-5: Performance & load testing

### Week 3: Polish & Fixes
- Day 1-3: Fix critical bugs
- Day 4: Regression testing
- Day 5: Final QA sign-off

---

## Bug Severity Levels

**Critical (P0)**: App unusable or data loss
- Auth completely broken
- Cannot post any messages
- Database errors affecting all users

**High (P1)**: Major feature broken
- Real-time not working
- Search returns no results
- Cannot join rooms

**Medium (P2)**: Minor feature broken or poor UX
- Voting doesn't work
- Timestamps wrong
- Loading states missing

**Low (P3)**: Cosmetic or rare issues
- Button alignment off
- Tooltip text unclear
- Works on retry

---

## Success Metrics

### Functional
- ✅ 100% of P0 tests passing
- ✅ 95% of P1 tests passing
- ✅ 80% of P2 tests passing

### Performance
- ✅ Page load <3s (95th percentile)
- ✅ Message latency <1s (p95)
- ✅ Search <1s (p95)

### Reliability
- ✅ 99% uptime
- ✅ <1% error rate
- ✅ Real-time 95% delivery rate

---

## Test Environment Setup

See `tests/setup.md` for detailed instructions on:
- Installing test dependencies
- Configuring test database
- Running automated tests
- Manual testing procedures
