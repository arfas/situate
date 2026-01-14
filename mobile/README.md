# React Native SupportCircle

Cross-platform mobile app for iOS, Android, and Web.

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Run the app:**

   **For Web:**
   ```bash
   npm run web
   ```

   **For iOS (Mac only):**
   ```bash
   npm run ios
   ```

   **For Android:**
   ```bash
   npm run android
   ```

## Project Structure

```
mobile/
├── src/
│   ├── screens/         # Screen components
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── lib/            # Utilities (Supabase, crypto)
│   └── services/       # API services
├── App.tsx             # Root component
└── app.json            # Expo configuration
```

## Building for Production

**iOS:**
```bash
expo build:ios
```

**Android:**
```bash
expo build:android
```

**Web:**
```bash
expo build:web
```

## Features

- ✅ Cross-platform (iOS, Android, Web)
- ✅ Native navigation
- ✅ Tailwind CSS via NativeWind
- ✅ Supabase authentication
- ✅ End-to-end encryption
- ✅ Real-time messaging
- ✅ Anonymous chat rooms

## Next Steps

You need to:
1. Copy the remaining services and contexts from the web app
2. Convert web components to React Native components
3. Test on iOS/Android simulators
4. Add app icons and splash screens
5. Submit to App Store / Play Store
