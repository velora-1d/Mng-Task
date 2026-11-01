# 📋 Mng-Task — Modern Task & Team Workflow Management

[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x%20%2F%20Svelte%205-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Neon Postgres](https://img.shields.io/badge/Database-Neon%20Serverless%20Postgres-00E599?style=flat-square&logo=postgresql&logoColor=black)](https://neon.tech)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![Cloudflare Workers](https://img.shields.io/badge/Runtime-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-0284C7?style=flat-square)](#)

A modern, responsive, high-performance task and workflow management application tailored for individuals and agile teams. Built from the ground up using **SvelteKit 2 with Svelte 5 Runes**, styled with **Tailwind CSS v4**, powered by **Neon Serverless Postgres** via **Drizzle ORM**, and optimized for deployment on **Cloudflare Workers** and **Node.js**.

- 🌐 **Live Demo / Production**: [task.ve-lora.my.id](https://task.ve-lora.my.id)
- 📦 **Repository**: [github.com/velora-1d/Mng-Task](https://github.com/velora-1d/Mng-Task)

---

## ✨ Key Features & Capabilities

### 🔐 1. Authentication & Security
- **Multi-Role RBAC**: Built-in support for `Owner` and `User` roles with granular permission guards.
- **Public Registration (`/register`)**: Allows new team members to sign up with instant auto-login. The first registered user is automatically elevated to `Owner`.
- **Universal Password Hashing**: Web Crypto PBKDF2 with salt and Argon2id fallback for seamless, non-blocking execution across Cloudflare Workers and Node.js environments.
- **Session Defense & Impersonation**: Sliding session expiration stored in secure HTTP-only cookies, with Owner account impersonation and permanent user removal with automatic task reassignment safety.
- **Accessibility & UX**: Universal show/hide password toggle button integrated into all credentials fields.

### 📝 2. Full Task Lifecycle & Scheduling
- **DateTime Scheduling**: Granular time tracking with both **Start Date & Time** and **Due Date & Time** across all views.
- **Interactive Views**:
  - **Data Table**: Filter by status, priority, and assignees with server-side sorting, debounce search, and pagination.
  - **Kanban Board**: Drag-and-drop / stage management for `TODO`, `IN_PROGRESS`, and `DONE` tasks.
- **Audit Trail & Metadata**: Tracks task creations, status updates, completion timestamps, and assignments.
- **Data Portability**: One-click CSV export respecting current filters and sorting parameters.

### 📊 3. Dashboard, Reminders & Reports
- **Executive Dashboard**: Real-time KPI summary cards (Total Tasks, In Progress, Completed, Overdue).
- **Smart Reminders**: Dedicated alert countdowns for approaching deadlines and priority queues.
- **Analytics & Reporting (`/reports`)**: Interactive visual breakdown of completion ratios, workload distribution, and team throughput.

### 📱 4. Shell Architecture & Impeccable Design
- **Desktop Sidebar Navigation**:
  - Collapsible layout (`256px` expanded to `72px` collapsed) with `localStorage` state persistence.
  - Active pill indicators with solid icon badges.
  - Real-time WIB live clock in header.
- **Mobile Ergonomics**:
  - Full edge-to-edge floating expanding capsule bottombar (maximum 5 items with a dedicated 5th item popup sheet).
  - Clean topbar with no clutter and touch-friendly targets (minimum 44px).
- **Theming & Color Palette**:
  - 100% Light and Dark mode support powered by CSS custom properties and Ember Studio design tokens.
  - Color palette intentionally calibrated to cool blues, neutrals, and dark tones.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | [SvelteKit 2](https://kit.svelte.dev) + [Svelte 5](https://svelte.dev) | Reactive fullstack framework utilizing Svelte 5 Runes (`$state`, `$derived`, `$props`) |
| **Styling & Tokens** | [Tailwind CSS v4](https://tailwindcss.com) + Custom Tokens | Modern utility-first CSS engine with dark mode custom variants |
| **Database** | [Neon Postgres](https://neon.tech) | Serverless PostgreSQL connected over HTTP with zero connection exhaustion |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team) + Drizzle Kit | Type-safe SQL schema definitions, automated migrations, and seed scripts |
| **Validation** | [Zod v4](https://zod.dev) | Schema validation for user inputs and server actions |
| **Runtime / Edge** | [Cloudflare Workers](https://workers.cloudflare.com) / Node.js | `@sveltejs/adapter-cloudflare` and `@sveltejs/adapter-node` support |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm** or **pnpm**
- A **Neon Postgres** connection string (or any standard PostgreSQL instance)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/velora-1d/Mng-Task.git
   cd Mng-Task
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file and insert your PostgreSQL credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   DATABASE_URL="postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   SESSION_SECRET="your-super-secret-random-key"
   ```

4. **Initialize Database Schema & Seeding**:
   ```bash
   # Generate Drizzle migration files
   npm run db:generate

   # Apply migrations to database
   npm run db:migrate

   # (Optional) Seed initial demo owner, users, and tasks
   npm run db:seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📂 Project Structure

```text
Mng-Task/
├── drizzle/                      # Drizzle ORM migrations & SQL artifacts
├── kanban/                       # Kanban tracking & workflow board
├── src/
│   ├── app.css                   # Global CSS & Tailwind imports
│   ├── tokens.css                # Semantic design tokens & dark mode definitions
│   ├── hooks.server.ts           # Authentication hooks, session resolver, route guards
│   ├── routes/
│   │   ├── (app)/                # Protected application shell
│   │   │   ├── dashboard/        # KPI analytics & overview
│   │   │   ├── tasks/            # List, Kanban, Create, Edit, & Detail views
│   │   │   ├── reminders/        # Deadline alerts & reminder queues
│   │   │   ├── reports/          # Workload & completion reports
│   │   │   ├── users/            # User administration & role controls (Owner only)
│   │   │   └── settings/         # Profile, password, & theme preferences
│   │   ├── login/                # Split-screen modern login portal
│   │   ├── register/             # Public user onboarding portal
│   │   ├── logout/               # Session invalidation endpoint
│   │   └── api/                  # API endpoints (impersonation, status checks)
│   └── lib/
│       ├── components/           # Reusable UI primitives, shell layouts, & icons
│       │   ├── icons/            # SVG vector icon components
│       │   ├── shell/            # Collapsible Sidebar, Header, & Mobile Bottombar
│       │   ├── tasks/            # Task modals, filters, & cards
│       │   └── ui/               # Buttons, Inputs, Dialogs, Tables, Toasts
│       ├── server/               # Server-only utilities & DB connection
│       │   ├── db/               # Drizzle schemas, migrations, & seeds
│       │   ├── auth/             # Session hashing & cookie helpers
│       │   └── audit.ts          # Central audit log recorder
│       └── utils/                # Date formatting & helper functions
├── wrangler.jsonc                # Cloudflare Workers configuration
└── package.json                  # Scripts & project dependencies
```

---

## 📜 Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with hot reload |
| `npm run build` | Compiles the production build (Cloudflare Workers / Node.js) |
| `npm run preview` | Previews the locally built production application |
| `npm run check` | Runs SvelteKit synchronization and TypeScript type checking |
| `npm run db:generate` | Generates Drizzle migrations based on schema modifications |
| `npm run db:migrate` | Runs pending database migrations against `DATABASE_URL` |
| `npm run db:seed` | Seeds the database with default owner, users, and tasks |
| `npm run db:reset` | Runs migrations and re-seeds the database from scratch |

---

## 🚢 Deployment

### Cloudflare Workers / Pages
The application is preconfigured with `@sveltejs/adapter-cloudflare` and `wrangler.jsonc`:
```bash
# Build and deploy to Cloudflare
npx wrangler deploy
```

Make sure the following environment secret is configured in your Cloudflare dashboard:
- `DATABASE_URL`: Connection string to your Neon serverless Postgres instance.

---

## 🛡️ License

This project is licensed under the MIT License — see the LICENSE file for details.

Developed with precision by **Velora Digital** & **Pak Hakim**.
