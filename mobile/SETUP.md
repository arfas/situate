# SupportCircle Mobile - Setup Guide

## ✅ Complete React Native App Ready!

Your app now runs on **iOS, Android, and Web** with one codebase.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your Supabase credentials from:
# https://app.supabase.com/project/YOUR_PROJECT/settings/api
```

### 3. Run the App

**Web (easiest to test):**
```bash
npm run web
```
Opens at `http://localhost:8081`

**iOS (requires Mac + Xcode):**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```
Requires Android Studio + emulator or physical device

---

## 📱 Features Implemented

✅ **Cross-platform**: iOS, Android, Web with same code  
✅ **Authentication**: Sign up / sign in with Supabase  
✅ **Search**: Find and browse support rooms  
✅ **Real-time chat**: Messages update automatically  
✅ **Anonymous posting**: Display names per room  
✅ **Encryption ready**: E2E encryption context included  
✅ **Native UI**: TouchableOpacity, native inputs, smooth scrolling  
✅ **Tailwind styling**: NativeWind for consistent design  

---

## 📂 Project Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── WelcomeScreen.tsx    # Landing page
│   │   ├── AuthScreen.tsx       # Sign in/up
│   │   ├── SearchScreen.tsx     # Browse rooms
│   │   └── RoomScreen.tsx       # Chat interface
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── EncryptionContext.tsx # E2E encryption
│   ├── services/
│   │   ├── api.ts               # Room operations
│   │   └── messages.ts          # Message CRUD
│   └── lib/
│       ├── supabase.ts          # Supabase client
│       └── encryption.ts        # Crypto functions
├── App.tsx                       # Root navigation
├── app.json                      # Expo config
└── package.json                  # Dependencies
```

---

## 🧪 Testing

### Web Testing (Recommended First)
1. `npm run web`
2. Open `http://localhost:8081`
3. Test all features in browser DevTools
4. Use mobile viewport in browser

### iOS Testing
1. Install Xcode from App Store
2. `npm run ios`
3. Select simulator or device
4. Test native gestures and keyboard

### Android Testing
1. Install Android Studio
2. Create AVD (Android Virtual Device)
3. `npm run android`
4. Test on emulator

### Physical Device Testing
```bash
# Install Expo Go app from App/Play Store
npm start
# Scan QR code with your phone
```

---

## 🎨 Customization

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "YourAppName",
    "slug": "your-app-slug"
  }
}
```

### Add App Icons
1. Create 1024x1024 PNG icon
2. Place in `assets/icon.png`
3. Run `expo prebuild`

### Change Colors
Edit `tailwind.config.js` for theme colors

---

## 📦 Building for Production

### Web Build
```bash
npx expo export:web
# Output in web-build/ folder
# Deploy to Netlify/Vercel/any static host
```

### iOS Build (requires Apple Developer account)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build
eas build --platform ios
```

### Android Build
```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

---

## 🔧 Troubleshooting

**"Metro bundler stuck":**
```bash
npx expo start -c  # Clear cache
```

**"Module not found":**
```bash
rm -rf node_modules
npm install
```

**"Android build fails":**
```bash
cd android && ./gradlew clean
cd .. && npm run android
```

**"iOS build fails":**
```bash
cd ios && pod install
cd .. && npm run ios
```

---

## 🌐 Deploy Web Version

Your web build works exactly like the original:

```bash
npm run web
npx expo export:web
# Upload web-build/ to Netlify or Vercel
```

---

## 📱 Publish to Stores

### Apple App Store
1. Join Apple Developer Program ($99/year)
2. Create app in App Store Connect
3. `eas build --platform ios`
4. Submit for review

### Google Play Store
1. Create Google Play Developer account ($25 one-time)
2. Create app in Play Console
3. `eas build --platform android`
4. Upload AAB and submit

---

## 🎯 What's Different from Web Version

**Same:**
- All features (auth, rooms, messages, encryption)
- Same Supabase backend
- Same Tailwind styling approach

**Native additions:**
- TouchableOpacity for better mobile UX
- KeyboardAvoidingView for input handling
- Native navigation (no URLs in iOS/Android)
- AsyncStorage instead of localStorage
- FlatList for optimized scrolling
- Pull-to-refresh ready

---

## ✨ You're Ready!

Your app is **test-ready** right now:

```bash
cd mobile
npm install
npm run web  # Start testing!
```

All features from your web app are working on mobile! 🎉
