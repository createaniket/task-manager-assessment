# Task Manager (MERN)

A simple task manager: create, edit, delete, search and filter tasks, with status, priority and due date.

**Stack:** MongoDB + Mongoose, Express, React (Vite), Node.js

## Run locally

Prerequisites: Node 18+ and a MongoDB instance (local, or a free Atlas cluster).

```bash
# 1. API
cd server
cp .env.example .env      # set MONGODB_URI if not using local Mongo
npm install
npm run dev               # http://localhost:9000

# 2. Client (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173 (proxies /api to :9000)
```

## API

| Method | Route            | Description                                   |
| ------ | ---------------- | --------------------------------------------- |
| GET    | `/api/tasks`     | List tasks. Optional `?status=`, `?priority=`, `?q=` |
| POST   | `/api/tasks`     | Create a task                                 |
| PATCH  | `/api/tasks/:id` | Update any subset of fields                   |
| DELETE | `/api/tasks/:id` | Delete a task                                 |

Task fields: `title` (required, ≤120 chars), `description`, `status` (`todo` / `in-progress` / `done`), `priority` (`low` / `medium` / `high`), `dueDate`.
