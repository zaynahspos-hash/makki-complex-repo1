# 🚀 Deployment Guide - Plaza Management System

This guide explains how to deploy your web application to the internet and how to handle your secure credentials (API Keys).

---

## 🔑 Phase 1: Handling Credentials (Environment Variables)

Your `services/firebase.ts` file has been updated to use **Environment Variables**. This is the secure way to handle keys.

### 1. What are they?
Instead of hardcoding keys like `apiKey: "AIza..."` directly in the code, we use placeholders like `import.meta.env.VITE_FIREBASE_API_KEY`.

### 2. Where do they go?
*   **On your Laptop (Local):** They go in the `.env` file in the main folder (root).
*   **On the Internet (Vercel):** They go into "Project Settings" > "Environment Variables".

### 3. The Keys You Need
You need to copy these values from your Firebase Console (Project Settings > General > Your Apps):

| Variable Name | Value (Example) |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyB...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-app-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-app.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:12345:web:abcde` |

---

## 🌐 Phase 2: Deploying to Vercel (Recommended)
Vercel is the easiest way to deploy React/Vite apps.

### Step 1: Push Code to GitHub
1.  Create a repository on GitHub.
2.  Push all your code there.

### Step 2: Connect Vercel
1.  Go to [vercel.com](https://vercel.com) and Sign Up/Login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub repository (`plaza-manager`).
4.  **Important:** In the "Configure Project" screen, look for **"Environment Variables"**.

### Step 3: Enter Credentials
Expand the "Environment Variables" section and add the keys from **Phase 1** one by one.

*   **Key:** `VITE_FIREBASE_API_KEY`
*   **Value:** `AIzaSyB...` (Paste your actual key)
*   *Click Add*
*   (Repeat for all 6 keys).

### Step 4: Deploy
1.  Click **"Deploy"**.
2.  Wait for 1-2 minutes.
3.  Vercel will give you a link (e.g., `https://plaza-manager.vercel.app`).

---

## 🔥 Phase 3: Whitelist Domain in Firebase (CRITICAL)
If you skip this, Login will **fail** on the live site.

1.  Go to **Firebase Console** (console.firebase.google.com).
2.  Select your project.
3.  Go to **Authentication** -> **Settings** tab -> **Authorized Domains**.
4.  Click **"Add Domain"**.
5.  Paste your new Vercel domain (e.g., `plaza-manager.vercel.app`).
6.  Click **Add**.

---

## 📦 Phase 4: Deploying to Firebase Hosting (Alternative)
If you prefer to host directly on Google Firebase:

1.  **Install Firebase CLI:**
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login:**
    ```bash
    firebase login
    ```

3.  **Initialize:**
    ```bash
    firebase init
    ```
    *   Select **Hosting**.
    *   Select "Use an existing project".
    *   **Public directory?** Type `dist` (Important!).
    *   **Configure as single-page app?** Type `Yes` (y).
    *   **Set up automatic builds with GitHub?** `No` (for now).

4.  **Build the App:**
    ```bash
    npm run build
    ```
    *(Note: For Firebase Hosting, it uses your local `.env` file during the build process).*

5.  **Deploy:**
    ```bash
    firebase deploy
    ```

---

## ⚠️ Troubleshooting

**1. "Login Failed" or "Auth Error" on live site?**
*   **Check:** Did you add the Vercel domain to Firebase Authorized Domains? (Phase 3).
*   **Check:** Did you add the Environment Variables in Vercel Settings? (Phase 2, Step 3).

**2. "Permission Denied" on Data?**
*   Check your Firestore Rules in Firebase Console.
*   Ensure the user is actually logged in.

**3. App shows blank screen?**
*   Open Developer Tools (F12) -> Console.
*   If it says "Firebase API Key missing", your Environment Variables are not set correctly in Vercel.
