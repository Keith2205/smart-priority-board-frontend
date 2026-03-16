# 🎯 Smart Priority Board — Frontend

> Beautiful, responsive UI for the Smart Priority Board app

## 📖 About

The frontend for Smart Priority Board — an AI-powered productivity app 
that helps users manage and prioritize tasks using the Eisenhower Matrix. 
Built with Next.js and Tailwind CSS, it connects to the Spring Boot backend API.

## ✨ Features

- 🔐 **Authentication** — Login & register with JWT token management
- 📊 **Priority Board** — Visual Eisenhower Matrix (Q1/Q2/Q3/Q4 columns)
- 📋 **Status Board** — Kanban view (TODO / IN PROGRESS / DONE)
- ➕ **Task Management** — Create, edit, delete tasks with full form
- 🎯 **Smart Quadrant** — Auto-calculates quadrant from Important/Urgent toggles
- 👤 **User Profile** — Set strengths, work hours and work style
- 🤖 **AI Features Page** — Showcase of Phase 2 AI capabilities
- 🗑️ **Activity Log** — View auto-deleted tasks history
- 📱 **Responsive** — Works on desktop and mobile

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| React Hooks | State management |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Smart Priority Board backend running on port 8080

### Install Dependencies
```bash
npm install
```

### Run the App
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📱 Pages

| Route | Description |
|---|---|
| `/login` | Sign in to your account |
| `/register` | Create a new account |
| `/dashboard` | Main priority board |
| `/profile` | User profile settings |
| `/ai` | AI features showcase |
| `/activity-log` | Deleted tasks history |

## 🏗️ Project Structure
```
app/
├── login/          # Login page
├── register/       # Register page
├── dashboard/      # Main Kanban board
├── profile/        # User profile
├── ai/             # AI features page
├── activity-log/   # Activity log page
├── components/
│   ├── Navbar.tsx      # Navigation bar
│   └── TaskModal.tsx   # Task create/edit modal
├── layout.tsx      # Root layout
└── globals.css     # Global styles

lib/
├── api.ts          # API client with auth headers
└── auth.ts         # Token management helpers

types/
└── index.ts        # TypeScript type definitions
```

## 🔗 Backend

This frontend requires the Smart Priority Board backend:
👉 [smart-priority-board](https://github.com/Keith2205/smart-priority-board)

## 🔜 Roadmap

- [ ] Phase 2 — Real AI features with Claude API
- [ ] Drag and drop between quadrants
- [ ] Dark/light theme toggle
- [ ] PWA support (installable on mobile)
- [ ] Real-time updates

## 👨‍💻 Author

**Keith Rodrigues** — [@Keith2205](https://github.com/Keith2205)

---
*Built with ⚡ Next.js and Claude AI assistance*
