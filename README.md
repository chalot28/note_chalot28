# Liquid Notes (`note_chalot28`)

Offline-first note-taking, daily planner, and spreadsheet application built with React Native and Expo, featuring local AES-256-GCM encryption, a PIN/biometric-protected private vault, and an offline TOTP 2FA authenticator.

## Features

- **Notes:** Rich-text editing (`@10play/tentap-editor` on native, sanitized `contentEditable` on web), `#tag` extraction, `[[backlink]]` suggestions, pin/archive, and local AES-256-GCM encryption at rest.
- **Private Vault (`(vault)`):** Separate PIN-protected space for sensitive notes and credentials, using PBKDF2-SHA256 (100,000 iterations) key wrapping, rate-limited PIN attempts, optional biometric unlock, screen-capture protection, idle auto-lock, and automatic clipboard clearing.
- **Offline 2FA Authenticator:** TOTP/HOTP code generation (`otpauth`) with QR code scanning (`expo-camera`) and encrypted secret storage.
- **Planner & Spreadsheets:** Daily task agenda with reminders (`@notifee/react-native`), lunar calendar support, and an embedded formula spreadsheet engine (`hyperformula`).
- **Privacy Shield:** Frosted glass overlay (`PrivacyShieldOverlay`) that blurs app content when switching apps, opening recents, or changing browser tabs.

## Tech Stack

- **Framework:** Expo (~52) & React Native (0.76) with Expo Router
- **Language:** TypeScript
- **State & Storage:** Zustand, `expo-secure-store`, `react-native-mmkv`, `@op-engineering/op-sqlite` + Drizzle ORM
- **Security:** `react-native-quick-crypto` (native) / Web Crypto API (web), `expo-local-authentication`, `expo-screen-capture`

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on Android / iOS
npm run android
npm run ios

# Typecheck
npm run typecheck
```
