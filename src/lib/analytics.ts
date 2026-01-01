import posthog from 'posthog-js';
import { User } from '@supabase/supabase-js';

// Initialize PostHog
export const initAnalytics = () => {
  if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false, // We'll track events manually for better control
    });
  }
};

// Identify user for tracking
export const identifyUser = (user: User, profile?: { display_name?: string }) => {
  if (!posthog.__loaded) return;
  
  posthog.identify(user.id, {
    email: user.email,
    created_at: user.created_at,
    display_name: profile?.display_name,
  });
};

// Reset analytics on logout
export const resetAnalytics = () => {
  if (!posthog.__loaded) return;
  posthog.reset();
};

// ACQUISITION EVENTS
export const trackSignup = (method: 'email' | 'google' = 'email', source?: string) => {
  if (!posthog.__loaded) return;
  posthog.capture('user_signed_up', {
    method,
    source: source || 'organic',
  });
};

export const trackSearchQuery = (query: string, resultsCount: number) => {
  if (!posthog.__loaded) return;
  posthog.capture('search_performed', {
    query,
    results_count: resultsCount,
    query_length: query.length,
  });
};

// ENGAGEMENT EVENTS
export const trackRoomCreated = (roomId: string, category: string, isAnonymous: boolean) => {
  if (!posthog.__loaded) return;
  posthog.capture('room_created', {
    room_id: roomId,
    category,
    is_anonymous: isAnonymous,
  });
};

export const trackRoomJoined = (roomId: string, isAnonymous: boolean) => {
  if (!posthog.__loaded) return;
  posthog.capture('room_joined', {
    room_id: roomId,
    is_anonymous: isAnonymous,
  });
};

export const trackMessageSent = (roomId: string, messageLength: number, isAnonymous: boolean) => {
  if (!posthog.__loaded) return;
  posthog.capture('message_sent', {
    room_id: roomId,
    message_length: messageLength,
    is_anonymous: isAnonymous,
  });
};

export const trackRoomViewed = (roomId: string) => {
  if (!posthog.__loaded) return;
  posthog.capture('room_viewed', {
    room_id: roomId,
  });
};

export const trackSessionStart = () => {
  if (!posthog.__loaded) return;
  posthog.capture('session_started');
};

// QUALITY EVENTS
export const trackMessageUpvoted = (messageId: string, roomId: string) => {
  if (!posthog.__loaded) return;
  posthog.capture('message_upvoted', {
    message_id: messageId,
    room_id: roomId,
  });
};

export const trackMessageReported = (messageId: string, roomId: string, reason: string) => {
  if (!posthog.__loaded) return;
  posthog.capture('message_reported', {
    message_id: messageId,
    room_id: roomId,
    reason,
  });
};

export const trackFirstMessageTime = (roomId: string, timeToFirstMessage: number) => {
  if (!posthog.__loaded) return;
  posthog.capture('first_message_time', {
    room_id: roomId,
    time_seconds: timeToFirstMessage,
  });
};

// PAGE TRACKING
export const trackPageView = (pageName: string) => {
  if (!posthog.__loaded) return;
  posthog.capture('$pageview', {
    page_name: pageName,
  });
};

// FEATURE FLAGS (for A/B testing)
export const getFeatureFlag = (flagName: string): boolean => {
  if (!posthog.__loaded) return false;
  return posthog.isFeatureEnabled(flagName) || false;
};

// Custom properties for user segments
export const setUserProperties = (properties: Record<string, any>) => {
  if (!posthog.__loaded) return;
  posthog.people.set(properties);
};
