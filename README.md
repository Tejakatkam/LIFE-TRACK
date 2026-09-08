<div align="center">
  <img src="frontend/src/assets/logo.png" alt="LifeTrack Logo" width="120" style="border-radius: 24px; margin-bottom: 12px;" />
  <h1>✨ LifeTrack — Intelligent Wellness & Habit Analytics Platform</h1>
  <p><strong>A full-stack, AI-powered personal health companion featuring sub-second Groq LPU inference, 4-macronutrient analytics, personalized workout physiology, multi-timezone cron alerts, and dynamic vector PDF reports.</strong></p>

  <p>
    <a href="https://lifetracker-9s6f.onrender.com/"><img src="https://img.shields.io/badge/🚀%20Live%20Demo-lifetracker--9s6f.onrender.com-00B4D8?style=for-the-badge&logo=render&logoColor=white" alt="Live Demo" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
    <a href="https://groq.com/"><img src="https://img.shields.io/badge/AI%20LPU-Groq%20Cloud%20(Llama%203.3)-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq AI" /></a>
    <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Fallback%20AI-Google%20Gemini%202.0-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" /></a>
  </p>

  <p>
    🌐 <strong>Live Production URL:</strong> <a href="https://lifetracker-9s6f.onrender.com/"><strong>https://lifetracker-9s6f.onrender.com/</strong></a>
  </p>
</div>

