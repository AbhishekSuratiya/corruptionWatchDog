# Corruption Watchdog

An anonymous, transparent corruption reporting platform built to empower citizens to safely report corruption and hold public officials accountable.

**Live Deployment URL:** [https://corruptionwatchdog.web.app/](https://corruptionwatchdog.web.app/)

---

## 🚀 Key Features

*   **Anonymous Reporting:** Report corruption safely without revealing your identity.
*   **Live Statistics Dashboard:** Aggregated data visualizations showing real-time platform activity (total reports, pending, resolved, and active regions).
*   **Interactive India Heat Map:** Interactive regional density map highlighting corruption risk levels across Indian cities using coordinates-based markers.
*   **Defaulter Directory:** Searchable registry of corruption reports grouping repeated offenses against specific individuals.
*   **Robust Admin Dashboard:** Manage and moderate reports, check analytics, bulk delete or update report statuses, and export data as CSV files.
*   **One-Click Sample Seeding:** Instantly populate your database with 100+ programmatically generated, realistic sample reports with randomly generated Indian names, coordinates, and Picsum images.

---

## 🛠️ Technology Stack

*   **Frontend Core:** React, TypeScript, Vite
*   **Styling & Design:** Tailwind CSS + Vanilla CSS custom animations (glassmorphism cards, neon glows, smooth micro-interactions)
*   **Map Visualization:** Leaflet & React Leaflet
*   **Data Analytics:** Recharts (Area & Pie charts)
*   **Database & Auth:** Firebase (Authentication, Firestore Database, Cloud Storage)

---

## 💻 Local Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🔐 Credentials & Verification Rules

### Test Administrator Credentials
To access the moderator/admin dashboard, sign in with:
*   **Email:** `abhishek@corruptionwatchdog.in`
*   **Password:** `100a100B200@`

### Database Seeding
1. Sign in as Admin.
2. Click **"Seed Sample Database Data"** in the Admin Dashboard header to instantly write exactly 100 sample documents.

### Firestore Rules Deployment
If you make changes to security rules locally in `firestore.rules`, deploy them to the live project using:
```bash
firebase deploy --only firestore:rules
```
