# Test Setup Guide

## Prerequisites

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install --save-dev @vitest/ui
```

## Test Database Setup

1. Create a separate Supabase project for testing (recommended)
2. Or use the same project with a `_test` suffix for tables
3. Copy `.env` to `.env.test`:

```env
VITE_SUPABASE_URL=your-test-project-url
VITE_SUPABASE_ANON_KEY=your-test-anon-key
```

## Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific test file
npm test auth.test.tsx

# Run in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## Test Database Seeding

```bash
# Reset test database
npm run test:db:reset

# Seed with sample data
npm run test:db:seed
```

## Manual Testing

1. Start dev server: `npm run dev`
2. Open two browser windows (different users)
3. Follow test cases in TESTING.md
4. Document any failures in GitHub Issues

## Load Testing

```bash
# Install k6
# Windows: choco install k6
# Mac: brew install k6

# Run load test
k6 run tests/load/messages.js
```
