# Manual QA Checklist

## Pre-Testing Setup
- [ ] Clear browser cache
- [ ] Use incognito/private mode
- [ ] Check console for errors (F12)
- [ ] Note browser and version
- [ ] Record screen for bugs (optional)

---

## Test Session 1: First-Time User Flow

### 1. Landing Page
- [ ] Navigate to app URL
- [ ] Welcome screen displays correctly
- [ ] "Get Started" button visible
- [ ] "Sign In" link visible
- [ ] Click "Get Started"

### 2. Sign Up
- [ ] Sign up form appears
- [ ] Enter email: `test+{timestamp}@example.com`
- [ ] Enter password: `TestPass123`
- [ ] Click "Create account"
- [ ] No error messages
- [ ] Redirects to main app

### 3. First Search
- [ ] Search input visible
- [ ] Type: "test"
- [ ] Wait 500ms (debounce)
- [ ] Results appear or "No matches" message
- [ ] "Create Room" button in header visible

### 4. Create First Room
- [ ] Click "Create Room" in header
- [ ] Modal appears
- [ ] Enter title: "My First Room"
- [ ] Enter description: "Testing the app"
- [ ] Enter category: "General"
- [ ] Click "Create Room"
- [ ] Anonymity selector appears
- [ ] Choose "Fully Anonymous"
- [ ] Random name generated (e.g., "Brave_Tiger123")
- [ ] Click confirm
- [ ] Room view loads
- [ ] Empty state: "No messages yet"

### 5. Post First Message
- [ ] Message composer visible at bottom
- [ ] Type: "Hello world!"
- [ ] Click "Post" or press Enter
- [ ] Message appears immediately
- [ ] Display name shows (e.g., "Brave_Tiger123")
- [ ] Timestamp shows (e.g., "just now")
- [ ] Character count decreases

### 6. Navigate & Logout
- [ ] Click "Back to search"
- [ ] Returns to search page
- [ ] Room appears in search results
- [ ] Shows "1 members, 1 messages"
- [ ] Click user menu / email
- [ ] Click "Sign out"
- [ ] Returns to welcome screen

**Result**: PASS ☐ / FAIL ☐  
**Notes**:

---

## Test Session 2: Multi-User Real-Time

### Setup
- [ ] Open Browser Window 1 (User 1)
- [ ] Open Browser Window 2 - Incognito (User 2)
- [ ] Position windows side-by-side

### User 1: Sign In & Enter Room
- [ ] Sign in as User 1
- [ ] Search for "My First Room"
- [ ] Join the room
- [ ] Select anonymity level
- [ ] Room loads with 1 previous message

### User 2: Sign Up & Join Same Room
- [ ] Sign up as new user (User 2)
- [ ] Search for "My First Room"
- [ ] Click the room
- [ ] Join with different anonymity level
- [ ] Room loads

### Real-Time Messaging Test
- [ ] User 1: Post "Message from User 1"
- [ ] **Check User 2 window**: Message appears within 2 seconds
- [ ] User 2: Post "Message from User 2"
- [ ] **Check User 1 window**: Message appears within 2 seconds
- [ ] Both users: See both messages
- [ ] Member count shows "2 members"

### Rapid Fire Test
- [ ] User 1: Post 5 messages quickly
- [ ] **Check User 2**: All 5 messages appear
- [ ] No messages lost
- [ ] Messages in correct order
- [ ] No duplicates

**Result**: PASS ☐ / FAIL ☐  
**Notes**:

---

## Test Session 3: Edge Cases

### Long Content
- [ ] Post message with 2000 characters
- [ ] Message posts successfully
- [ ] Message displays fully
- [ ] No UI breaking

### Special Characters
- [ ] Post: `!@#$%^&*()_+-={}[]|\:";'<>?,./`
- [ ] Post: `<script>alert('xss')</script>`
- [ ] Post: `'; DROP TABLE messages;--`
- [ ] All render safely, no code execution

### Emojis & Unicode
- [ ] Post: 😀😃😄😁😆😅🤣😂
- [ ] Post: 中文测试
- [ ] Post: العربية
- [ ] All display correctly

### Network Issues
- [ ] Open DevTools → Network tab
- [ ] Throttle to "Slow 3G"
- [ ] Post a message
- [ ] Loading indicator shows
- [ ] Message eventually posts
- [ ] Throttle to "Offline"
- [ ] Try to post message
- [ ] Error message shows
- [ ] Turn network back online
- [ ] App reconnects automatically

### Empty States
- [ ] Search for nonsense: "xyzabc123notfound"
- [ ] "No matches" message shows
- [ ] Create room with title only (no description)
- [ ] Room created successfully
- [ ] Leave room and rejoin
- [ ] Works correctly

**Result**: PASS ☐ / FAIL ☐  
**Notes**:

---

## Test Session 4: Cross-Browser

### Chrome
- [ ] All features work
- [ ] UI looks correct
- [ ] Version: ___________

### Firefox
- [ ] All features work
- [ ] UI looks correct
- [ ] Version: ___________

### Safari (if available)
- [ ] All features work
- [ ] UI looks correct
- [ ] Version: ___________

### Edge
- [ ] All features work
- [ ] UI looks correct
- [ ] Version: ___________

**Result**: PASS ☐ / FAIL ☐  
**Notes**:

---

## Test Session 5: Mobile Responsive

### Setup
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select device: iPhone 12 Pro

### Mobile Tests
- [ ] Layout adapts to narrow screen
- [ ] Text is readable (not too small)
- [ ] Buttons are tappable (min 44x44px)
- [ ] No horizontal scrolling
- [ ] Search input usable
- [ ] Message composer works
- [ ] Virtual keyboard doesn't break layout
- [ ] Test on actual mobile device if possible

**Result**: PASS ☐ / FAIL ☐  
**Notes**:

---

## Bug Report Template

If you find a bug, document it using this format:

```
**Title**: Brief description

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**:
What should happen

**Actual Result**:
What actually happened

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- Screen size: 1920x1080

**Screenshots/Video**:
[Attach if available]

**Console Errors**:
[Paste any red errors from console]
```

---

## Sign-Off

**Tester Name**: _______________  
**Date**: _______________  
**Build/Version**: _______________  
**Overall Result**: PASS ☐ / FAIL ☐

**Critical Issues Found**: _______________  
**Blockers for Release**: YES ☐ / NO ☐

**Additional Notes**:

