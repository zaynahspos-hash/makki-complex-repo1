# 🏢 Plaza Management System - Web Application

**Developed by:** Mehar Shoaib  
**Version:** 1.2.0  
**Tech Stack:** React (Vite), Firebase (Auth & Firestore), Tailwind CSS, Lucide Icons.

---

## 📖 Overview
The **Plaza Management System** is a mobile-first, responsive web application designed to streamline the operations of a commercial plaza. It handles shop occupancy, monthly rent/maintenance bill generation, payment collection, financial reporting, and staff management with granular permission controls.

---

## ⚙️ Core Architecture & Data Flow

The application is built on a **Serverless Architecture** using Google Firebase.

### 1. Authentication Flow
*   **Provider:** Firebase Authentication (Email/Password).
*   **Logic:**
    1.  User logs in via `Login.tsx`.
    2.  `AppContext` listener (`onAuthStateChanged`) triggers.
    3.  The app fetches the user's profile from the `users` Firestore collection.
    4.  **Role Check:**
        *   If `role === 'admin'`, full access is granted.
        *   If `role === 'staff'`, the app checks the `permissions` array (e.g., `['rent', 'dashboard']`) to determine which tabs to show.
    5.  **Session:** Persisted via Firebase SDK until explicit Logout.

### 2. Database Structure (Firestore)
The database is NoSQL. Here is the exact schema breakdown:

#### 📂 `users` Collection
Stores staff and admin profiles.
```json
{
  "uid": "firebase_auth_uid",
  "email": "staff@plaza.com",
  "displayName": "John Doe",
  "role": "staff", // or 'admin'
  "permissions": ["dashboard", "rent", "shops"], // Controls UI visibility
  "password": "encrypted_or_plain_ref", // Stored for admin reference (optional)
  "createdAt": "ISO_Date_String"
}
```

#### 📂 `shops` Collection
Stores physical inventory of the plaza.
```json
{
  "id": "auto_generated_id",
  "shopNumber": "101",
  "floor": 1,
  "ownerName": "Ali Electronics",
  "phone": "03001234567",
  "status": "Occupied", // 'Occupied' or 'Vacant'
  "monthlyRent": 45000,
  "monthlyMaintenance": 5000
}
```

#### 📂 `rentRecords` Collection
This is the core financial ledger for Rent.
*   **Logic:** One document per shop per month.
*   **Transactions:** Stored as an array *inside* the document (Sub-document pattern) to keep reads efficient.
```json
{
  "id": "auto_generated",
  "month": "2024-02", // YYYY-MM format for easy sorting
  "shopId": "ref_to_shops",
  "shopNumber": "101",
  "amount": 45000, // Total Due
  "collected": 20000, // Total Paid so far
  "status": "Partial", // 'Pending', 'Paid', 'Partial'
  "transactions": [
    {
      "id": "tx_123",
      "amount": 20000,
      "date": "2024-02-05, 10:00 AM",
      "collectedBy": "Staff Name",
      "note": "Cash payment"
    }
  ]
}
```

#### 📂 `maintenanceCollections` Collection
Identical structure to `rentRecords` but tracks maintenance fees separately.

#### 📂 `settings` Collection (Document: `plaza`)
Stores global app configuration.
```json
{
  "plazaName": "City Centre Plaza",
  "address": "Main Boulevard",
  "contactPhone": "03001234567",
  "lateFeePercentage": 5
}
```

---

## 🖥️ Module & Tab Breakdown

### 1. 📊 Dashboard
**Purpose:** Real-time financial health check.
*   **Data Aggregation:** The dashboard does *client-side calculation*. It fetches all records and sums up:
    *   `Total Revenue` = Sum of all `collected` fields (Rent + Maintenance).
    *   `Pending Dues` = Sum of (`amount` - `collected`) for all non-paid records.
    *   `Occupancy` = Count of shops where `status === 'Occupied'`.
*   **Live Updates:** Uses Firestore real-time listeners (`onSnapshot`), so numbers update instantly without refreshing when a payment is made on another device.