<hr/>

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Key Architectural Highlights](#-key-architectural-highlights)
- [Module & Feature Breakdown](#-module--feature-breakdown)
  - [1. ⚡ Sub-Second AI Engine (Groq LPU + Gemini Failover)](#1--sub-second-ai-engine-groq-lpu--gemini-failover)
  - [2. 🥗 Food, Nutrition & 4-Macronutrient Tracking](#2--food-nutrition--4-macronutrient-tracking)
  - [3. 🥣 Flexible Portion & Quantity Unit Selector](#3--flexible-portion--quantity-unit-selector)
  - [4. 🏃 Personalized 4-Factor Physiological Workout Tracker](#4--personalized-4-factor-physiological-workout-tracker)
  - [5. ℹ️ Interactive Health Metric Knowledge Modals (TDEE, BMR, BMI)](#5-️-interactive-health-metric-knowledge-modals-tdee-bmr-bmi)
  - [6. 🌅 Daily Schedule & Habit Rituals](#6--daily-schedule--habit-rituals)
  - [7. 📈 Weekly Consistency & Habit Analytics](#7--weekly-consistency--habit-analytics)
  - [8. ⏰ Multi-Timer Habit Reminders](#8--multi-timer-habit-reminders)
  - [9. 📅 Weekly Recurring Tasks](#9--weekly-recurring-tasks)
  - [10. 📊 Vector PDF Weekly Wellness Digest](#10--vector-pdf-weekly-wellness-digest)
  - [11. 🔐 Stateless OTP Auth & Dark Luxury Design System](#11--stateless-otp-auth--dark-luxury-design-system)
- [Tech Stack Architecture](#-tech-stack-architecture)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)

---

## 🌟 Project Overview

**LifeTrack** is an end-to-end wellness and habit engineering ecosystem designed to help users build sustainable daily disciplines, track nutrition and body metrics, and receive personalized physiological exercise & nutrition guidance.

Engineered with a **Groq Cloud LPU AI Engine** (with dynamic discovery and automatic Gemini failover), a **stateless OTP authentication pipeline**, a **multi-timezone background cron engine**, dynamic **vector-based PDF report generation**, and a bespoke **Dark Luxury UI** built on the Google Font *Jost*, LifeTrack provides an ultra-responsive, peaceful, and scientifically grounded interface for personal growth.

---

## 🚀 Key Architectural Highlights

* **Sub-Second AI Response:** Powered by Groq's Language Processing Units (LPU) running `Llama 3.3 70B Versatile` and `Llama 3.1 8B Instant` with zero-latency model caching.
* **Dual AI Redundancy Hierarchy:** `Groq LPU` $\rightarrow$ `Google Gemini 2.0 Flash` $\rightarrow$ `Deterministic Clinical Mathematical Engine`.
* **Complete 4-Macro Analytics:** Real-time tracking and visual stacked distribution bars for **Protein**, **Carbs**, **Fats**, and **Dietary Fiber**.
* **4-Factor Personalized Physiology:** Workout calorie burn computations tailored to **Weight (kg)**, **Height (cm)**, **Age (years)**, and **Biological Sex**.
* **Interactive Metric Explanations:** Educational popups for **TDEE**, **BMR**, and **BMI** detailing scientific formulas, physiological meanings, and actionable dietary guidelines.
* **Flexible Unit Parsing:** Automatic estimation and manual logging for standard servings, count/pieces (`pcs`), grams (`g`), bowls, plates, slices, and cups.

---

## 🧩 Module & Feature Breakdown

### 1. ⚡ Sub-Second AI Engine (Groq LPU + Gemini Failover)
* **Groq Cloud LPU Acceleration:** Executes natural language nutrition analysis, personalized workout burn estimation, and habit coaching in under 400ms.
* **Zero-Latency Dynamic Model Discovery:** On backend startup, automatically probes the `/v1/models` endpoint for the newest active models, sorts them by capability, and caches the highest-performing model in-memory.
* **Multi-Tiered Failover Protocol:** If Groq encounters rate limits or missing credentials, the request automatically falls back to Google Gemini (`gemini-2.0-flash` / `gemini-1.5-flash`), followed by a deterministic scientific fallback engine.

### 2. 🥗 Food, Nutrition & 4-Macronutrient Tracking
* **4-Macro Breakdown:** Logs and computes exact daily totals for **Protein (g)**, **Carbohydrates (g)**, **Fats (g)**, and **Dietary Fiber (g)**.
* **Stacked Macronutrient Distribution Bar:** Visual color-coded ratio bar depicting the real-time caloric balance of macros consumed throughout the day.
* **Caloric Budget & Net Balance:** Calculates live net calories by subtracting physical step burn and logged workout energy from total food intake:
  $$\text{Net Calories} = \text{Food Intake} - (\text{Step Calorie Burn} + \text{Workout Burn})$$
* **Color-Coded Badges:** Every logged item displays distinct macro tags (🔵 `P: Xg`, 🟠 `C: Yg`, 🟡 `F: Zg`, 🟢 `Fb: Wg`).

### 3. 🥣 Flexible Portion & Quantity Unit Selector
* **Dual Amount & Unit Control:** Switch seamlessly between counting items or measuring mass/volume.
* **Supported Portion Units:**
  * `pcs` (Pieces / Count — e.g. 2 Dosa, 3 Idlis, 2 Eggs)
  * `g` (Grams — e.g. 150g Rice, 200g Chicken)
  * `bowls` (Bowls — e.g. 1 Bowl Dal, 1 Bowl Salad)
  * `plates` (Plates / Servings — e.g. 1 Plate Biryani)
  * `slices` (Slices — e.g. 2 Slices Whole Wheat Bread)
  * `cups` (Cups — e.g. 1 Cup Milk, 1 Cup Oatmeal)
* **Unified Stepper Controls:** Interactive numeric steppers with up/down arrows and direct numerical editing for rapid entry in both manual and AI estimation modes.

### 4. 🏃 Personalized 4-Factor Physiological Workout Tracker
* **4-Factor Personalized Model:** Estimates active calorie burn incorporating the user's specific **Body Mass ($W$ in kg)**, **Stature ($H$ in cm)**, **Chronological Age ($A$ in years)**, and **Biological Sex ($S$)**.
* **Clinical Metabolic Formulas:** Combines Mifflin-St Jeor Basal Metabolic Rate (BMR) with Metabolic Equivalent of Task (MET) physical exertion ratings:
  $$\text{Active Burn} = \text{MET} \times \left(\frac{\text{BMR}}{1440}\right) \times \text{Duration (min)} \times 1.05$$
* **9+ Activity Categories:** Includes *Gym / Strength Training*, *Running / Jogging*, *Brisk Walking*, *Cycling / Biking*, *Swimming*, *Yoga / Stretching*, *HIIT / Circuit Training*, *Sports (Badminton, Football, etc.)*, and *Custom Routines*.
* **Live Net Calorie Integration:** Deducts completed exercise calories immediately from the daily food budget.

### 5. ℹ️ Interactive Health Metric Knowledge Modals (TDEE, BMR, BMI)
* **Clickable Metric Badges:** Interactive buttons on **TDEE**, **BMR**, and **BMI** cards in the Profile tab.
* **Rich Knowledge Modals:**
  * **Full Form & Scientific Classification:** Full acronym expansion and clinical definition.
  * **Physiological Breakdown:** Explanation of how the body expends energy and regulates metabolism.
  * **Underlying Formulas:** Displays the exact Mifflin-St Jeor and Quetelet index formulas used in calculations.
  * **Actionable Guidance:** Explains how to create healthy deficits/surpluses based on personal fitness goals (*Weight Loss*, *Maintenance*, *Muscle Gain*).
* **Smooth UX:** Dismissible via the `✕` close button, background backdrop click, or pressing the `Escape` key.

### 6. 🌅 Daily Schedule & Habit Rituals
* **Circadian Rhythm Management:** Configure daily wake-up and bedtime targets (e.g., `06:30 AM` wake, `10:30 PM` sleep).
* **5 Core Wellness Pillars:** Built-in daily tracking for *Skincare*, *Proper Diet*, *Walking Steps* (custom step goal), *Water Intake* (8 glasses), and *Quality Sleep*.
* **✦ AI Habit Assistant:** Custom habit creator with 20+ aesthetic icons and an AI button that automatically generates concise, motivating habit descriptions.
* **Daily Check-in Toggles:** One-tap completion switches that update habit streaks and feed weekly analytics.

### 7. 📈 Weekly Consistency & Habit Analytics
* **7-Day Consistency Matrix:** Visual Monday-to-Sunday matrix tracking completed (`✓`), missed (`✕`), and upcoming (`—`) habit milestones.
* **Streak & Rate Engine:** Real-time calculation of active streaks, best streaks, and overall habit completion percentages.
* **On-Demand Weekly PDF:** Download a pixel-perfect A4 weekly report directly to your device.
* **📧 Email Weekly Report:** One-click dispatch of the generated PDF report directly to the user's registered inbox.

### 8. ⏰ Multi-Timer Habit Reminders
* **Multiple Alarms per Habit:** Attach multiple reminder timers (e.g., `08:00 AM Morning Routine`, `09:30 PM Night Routine`) to any habit.
* **Background Scheduler Sync:** Automatically synchronizes custom alarms with the backend PostgreSQL database.
* **Automated Email Dispatch:** Real-time 60-second cron runner that dispatches luxury dark-themed email reminders at scheduled times across Indian Standard Time (IST) and UTC.

### 9. 📅 Weekly Recurring Tasks
* **Day-Specific Task Planner:** Schedule tasks dedicated to specific days of the week (e.g., *Hair oiling on Sunday*, *Iron clothes on Monday*).
* **Scheduled Time Alerts:** Set specific reminder times for each weekly task.
* **Weekly Completion State:** Track completion checkboxes for the current week without interrupting automated email reminders.

### 10. 📊 Vector PDF Weekly Wellness Digest
* **Pixel-Perfect A4 Vector Layout:** Built with PDFKit using custom canvas vector paths (`✦`, `✓`, `✕`, `🔥`) to eliminate font encoding glitches.
* **Page 1 — Overview & Habits:** Header banner, 4-stat overview box (`Habit Completion`, `Best Streak`, `Avg Daily Intake`, `Total Steps`), and all 5 daily habits with 7-day badges.
* **Page 2 — Calorie Summary, Body Metrics & Analysis:** Side-by-side consumed vs. net calorie cards with 7-day mini baseline bars, 6-card body metric grid, and 3 personalized AI weekly insight cards.
* **Standardized Naming:** Exported and attached consistently as `"LifeTrack - Weekly Report.pdf"`.

### 11. 🔐 Stateless OTP Auth & Dark Luxury Design System
* **Stateless Email OTP Verification:** Secures user sign-ups with temporary encrypted JWT payloads; accounts are committed to PostgreSQL only after 6-digit OTP email validation.
* **Interactive Password Toggle:** Eye icon button (`👁` / `🙈`) to smoothly reveal or mask passwords on login and registration screens.
* **Unified Typography (`Jost`):** Modern, clean geometric typography across all headings, metric widgets, and modal dialogues.
* **Light / Dark Luxury Theme System:** Seamlessly toggles between Deep Espresso Dark Mode (`#18150f`) and Warm Cream Light Mode (`#f5f0ea`) with persistent preferences in `localStorage`.

---

## 💻 Tech Stack Architecture

### Frontend
- **React.js 18** — Component-driven reactive user interface
- **Vite 7** — High-performance build tooling & Hot Module Replacement
- **Recharts** — Responsive SVG charting for historical weight trends
- **CSS3 Design Tokens** — Bespoke Dark Luxury wellness UI with full Light/Dark mode transitions
- **Google Fonts (`Jost`)** — Unified geometric typography

### Backend
- **Node.js & Express.js** — RESTful API routing and business logic
- **PostgreSQL (`pg`)** — Relational database with automatic schema migrations and connection pooling
- **PDFKit** — Vector-based server-side PDF compilation
- **Node-Cron** — Real-time recurring multi-timezone task scheduler
- **Bcrypt.js & JWT** — Cryptographic password hashing and stateless token authentication

### AI & Cloud Infrastructure
- **Groq Cloud LPU SDK / REST API** — Sub-second inference (`Llama 3.3 70B`, `Llama 3.1 8B`)
- **Google Gemini SDK (`@google/generative-ai`)** — Dynamic multi-model failover (`gemini-2.0-flash`, `gemini-1.5-flash`)
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

-- Food & Nutrition Logs
CREATE TABLE food_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    portion VARCHAR(50) DEFAULT '1 serving',
    grams DECIMAL(6,2),
    calories INT NOT NULL,
    protein DECIMAL(5,2) DEFAULT 0,
    carbs DECIMAL(5,2) DEFAULT 0,
    fat DECIMAL(5,2) DEFAULT 0,
    fiber DECIMAL(5,2) DEFAULT 0,
    meal_time VARCHAR(50),
    log_date DATE NOT NULL,
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
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `/backend` directory:

```env
# Server Configuration
PORT=5000
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
JWT_SECRET=your_super_secret_jwt_key_here

# AI Engines (Groq Cloud LPU Primary + Google Gemini Fallback)
GROQ_API_KEY=gsk_your_groq_cloud_api_key_here
GEMINI_API_KEY=AIzaSy_your_google_ai_studio_gemini_key_here

# Email Notification Service (Vercel Proxy or Direct SMTP)
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

