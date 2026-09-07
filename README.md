# CareerPilot

CareerPilot is an AI-assisted career workspace for resume analysis, skill detection, career improvement suggestions, and job matching.

## Features
- Responsive career dashboard
- Candidate registration and login
- JWT authentication
- Password hashing with bcrypt
- Resume text analysis
- Profile strength scoring
- Skill detection
- Resume improvement suggestions
- Job search and level filtering
- Job match scores
- Saved jobs
- Personal career dashboard
- MongoDB persistence with in-memory fallback
- REST API

## Tech Stack
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt

## Run locally
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```
Open `frontend/index.html` with VS Code Live Server.

API: `http://localhost:5000`

## API
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/analyze`
- `GET /api/jobs`
- `POST /api/saved-jobs`
- `GET /api/dashboard`
