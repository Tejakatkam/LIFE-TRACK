<div align="center">
  <img src="frontend/src/assets/logo.png" alt="LifeTrack Logo" width="120" style="border-radius: 24px; margin-bottom: 12px;" />
  <h1>✨ LifeTrack — Intelligent Wellness & Habit Analytics Platform</h1>
  <p><strong>A full-stack, AI-powered personal health companion featuring automated multi-timezone reminders, dynamic vector PDF reporting, and predictive metabolic insights.</strong></p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
    <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/AI-Google%20Gemini%202.0-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" /></a>
    <a href="https://render.com/"><img src="https://img.shields.io/badge/Deploy-Render%20%2B%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deployment" /></a>
  </p>
</div>

<hr/>

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Module & Feature Breakdown](#-module--feature-breakdown)
  - [1. 🥗 Food & Nutrition Tracking](#1--food--nutrition-tracking)
  - [2. 🌅 Daily Schedule & Habit Rituals](#2--daily-schedule--habit-rituals)
  - [3. 📈 Weekly Consistency & Habit Analytics](#3--weekly-consistency--habit-analytics)
  - [4. ⏰ Multi-Timer Habit Reminders](#4--multi-timer-habit-reminders)
  - [5. 📅 Weekly Recurring Tasks](#5--weekly-recurring-tasks)
  - [6. 👤 Profile, Health Metrics & Weight Analytics](#6--profile-health-metrics--weight-analytics)
  - [7. 📊 Vector PDF Weekly Wellness Digest](#7--vector-pdf-weekly-wellness-digest)
  - [8. 🔐 Stateless OTP Auth & Dark Luxury Design System](#8--stateless-otp-auth--dark-luxury-design-system)
- [Tech Stack Architecture](#-tech-stack-architecture)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)

---

## 🌟 Project Overview

**LifeTrack** is an end-to-end wellness and habit engineering ecosystem designed to help users build sustainable daily disciplines, track nutrition and historical body metrics, and receive AI-curated fitness recommendations. 

Engineered with a **stateless OTP authentication pipeline**, a **distributed multi-timezone cron engine**, dynamic **vector-based PDF report generation**, and **Google Gemini AI integration**, LifeTrack provides a peaceful, minimal, and high-performance interface for personal growth.

---

## 🧩 Module & Feature Breakdown

### 1. 🥗 Food & Nutrition Tracking
* **Calorie & Meal Logging:** Fast logging of daily meals with name, calorie count, and timestamp.
* **Live Caloric Budget Bar:** Real-time visual progress bar tracking consumed calories against daily metabolic targets.
* **Persistent Daily History:** Grouped meal records stored in PostgreSQL with instant removal and automated daily total computation.

### 2. 🌅 Daily Schedule & Habit Rituals
* **Circadian Rhythm Management:** Set and adjust daily wake-up and bedtime targets (e.g., `06:30 AM` wake, `10:30 PM` sleep).
* **5 Core Wellness Pillars:** Built-in daily tracking for *Skincare*, *Proper Diet*, *Walking Steps* (custom step goal), *Water Intake* (8 glasses), and *Quality Sleep*.
* **✦ Gemini AI Habit Assistant:** Custom habit creator with 20+ aesthetic icons and an AI button that automatically generates concise, motivating habit descriptions.
* **Daily Check-in Toggles:** One-tap completion switches that update habit streaks and feed weekly analytics.
* **Custom Habit Management:** Hide, delete, or restore default and custom habits with one click.

### 3. 📈 Weekly Consistency & Habit Analytics
* **7-Day Consistency Matrix:** Visual Monday-to-Sunday matrix tracking completed (`✓`), missed (`✕`), and upcoming (`—`) habit milestones.
* **Streak & Rate Engine:** Real-time calculation of active streaks, best streaks, and overall habit completion percentages.
* **On-Demand Weekly PDF:** Download a pixel-perfect A4 weekly report directly to your device.
* **📧 Email Weekly Report:** One-click dispatch of the generated PDF report directly to the user's registered inbox.

### 4. ⏰ Multi-Timer Habit Reminders
* **Multiple Alarms per Habit:** Attach multiple reminder timers (e.g., `08:00 AM Morning Routine`, `09:30 PM Night Routine`) to any habit.
* **Background Scheduler Sync:** Automatically synchronizes custom alarms with the backend PostgreSQL database.
* **Automated Email Dispatch:** Real-time 60-second cron runner that dispatches luxury dark-themed email reminders at scheduled times across Indian Standard Time (IST) and UTC.

### 5. 📅 Weekly Recurring Tasks
* **Day-Specific Task Planner:** Schedule tasks dedicated to specific days of the week (e.g., *Hair oiling on Sunday*, *Iron clothes on Monday*).
* **Scheduled Time Alerts:** Set specific reminder times for each weekly task.
* **Weekly Completion State:** Track completion checkboxes for the current week without interrupting automated email reminders.
* **Automated Day Alarms:** Dispatches weekly task reminder emails on the matching weekday and time.

### 6. 👤 Profile, Health Metrics & Weight Analytics
* **Clinical Health Calculations:** Computes real-time BMI (with weight class classification), BMR (Mifflin-St Jeor formula), and TDEE (Total Daily Energy Expenditure).
* **Interactive Weight Trajectory:** Historical weight tracking visualized with responsive Recharts line graphs.
* **Smart Daily Upsert:** Log weight anytime; submitting multiple times on the same date safely updates today's log without chart duplication.
* **🤖 Gemini AI Calorie Recommendation:** Analyzes age, weight, height, gender, and fitness goals (*Loss*, *Maintain*, *Gain*) to generate personalized caloric recommendations with tailored explanations, supported by a live refresh button and deterministic fallback.

### 7. 📊 Vector PDF Weekly Wellness Digest
* **Pixel-Perfect A4 Vector Layout:** Built with PDFKit using custom canvas vector paths (`✦`, `✓`, `✕`, `🔥`) to eliminate font encoding glitches.
* **Page 1 — Overview & Habits:** Header banner, 4-stat overview box (`Habit Completion`, `Best Streak`, `Avg Daily Intake`, `Total Steps`), and all 5 daily habits with 7-day badges.
* **Page 2 — Calorie Summary, Body Metrics & Analysis:** Side-by-side consumed vs. net calorie cards with 7-day mini baseline bars, 6-card body metric grid, and 3 personalized AI weekly insight cards.
* **Standardized Naming:** Exported and attached consistently as `"LifeTrack - Weekly Report.pdf"`.

### 8. 🔐 Stateless OTP Auth & Dark Luxury Design System
* **Stateless Email OTP Verification:** Secures user sign-ups with temporary encrypted JWT payloads; accounts are committed to PostgreSQL only after 6-digit OTP email validation.
* **Interactive Password Toggle:** Eye icon button (`👁` / `🙈`) to smoothly reveal or mask passwords on login and registration screens.
* **Light / Dark Luxury Theme System:** Seamlessly toggles between Deep Espresso Dark Mode (`#18150f`) and Warm Cream Light Mode (`#f5f0ea`) with persistent preferences in `localStorage`.
* **Strict Single-User Email Isolation:** Sanitized email routing ensuring all notifications, OTPs, and reports are strictly dispatched to the intended recipient with zero multi-recipient leaks.

---

## 💻 Tech Stack Architecture

### Frontend
- **React.js 18** — Component-driven reactive user interface
- **Vite 7** — High-performance build tooling & Hot Module Replacement
- **Recharts** — Responsive SVG charting for historical weight trends
- **CSS3 Design Tokens** — Bespoke Dark Luxury wellness UI with full Light/Dark mode transitions

### Backend
- **Node.js & Express.js** — RESTful API routing and business logic
- **PostgreSQL (`pg`)** — Relational database with automatic schema migrations and connection pooling
- **PDFKit** — Vector-based server-side PDF compilation
- **Node-Cron** — Real-time recurring multi-timezone task scheduler
- **Bcrypt.js & JWT** — Cryptographic password hashing and stateless token authentication

### AI & Cloud Infrastructure
- **Google Gemini SDK (`@google/generative-ai`)** — Dynamic multi-model failover (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-pro`) with regex JSON extraction
- **Vercel Serverless Microservice** — Cloud SMTP proxy for seamless Gmail delivery
- **Render Web Services** — Persistent backend hosting
- **Nodemailer** — Robust multi-provider email dispatch engine

---

## 🗄️ Database Schema

```sql
-- Core Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    age INT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    gender VARCHAR(20),
    goal VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habit Alarms & Timers
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    habit_id VARCHAR(100),
    habit_name VARCHAR(255),
    icon VARCHAR(50),
    time VARCHAR(20) NOT NULL,
    label VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Scheduled Tasks
CREATE TABLE weekly_tasks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    day VARCHAR(50) NOT NULL,
    reminder_time VARCHAR(20),
    done_this_week BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical Weight Records
CREATE TABLE weight_records (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    frequency VARCHAR(10) DEFAULT 'daily',
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food & Nutrition Logs
CREATE TABLE food_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    calories INT NOT NULL,
    meal_time VARCHAR(50),
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `/backend` directory:

```env
# Server
PORT=5000
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
JWT_SECRET=your_super_secret_jwt_key_here

# AI Engine
GEMINI_API_KEY=your_google_ai_studio_gemini_key

# Email Service (Vercel Proxy or Direct)
MAIL_SERVICE_URL=https://your-vercel-project.vercel.app/api/send-email
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_letter_app_password
```

---

## 📦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Tejakatkam/LIFE-TRACK.git
cd LIFE-TRACK
```

### 2. Setup & Start Backend
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

### 3. Setup & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

<div align="center">
  <sub>Crafted with passion for clean code and holistic wellness • <strong>LifeTrack</strong></sub>
</div>