### 2. 🏪 Shops Management
**Purpose:** Inventory management.
*   **CRUD:** Create, Read, Update, Shop details.
*   **Status Logic:**
    *   **Occupied:** Included in monthly bill generation.
    *   **Vacant:** Excluded from billing cycles.
*   **Actions:** Admin/Staff (with permission) can edit rent amounts, owner details, or mark shops as vacant.

### 3. 💰 Rent Management (Deep Dive)
This is the most complex module.

#### A. Bill Generation (The "Generate All" Button)
1.  **Trigger:** User clicks "Generate All" and selects a month.
2.  **Process:**
    *   Loop through all **Occupied** shops.
    *   Check if a `rentRecord` already exists for that `shopId` + `month`.
    *   If **No**: Create a new document with `collected: 0` and `status: Pending`.
    *   If **Yes**: Skip (prevents duplicate billing).

#### B. Payment Collection
1.  **Trigger:** Clicking "Collect" on a specific record.
2.  **Logic:**
    *   User enters Amount.
    *   App calculates new `collected` total.
    *   **Status Update:**
        *   If `newCollected >= totalAmount` → **Paid**.
        *   If `newCollected > 0` AND `< totalAmount` → **Partial**.
    *   **Transaction Log:** A new object is pushed to the `transactions` array with the timestamp and the name of the logged-in user collecting the cash.

#### C. Export & Reporting
*   **Filtering:** Filters by Month, Shop Name, or Status.
*   **CSV Export:** Generates a downloadable `.csv` file in the browser containing payment history, balances, and transaction notes for the selected period.

#### D. WhatsApp Integration
*   Generates a dynamic WhatsApp link with a pre-filled message containing the Shop Name, Month, Total Due, Amount Paid, and Balance.

### 4. 🛠️ Maintenance
*   **Logic:** Mirrors the **Rent Management** logic exactly but targets the `maintenanceCollections` database collection.
*   Separating Rent and Maintenance allows for distinct financial tracking and independent payment statuses.

### 5. ⚙️ Settings & Staff Management
**Access Control:** Only accessible by **Admin** or Staff with the `'settings'` permission.

#### A. General Tab
*   Update Plaza Name, Address, and Contact Info.
*   These details reflect globally on the Sidebar and printed reports.

#### B. Staff Management Tab (The "Secondary Auth" Trick)
*   **Challenge:** Firebase doesn't allow creating a *new* user without logging out the *current* user.
*   **Solution:** The app initializes a **secondary Firebase App instance** in the background (`SecondaryApp`).
    *   It uses this secondary instance to `createUserWithEmailAndPassword` for the new staff member.
    *   It then writes the user details to the Firestore `users` collection.
    *   Finally, it deletes the secondary instance.
*   **Result:** The Admin stays logged in while creating new Staff accounts securely.

#### C. App Info Tab
*   Displays Developer Credits (**Mehar Shoaib**).
*   Dynamic Support Links (WhatsApp, Email).
*   Social Media Links.

---

## 🔐 Security Rules (Firestore)
The app is secured using Firebase Security Rules.
*   **Current Rule:** `allow read, write: if request.auth != null;`
*   **Explanation:** Only users who are authenticated (logged in) can read or write data. An anonymous user cannot access the database API.
*   **Frontend Security:** The UI hides buttons (Delete, Settings) based on roles, preventing accidental unauthorized actions.

---

## 🚀 How to Run Locally

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```

3.  **Build for Production:**
    ```bash
    npm run build
    ```

---

## 📱 Mobile Optimization
*   **Touch Targets:** Buttons are sized for fingers.
*   **Layout:** Uses Flexbox and Grid to stack columns on mobile (1 col) vs desktop (3 cols).
*   **Navigation:** Sidebar for Desktop, Bottom Tab Bar for Mobile.
*   **Input Handling:** Prevents zoom-in on inputs for iOS devices.

---

**© 2024 Plaza Manager.**  
*App made by Mehar Shoaib, made for Amir Sahab with love ❤️*
