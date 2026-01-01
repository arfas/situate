// k6 Load Testing Script for Message Posting
// Run with: k6 run tests/load/messages.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% error rate
    errors: ['rate<0.05'],            // Less than 5% application errors
  },
};

// Test data
const SUPABASE_URL = __ENV.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = __ENV.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const TEST_ROOM_ID = __ENV.TEST_ROOM_ID || 'test-room-id';
const TEST_USER_TOKEN = __ENV.TEST_USER_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_USER_TOKEN}`,
  'apikey': SUPABASE_KEY,
};

export default function () {
  // Test 1: Read messages (most common operation)
  const readResponse = http.get(
    `${SUPABASE_URL}/rest/v1/messages?room_id=eq.${TEST_ROOM_ID}&select=*`,
    { headers }
  );

  check(readResponse, {
    'read messages status 200': (r) => r.status === 200,
    'read messages has data': (r) => JSON.parse(r.body).length >= 0,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Post message (write operation)
  const messagePayload = JSON.stringify({
    room_id: TEST_ROOM_ID,
    user_id: `user-${__VU}`, // Virtual User ID
    content: `Load test message from VU ${__VU} at ${new Date().toISOString()}`,
    is_deleted: false,
    is_hidden: false,
    upvotes: 0,
    downvotes: 0,
  });

  const postResponse = http.post(
    `${SUPABASE_URL}/rest/v1/messages`,
    messagePayload,
    { headers }
  );

  check(postResponse, {
    'post message status 201': (r) => r.status === 201,
    'post message response time OK': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);

  // Test 3: Search rooms
  const searchResponse = http.get(
    `${SUPABASE_URL}/rest/v1/rooms?title=ilike.*test*&select=*&limit=10`,
    { headers }
  );

  check(searchResponse, {
    'search status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

// Teardown function
export function teardown(data) {
  // Clean up test data if needed
  console.log('Load test completed');
}
