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

## License

**All Rights Reserved — Source-Available, Personal Use Only (Non-Commercial, No-Derivatives)**

Copyright © 2026 `chalot28`. All rights reserved.

- **Allowed:** You may view and read this source code for transparency/security inspection, and download and use the official builds for **personal, non-commercial use only**.
- **Not Allowed:** Without explicit written permission from the author, you may **not** modify, adapt, create derivative works, redistribute, fork for private/public redistribution, claim ownership of any part of this codebase, or use this software or its source code for any **commercial purpose**.

---

**Bản quyền & Giấy phép sử dụng (Tiếng Việt):**

- **Được phép:** Xem/đọc mã nguồn công khai để kiểm chứng minh bạch, tải và sử dụng ứng dụng cho mục đích **cá nhân, phi thương mại**.
- **Nghiêm cấm:** Chỉnh sửa, tạo bản phái sinh, phân phối lại, tự nhận làm sản phẩm riêng, hoặc sử dụng mã nguồn/ứng dụng cho **mục đích thương mại** dưới mọi hình thức khi chưa có sự đồng ý bằng văn bản của tác giả (`chalot28`).
