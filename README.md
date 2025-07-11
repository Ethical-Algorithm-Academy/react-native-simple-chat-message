# SimpleChatApp

A modern React Native chat application using Supabase for authentication, real-time messaging, and file storage. Supports file uploads, image/video previews, deep linking for authentication, and robust UI/UX for both group and individual chats.

---

## Features
- Email/password authentication (Supabase)
- Google sign-in
- Real-time chat with groups and individuals
- File uploads (images, videos, documents) with previews
- Video thumbnail generation
- Deep linking for magic links, password reset, and account confirmation
- Snackbar notifications for user feedback
- MFA (Multi-Factor Authentication) support
- Responsive, modern UI

---

## Setup Instructions

### 1. **Clone the Repository**
```sh
git clone https://github.com/Ethical-Algorithm-Academy/react-native-simple-chat-message.git
cd SimpleChatApp
```

### 2. **Install All Dependencies**
```sh
# Install core dependencies
npm install

# Install video playback
npm install react-native-video

# Install video thumbnail generation
npm install react-native-create-thumbnail

# (Optional) If you use Google sign-in
npm install @react-native-google-signin/google-signin

# (Optional) If you use Expo Document Picker
npm install expo-document-picker

# (Optional) If you use react-native-responsive-fontsize
npm install react-native-responsive-fontsize

# (Optional) If you use vector icons
npm install @expo/vector-icons

# (Optional) If you use React Navigation
npm install @react-navigation/native @react-navigation/native-stack

# (Optional) If you use Snackbar
npm install react-native-snackbar
```

### 3. **Supabase Setup**
- Create a project at [supabase.com](https://supabase.com/)
- **Your Supabase Project:** [https://app.supabase.com/project/cnipftusvgsjcywlaywo](https://app.supabase.com/project/cnipftusvgsjcywlaywo)
- Set up tables: `users`, `channels`, `messages`, etc.
- Enable authentication (email/password, Google)
- Set up Storage bucket (e.g., `simple-chat-bucket`)
- Configure Auth → URL Configuration:
  - **Site URL:** `simplechatapp://`
  - **Redirect URLs:**
    - `simplechatapp://main-app`
    - `simplechatapp://confirm-account`
    - `simplechatapp://reset-password`
- Update your Supabase keys in `lib/supabase.js`

---

## License
MIT



.\gradlew assembleRelease
.\gradlew appDistributionUploadRelease

adb install -r app/build/outputs/apk/release/app-release.apk
adb logcat *:S ReactNativeJS:V


  