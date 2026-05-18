# Star Gym — Premium Gym Management System

**Star Gym** is a highly premium, modern, and responsive Single Page Application (SPA) designed for gym administration, client registrations, and financial analytics. 

Built with a state-of-the-art **Carbon Slate & Cyber Neon Green** glassmorphism design system, it provides a jaw-dropping visual experience out of the box while maintaining extremely fast performance.

---

## 🚀 Key Features

- 📊 **Dynamic Analytics Dashboard**:
  - Real-time KPI summaries for **Total Members**, **Active Clients**, **Estimated Monthly Revenue (₹)**, and **Premium Plan distributions**.
  - **Timezone-Safe Yearly Signup Chart**: A comprehensive, timezone-independent Chart.js bar chart displaying monthly registration growth from January to December of the current year.
  - **Plan Distribution Doughnut**: Visually maps Gold, Silver, and Platinum subscriptions.
- 📋 **Flexible Client Registration Form**:
  - Fully optional fields designed for rapid administrative entries (records can be saved blank, with smart fallback parameters automatically filled in like "Unnamed Member", "N/A", "Unspecified", and 0 fees).
  - Dynamic pricing link: selecting a plan option instantly updates standard plan fees (Platinum = 100, Gold = 60, Silver = 35) but allows manual override.
  - Custom visual status selection tiles (Active, Pending, Expired).
- 🔍 **Real-Time Interactive Search**:
  - A global, header-mounted search bar. Typing in search on *any* page instantly redirects the user to the Members Directory and filters names, emails, phones, or trainers on the fly.
- 💾 **Local-First Architecture**:
  - Powered 100% by browser **LocalStorage** for absolute ease of use, instant trials, and zero-configuration offline caching.
- 🔄 **Supabase Core Integration Ready**:
  - A silent database wrapper is built into the application. If you decide to go live, simply paste your Supabase keys in [app.js](app.js)—the portal will establish a background sync and query live database tables without showing any ugly credentials or warnings to the staff!

---

## 🛠️ Tech Stack & Design Tokens

- **Structure**: Semantic HTML5 with dynamic routing containers.
- **Styling**: Vanilla CSS3 custom tokens (`styles.css`):
  - **Primary Background**: Deep Charcoal Slate (`#0c0d0f`)
  - **Accents**: Neon Energy Green (`#39ff14`), Cyber Cyan (`#00f0ff`), and Golden Orange (`#ffb000`)
  - **Glassmorphism Overlay**: Translucent panels with background blur (`backdrop-filter: blur(12px)`)
- **Icons**: FontAwesome 6.4.0 (CDN)
- **Charts**: Chart.js Core Library (CDN)

---

## 💻 Running the Application (Local Storage Mode)

By default, the application runs entirely on **LocalStorage** using pre-seeded mock profiles (including Marcus Aurelius, Elena Rostova, David Beckham, and Serena Williams) so you can immediately see data populated in the charts and tables!

### Step 1: Open the Portal
Simply open the browser and navigate to:
👉 **[http://127.0.0.1:8080](http://127.0.0.1:8080)**
*(or double-click the `index.html` file in your workspace!)*

---

## ☁️ Setting up Supabase Database Syncing (Optional)

If you wish to scale to a cloud-based server later:

1. Create a table named `members` inside your **Supabase SQL Editor**:
   ```sql
   create table members (
     id uuid default gen_random_uuid() primary key,
     full_name text not null,
     email text not null,
     phone text not null,
     age integer not null,
     gender text not null,
     plan_type text not null,
     status text not null default 'Active',
     join_date date not null default current_date,
     trainer_assigned text,
     monthly_fee numeric not null,
     notes text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```
2. Paste your project details at the very top of [app.js](app.js):
   ```javascript
   const SUPABASE_URL = "YOUR_SUPABASE_URL"; 
   const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; 
   ```
3. Refresh your page! The app will detect the keys, verify the connection in the background, and seamlessly fetch/save all data directly from your live database.
