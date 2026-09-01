<div align="center">
  <img src="frontend/src/assets/logo.png" alt="LifeTrack Logo" width="120" style="border-radius: 24px; margin-bottom: 12px;" />
  <h1>✨ LifeTrack — Intelligent Wellness & Habit Analytics Platform</h1>
  <p><strong>A full-stack, AI-powered personal health companion featuring automated multi-timezone reminders, dynamic PDF reporting, and predictive health insights.</strong></p>

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
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)

---

## 🌟 Project Overview

**LifeTrack** is an end-to-end wellness tracking ecosystem designed to help users build sustainable habits, monitor nutrition and weight progress, and receive AI-curated fitness recommendations. 

Engineered with a **stateless OTP authentication pipeline**, a **distributed multi-timezone cron engine**, dynamic **vector-based PDF report generation**, and **Google Gemini AI integration**, LifeTrack provides an intuitive yet powerful interface for daily personal growth.

---

## 🚀 Key Features

<table>
  <tr>
    <td width="50%">
      <h3>🔐 Stateless OTP Verification</h3>
      <p>Prevents phantom database clutter by encrypting pending registration profiles into temporary JWT tokens. Accounts are committed to PostgreSQL only upon successful 6-digit email OTP validation.</p>
    </td>
    <td width="50%">
      <h3>🤖 Gemini AI Health Engine</h3>
      <p>Generates tailored caloric targets and motivating habit descriptions using Google Gemini AI, with automated deterministic fallback to the Mifflin-St Jeor metabolic formula.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⏰ Multi-Timezone Scheduler</h3>
      <p>A background cron engine that matches scheduled habit alarms across Indian Standard Time (IST), UTC, and local server time every 60 seconds without dropping alerts.</p>
    </td>
    <td width="50%">
      <h3>📊 Vector PDF Wellness Reports</h3>
      <p>Server-side vector rendering of 3-page weekly wellness reports using PDFKit. Generates comprehensive progress breakdowns, habit consistency charts, and dietary metrics.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📈 Dynamic Weight & Nutrition Tracking</h3>
      <p>Interactive data visualization with Recharts for historical weight trajectory, target milestones, BMI categories, BMR calculation, and daily calorie breakdowns.</p>
    </td>
    <td width="50%">
      <h3>🛡️ Cloud SMTP Proxy Microservice</h3>
      <p>A serverless Vercel proxy that bridges HTTPS payloads from cloud backends to Gmail SMTP, eliminating cloud firewall port restrictions with zero custom domain overhead.</p>
    </td>
  </tr>
</table>

---

## 💻 Tech Stack

### Frontend
- **React.js 18** — Component-driven reactive user interface
- **Vite 7** — High-performance frontend build pipeline and HMR
- **Recharts** — Responsive SVG charting for weight trajectory and analytics
- **CSS3 / Vanilla Variables** — Bespoke Dark Luxury wellness UI with responsive grid design

### Backend
- **Node.js & Express.js** — RESTful API architecture and routing
- **PostgreSQL (`pg`)** — Relational database with automated schema bootstrapping and connection pooling
- **PDFKit** — Server-side dynamic PDF compilation with vector typography and tables
- **Node-Cron** — Real-time recurring background task engine
- **Bcrypt.js & JSON Web Tokens (JWT)** — Cryptographic password hashing and stateless authorization

### AI & Cloud Infrastructure
- **Google Gemini 2.0 / 1.5 Flash SDK (`@google/generative-ai`)** — Personalized metabolic analysis and motivational copywriting
- **Vercel Serverless Functions** — Cloud proxy microservice for SMTP delivery
- **Render Web Services** — Persistent backend server hosting
- **Resend & Nodemailer** — Dual-engine email delivery architecture

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
    frequency VARCHAR(10) NOT NULL,
    record_date DATE NOT NULL,
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
