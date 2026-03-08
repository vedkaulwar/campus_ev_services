# Campus EV Services 🛴⚡

A modern, full-stack electric scooty rental platform built specifically for the MIT-ADT University Campus. It provides students with a seamless way to unlock, ride, and pay for EV campus rides.

## Features
- **Firebase Firestore Backend:** Fully serverless and real-time database architecture.
- **Next.js App Router:** Fast and optimized React framework.
- **Glassmorphism UI:** Premium aesthetic using Vanilla CSS without heavy UI frameworks.
- **Smart Pass System:** Tiered subscriptions (Daily, Weekly, Monthly) that override per-minute pricing.
- **Dark Mode Support:** Built-in theme toggling persisted via LocalStorage.
- **Live Ride Logic:** OTP-based unlocking, active timer state persistence, and automatic cost limits.

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/vedkaulwar/campus_ev_services.git
cd campus_ev_services
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your Firebase and NextAuth credentials:

```env
NEXTAUTH_SECRET="your-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Firebase Client configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Firebase Admin configuration (Required for backend functionality)
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

### 4. Database Seeding (First Time Only)
Ensure your Firebase credentials are correct, then run the seed script to populate the 6 campus stations in your Firestore database:
```bash
node scripts/seed-firebase-admin.cjs
```

### 5. Run the Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🌐 Deploying to Vercel

This app was architected to be 100% compatible with Vercel's Edge/Serverless functions. 

1. Install the [Vercel CLI](https://vercel.com/cli) or import the repository through the Vercel Dashboard.
2. Ensure you add **all the environment variables** listed above into your Vercel Project Settings -> Environment Variables.
3. Deploy!

*Note: You must format the `FIREBASE_PRIVATE_KEY` correctly including the `\n` newline characters when pasting it into Vercel.*

## Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Authentication:** NextAuth.js
- **Database:** Firebase Cloud Firestore (Admin SDK + Client SDK)
- **Styling:** CSS Modules / Vanilla CSS
- **Icons:** React Icons
