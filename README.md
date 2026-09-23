# Smart Todo — AI-Assisted Task Management System 🤖✅

> A full-stack task management app where you describe a broad goal and AI breaks it down into structured, actionable tasks — instantly added to your personal todo list.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)

---

## ✨ Features

### 📋 Task Management
- ✅ **CRUD** — Add, edit, delete, and mark tasks complete/pending
- 🔍 **Real-time search** — Filter tasks by title or description instantly
- 🏷️ **Priority levels** — High 🔴 / Medium 🟡 / Low 🟢 with color-coded cards
- 📅 **Due dates** — Smart labels: *Overdue*, *Today*, *Tomorrow*, *Xd left*
- 📊 **Task statistics** — Live counts + animated completion progress bar
- 💾 **LocalStorage persistence** — Tasks survive page refresh without a database

### 🤖 AI Task Generator
- Describe any broad goal in plain text
- AI (powered by **Groq LLM**) breaks it into **3–5 structured, actionable subtasks**
- Preview generated tasks, select the ones you want, and add them in one click
- API key stays **server-side only** — never exposed to the browser

### 🎨 UI/UX
- Dark premium theme with purple gradient accents
- Responsive layout — works on desktop and mobile
- Loading states, input validation, and error handling throughout
- Animated task cards, spring modal entrance, toast notifications

---

## 🗂️ Project Structure

```
smart-todo/
├── server.js          # Express API + Groq AI integration
├── package.json
├── .env.example       # API key template
├── .gitignore         # Keeps .env out of version control
└── public/
    ├── index.html     # Single-page app structure
    ├── style.css      # Full dark theme + responsive styles
    └── app.js         # All frontend logic (class-based JS)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| AI | Groq API (llama3-8b-8192) |
| Storage | Browser LocalStorage |
| Icons | Remix Icons |
| Fonts | Inter (Google Fonts) |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/aasthamuskan/ai_genrated_to_do_list.git
cd ai_genrated_to_do_list
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up your API key
```bash
# Copy the template
cp .env.example .env
```
Open `.env` and add your Groq API key:
```
GROQ_API_KEY=your_api_key_here
```
> Get a free key at [console.groq.com](https://console.groq.com)

### 4. Start the server
```bash
node server.js
```

Open `http://localhost:3000` in your browser 🎉

---

## 🔌 API Endpoint

### `POST /api/generate-tasks`

**Request:**
```json
{ "goal": "Launch my personal portfolio website in 3 weeks" }
```

**Response:**
```json
{
  "tasks": [
    {
      "title": "Design wireframes in Figma",
      "description": "Sketch layout for homepage, about, and projects sections",
      "priority": "high",
      "dueDate": "2024-01-18"
    }
  ]
}
```

---

## 🔒 Security

- Groq API key is stored in `.env` (server-side only)
- `.env` is listed in `.gitignore` — never committed
- All AI requests are proxied through Express — the key is never sent to the browser

---

## 📸 Sections Overview

| Section | Description |
|---|---|
| **Sidebar** | Filter by All / Active / Completed / Overdue / Priority |
| **Stats Bar** | Live totals + animated progress bar |
| **Task Cards** | Priority border, due date badge, hover-reveal edit/delete |
| **AI Generator** | Goal input → preview → select → add |

---

<div align="center">Built with HTML · CSS · JS · Node.js · Groq AI</div>
