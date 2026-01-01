# SupportCircle - Situational Support Chat Platform

A peer support platform where users can find and join communities based on their specific situations. Features AI-powered semantic search, anonymous participation options, and Reddit-style threaded conversations.

## Features

### Core Functionality
- **AI-Powered Search**: Semantic search using OpenAI embeddings to match users with relevant support communities
- **Flexible Anonymity**: Choose from 4 anonymity levels per room (fully anonymous, pseudonym, semi-anonymous, verified)
- **Threaded Conversations**: Reddit-style message threading with collapsible replies
- **Voting System**: Upvote/downvote messages, sort by helpful/recent/oldest
- **Real-time Updates**: Live message updates using Supabase real-time subscriptions
- **Moderation**: Report system with auto-hiding after 3 reports

### User Experience
- Clean onboarding flow with welcome screen
- Smart search with keyword fallback if AI is unavailable
- Debounced search (500ms) to reduce API calls
- Query caching to minimize OpenAI costs
- Popular rooms displayed when no search results

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons

### Backend
- Supabase (PostgreSQL + Auth + Real-time + Edge Functions)
- pgvector extension for semantic search
- OpenAI API for embeddings (text-embedding-3-small)

### Database Schema
- `profiles` - User profiles with anonymity preferences
- `rooms` - Chat rooms with embeddings for search
- `room_memberships` - User-room relationships with display names
- `messages` - Threaded messages with vote counts
- `votes` - User votes on messages
- `reports` - Moderation reports
- `search_queries` - Cached query embeddings

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   └── AuthForm.tsx              # Sign in/up form
│   ├── Onboarding/
│   │   ├── Welcome.tsx               # Landing page
│   │   └── AnonymitySelector.tsx    # Privacy level chooser
│   ├── Search/
│   │   ├── SearchBar.tsx             # Debounced search input
│   │   ├── RoomCard.tsx              # Room preview card
│   │   └── SearchResults.tsx         # Search results display
│   └── Room/
│       ├── RoomView.tsx              # Main room interface
│       ├── MessageItem.tsx           # Individual message with threading
│       └── MessageComposer.tsx       # Message input form
├── contexts/
│   └── AuthContext.tsx               # Authentication state management
├── services/
│   ├── api.ts                        # Room and membership operations
│   └── messages.ts                   # Message and voting operations
├── lib/
│   ├── supabase.ts                   # Supabase client config
│   └── database.types.ts             # TypeScript database types
└── App.tsx                           # Main app with routing

supabase/functions/
├── generate-embeddings/              # OpenAI embedding generation
└── search-rooms/                     # Semantic + keyword search
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Supabase project created
- OpenAI API key (for semantic search)

### 2. Environment Variables
Already configured in `.env`:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Configure OpenAI API Key
The semantic search feature requires an OpenAI API key. Add it to your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to Project Settings > Edge Functions > Secrets
3. Add a new secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (starts with `sk-`)

Without this key, the app will fall back to keyword search.

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

## How It Works

### User Flow
1. **Welcome Screen**: User sees landing page with feature highlights
2. **Sign Up/In**: Email/password authentication via Supabase Auth
3. **Search**: User describes their situation (e.g., "I just got laid off from my tech job")
4. **AI Matching**: System generates embedding and finds similar rooms
5. **Choose Anonymity**: Before joining, user selects privacy level
6. **Join Room**: User enters room and can post/reply/vote
7. **Real-time**: Messages update live as others post

### Semantic Search Process
1. User enters search query
2. Check if query was searched before (cache lookup)
3. If cached, use stored embedding; otherwise call OpenAI API
4. Run hybrid search (semantic + keyword) in PostgreSQL
5. Return top matches with similarity scores
6. Cache query embedding for future use

### Anonymity Levels
- **Fully Anonymous**: Random username like "Brave_Tiger472"
- **Persistent Pseudonym**: Custom nickname across rooms
- **Semi-Anonymous**: Share basic info like "30s, tech worker, NYC"
- **Verified Professional**: Show credentials (coming soon)

### Message Threading
- Top-level messages display first
- Replies nested and indented
- Click username to collapse/expand thread
- Vote on any message
- Sort entire room by helpful/recent/oldest

### Moderation
- Any user can report a message
- After 3 reports, message auto-hides
- Moderators can review reports (basic system)
- Flag urgent content (self-harm keywords)

## Database Security

All tables use Row Level Security (RLS):
- Users can only read/update their own profiles
- Users can only see messages in rooms they've joined
- Users can only vote once per message
- Users can report any message they can see
- Room membership required to post messages

## Performance Optimizations

1. **Search Query Caching**: Store embeddings for common queries
2. **Debounced Search**: Wait 500ms after typing stops
3. **Keyword Fallback**: Use PostgreSQL text search if AI fails
4. **Real-time Subscriptions**: Only listen to active room
5. **Vote Count Caching**: Store counts in messages table
6. **Indexes**: Optimized for common queries

## Cost Considerations

### OpenAI API
- Model: `text-embedding-3-small` (~$0.02 per 1M tokens)
- Typical query: ~10 tokens = $0.0000002
- With caching: Most searches are free
- Estimate: $1-5/month for 10K searches

### Supabase
- Free tier includes:
  - 500MB database
  - 2GB bandwidth
  - 50K monthly active users
  - Unlimited Edge Function invocations

## Future Enhancements

- [ ] Push notifications for replies
- [ ] Direct messaging between users
- [ ] Room categories and tagging
- [ ] Advanced moderation dashboard
- [ ] User karma/reputation system
- [ ] Mobile app (React Native)
- [ ] Email digests of activity
- [ ] Professional verification system

## Security Best Practices

- All API calls authenticated with JWT
- RLS policies prevent unauthorized access
- Passwords hashed by Supabase Auth
- Rate limiting on Edge Functions
- Input validation on all forms
- XSS prevention via React
- CORS configured on Edge Functions

## Troubleshooting

### Search Returns No Results
- Check OpenAI API key is configured
- Verify pgvector extension is enabled
- Look for errors in Edge Function logs
- Try keyword search by forcing error

### Messages Not Updating in Real-time
- Check Supabase real-time is enabled
- Verify user is subscribed to room channel
- Check browser console for errors
- Refresh page to force reconnect

### Can't Join Room
- Verify user is authenticated
- Check RLS policies on room_memberships
- Ensure room exists and isn't archived
- Look for unique constraint violations

## Support

For issues or questions, create an issue in the repository.
