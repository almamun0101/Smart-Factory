# FactoryBill v3 — Factory Energy Manager

## ⚡ Quick Start

```bash
npm install
npm run dev
```
Open http://localhost:3000 — **no login required**, auto-signs in as guest.

---

## 🔥 Firebase Setup (Required)

### 1. Enable Anonymous Authentication
Firebase Console → Authentication → Sign-in method → **Anonymous** → Enable

### 2. Enable Email/Password (optional, for account registration)
Firebase Console → Authentication → Sign-in method → **Email/Password** → Enable

### 3. Create Realtime Database
Firebase Console → Realtime Database → Create database → choose region

### 4. Set Security Rules
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### 5. Update databaseURL in src/lib/firebase.js
Copy the exact URL from Firebase Console → Realtime Database → Data tab.

---

## 📁 Files (all JSX — no TypeScript)

```
src/
├── app/
│   ├── layout.jsx          Server component (metadata only)
│   ├── Providers.jsx       Client providers + ErrorBoundary
│   ├── page.jsx            Redirect → /dashboard/machines
│   ├── login/page.jsx      Optional account page (register/upgrade)
│   ├── globals.css         Design tokens + utility classes
│   └── dashboard/
│       ├── layout.jsx      Loading + error screen (no auth redirect)
│       ├── machines/       Month accordion + machine readings
│       ├── electricity/    Recharges + deduction breakdown
│       ├── calculation/    Combined monthly summary
│       ├── settings/       Machines, rates, deductions config
│       └── profile/        User profile (guest upgrade CTA)
├── components/Sidebar.jsx  Desktop sidebar + mobile bottom nav
├── context/
│   ├── AuthContext.jsx     Auto guest sign-in, register, upgrade
│   ├── LangContext.jsx     EN / Bangla language switching
│   └── SettingsContext.jsx Firebase-synced machine/price config
└── lib/
    ├── firebase.js         Firebase init
    ├── db.js               All Realtime DB helpers
    └── i18n.js             All UI strings EN + BN
```

## ⚠️ Important
- This project uses **JSX only** (no TypeScript)
- If you see "duplicate page" warnings, you have old `.tsx` files in your folder — delete them
- If you see a loading screen forever: check that Anonymous Auth is enabled in Firebase
